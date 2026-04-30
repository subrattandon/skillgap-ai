"""LLM Service for the SkillGap AI engine.

Reads prompt templates from the ``prompts/`` directory and calls the
z-ai gateway API directly over HTTP using ``httpx``.  Provides a clean
Python API for question generation, answer evaluation, overall feedback,
and hint generation.

Usage
-----
    from llm_service import LLMService

    svc = LLMService()
    q = await svc.generate_question(
        role="SDE", level="Mid", skills="Python, React"
    )
    print(q)  # {"question": "...", "type": "DSA", "difficulty": "medium"}

    await svc.close()
"""

from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"

ZAI_API_KEY: str = os.getenv("ZAI_API_KEY", "")
ZAI_GATEWAY_URL: str = os.getenv("ZAI_GATEWAY_URL", "http://localhost:8080/v1")

# Optional extra headers read from .z-ai-config (same as the Node.js SDK)
_ZAI_CHAT_ID: Optional[str] = os.getenv("ZAI_CHAT_ID")
_ZAI_USER_ID: Optional[str] = os.getenv("ZAI_USER_ID")
_ZAI_TOKEN: Optional[str] = os.getenv("ZAI_TOKEN")

# ── Prompt loading ─────────────────────────────────────────────────────

_prompt_cache: dict[str, str] = {}


def _load_prompt(name: str) -> str:
    """Load a prompt template from the ``prompts/`` directory.

    Results are cached so the file is only read once per process.
    """
    if name not in _prompt_cache:
        path = PROMPTS_DIR / f"{name}.txt"
        if not path.exists():
            raise FileNotFoundError(f"Prompt file not found: {path}")
        _prompt_cache[name] = path.read_text(encoding="utf-8").strip()
        logger.debug("Loaded prompt '%s' (%d chars)", name, len(_prompt_cache[name]))
    return _prompt_cache[name]


# ── Response parsers ───────────────────────────────────────────────────


def normalize_type(raw: str) -> str:
    """Normalize question type to one of the three canonical values."""
    t = (raw or "").lower().strip()
    if "system" in t or "design" in t:
        return "System Design"
    if "hr" in t or "behavioral" in t or "behaviour" in t:
        return "HR/Behavioral"
    return "DSA"


def normalize_difficulty(raw: str) -> str:
    """Normalize difficulty to one of the three canonical values."""
    d = (raw or "").lower().strip()
    if d in ("hard", "difficult"):
        return "hard"
    if d in ("medium", "moderate"):
        return "medium"
    return "easy"


def _extract_json(text: str) -> Optional[dict[str, Any]]:
    """Try to parse JSON from the LLM response text.

    Attempts direct ``json.loads`` first; if that fails, extracts the
    outermost ``{…}`` block and retries.
    """
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except (json.JSONDecodeError, TypeError):
            pass

    return None


# ── LLM Service ───────────────────────────────────────────────────────


class LLMService:
    """Async service that calls the z-ai gateway's ``/chat/completions`` endpoint.

    Uses a single ``httpx.AsyncClient`` instance that should be closed on
    application shutdown via :meth:`close`.
    """

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    # ── lifecycle ────────────────────────────────────────────────

    async def _get_client(self) -> httpx.AsyncClient:
        """Return (or lazily create) the shared HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=httpx.Timeout(60.0))
        return self._client

    async def close(self) -> None:
        """Close the underlying HTTP client. Call on app shutdown."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    # ── low-level API ────────────────────────────────────────────

    async def _chat_completion(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """Send a chat completion request to the z-ai gateway.

        Parameters
        ----------
        system_prompt:
            The system/assistant message that sets behaviour.
        user_prompt:
            The user message containing context and instructions.

        Returns
        -------
        str
            The raw text content of the model's response.
        """
        client = await self._get_client()

        headers: dict[str, str] = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {ZAI_API_KEY}",
            "X-Z-AI-From": "Z",
        }
        if _ZAI_CHAT_ID:
            headers["X-Chat-Id"] = _ZAI_CHAT_ID
        if _ZAI_USER_ID:
            headers["X-User-Id"] = _ZAI_USER_ID
        if _ZAI_TOKEN:
            headers["X-Token"] = _ZAI_TOKEN

        url = f"{ZAI_GATEWAY_URL.rstrip('/')}/chat/completions"
        payload = {
            "messages": [
                {"role": "assistant", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "thinking": {"type": "disabled"},
        }

        logger.debug("LLM request to %s", url)
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()

        data = response.json()
        content: str = ""
        choices = data.get("choices") or []
        if choices:
            content = (choices[0].get("message") or {}).get("content", "").strip()

        logger.debug("LLM response (first 200 chars): %s", content[:200])
        return content

    # ── context builders ─────────────────────────────────────────

    @staticmethod
    def _build_type_focus_instruction(question_types: Optional[list[str]] = None) -> str:
        """Build an instruction string for question type filtering."""
        if not question_types:
            return ""
        type_labels: dict[str, str] = {
            "DSA": "DSA (Data Structures and Algorithms)",
            "System Design": "System Design",
            "HR/Behavioral": "HR/Behavioral",
        }
        labels = ", ".join(type_labels.get(t, t) for t in question_types)
        return (
            f"- Question Focus: The candidate wants to focus on these question types: "
            f"{labels}. Prioritize these types but you may occasionally include others for variety."
        )

    @staticmethod
    def _format_profile(
        role: str,
        level: str,
        skills: Optional[str] = None,
        previous_score: Optional[str] = None,
        practice_mode: bool = False,
        question_types: Optional[list[str]] = None,
    ) -> str:
        """Build the candidate profile section for the prompt."""
        type_focus = LLMService._build_type_focus_instruction(question_types)
        return (
            f"Candidate Profile:\n"
            f"- Role: {role}\n"
            f"- Experience Level: {level}\n"
            f"- Skills: {skills or 'Not specified'}\n"
            f"- Previous Performance Score: {previous_score or 'Not available'}\n"
            f"{'- Practice Mode: Enabled (hints are available)' if practice_mode else ''}\n"
            f"{type_focus}\n"
        )

    @staticmethod
    def _format_messages(
        messages: list[dict[str, str]],
    ) -> str:
        """Format a conversation transcript for the prompt."""
        lines: list[str] = []
        for msg in messages:
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role == "interviewer":
                qtype = msg.get("questionType", "Question")
                diff = msg.get("difficulty", "")
                lines.append(f"\nInterviewer [{qtype}, {diff}]: {content}")
            elif role == "candidate":
                lines.append(f"\nCandidate: {content}")
        return "".join(lines)

    # ── public API ───────────────────────────────────────────────

    async def generate_question(
        self,
        role: str,
        level: str,
        skills: Optional[str] = None,
        previous_score: Optional[str] = None,
        practice_mode: bool = False,
        question_types: Optional[list[str]] = None,
    ) -> dict[str, str]:
        """Generate the first interview question for a candidate.

        Parameters
        ----------
        role:
            Target role (e.g. "SDE", "Frontend", "Backend").
        level:
            Experience level (e.g. "Junior", "Mid", "Senior").
        skills:
            Comma-separated skills string.
        previous_score:
            Score from a previous interview session.
        practice_mode:
            Whether the interview is in practice mode.
        question_types:
            Optional list of question types to focus on.

        Returns
        -------
        dict[str, str]
            ``{"question": ..., "type": ..., "difficulty": ...}``
        """
        system_prompt = _load_prompt("question")
        profile = self._format_profile(
            role, level, skills, previous_score, practice_mode, question_types
        )
        user_prompt = (
            f"{profile}\n"
            "Generate the first interview question for this candidate. "
            "Start with an appropriate difficulty level based on their experience."
        )

        try:
            raw = await self._chat_completion(system_prompt, user_prompt)
            parsed = _extract_json(raw)
            if parsed and "question" in parsed:
                return {
                    "question": parsed["question"],
                    "type": normalize_type(parsed.get("type", "")),
                    "difficulty": normalize_difficulty(parsed.get("difficulty", "")),
                }
        except Exception:
            logger.exception("generate_question failed")

        return {
            "question": "Tell me about a challenging technical problem you solved recently.",
            "type": "HR/Behavioral",
            "difficulty": "medium",
        }

    async def generate_next_question(
        self,
        role: str,
        level: str,
        skills: Optional[str] = None,
        previous_score: Optional[str] = None,
        messages: Optional[list[dict[str, str]]] = None,
        question_types: Optional[list[str]] = None,
    ) -> dict[str, str]:
        """Generate the next interview question based on conversation context.

        Parameters
        ----------
        role, level, skills, previous_score, question_types:
            Same as :meth:`generate_question`.
        messages:
            List of conversation messages with ``role``, ``content``,
            and optionally ``questionType`` / ``difficulty`` keys.

        Returns
        -------
        dict[str, str]
            ``{"question": ..., "type": ..., "difficulty": ...}``
        """
        system_prompt = _load_prompt("question")
        profile = self._format_profile(
            role, level, skills, previous_score, question_types=question_types
        )
        followup = (
            "Based on the candidate's response, generate the next interview question. Consider:\n"
            "1. The quality of their previous answer - adjust difficulty accordingly\n"
            "2. Vary question types - don't repeat the same type consecutively\n"
            "3. Build on the conversation naturally\n"
            "4. Keep track of what topics have been covered\n\n"
            "You MUST respond with valid JSON in exactly this format:\n"
            '{"question": "...", "type": "DSA" or "System Design" or "HR/Behavioral", '
            '"difficulty": "easy" or "medium" or "hard"}\n\n'
            "IMPORTANT: Only respond with the JSON object, nothing else. No markdown, no explanation."
        )
        transcript = self._format_messages(messages or [])
        user_prompt = f"{profile}\nConversation so far:\n{transcript}\n\n{followup}"

        try:
            raw = await self._chat_completion(system_prompt, user_prompt)
            parsed = _extract_json(raw)
            if parsed and "question" in parsed:
                return {
                    "question": parsed["question"],
                    "type": normalize_type(parsed.get("type", "")),
                    "difficulty": normalize_difficulty(parsed.get("difficulty", "")),
                }
        except Exception:
            logger.exception("generate_next_question failed")

        return {
            "question": "Can you describe a time you had to debug a complex production issue?",
            "type": "HR/Behavioral",
            "difficulty": "medium",
        }

    async def generate_skip_question(
        self,
        role: str,
        level: str,
        skills: Optional[str] = None,
        messages: Optional[list[dict[str, str]]] = None,
        question_types: Optional[list[str]] = None,
    ) -> dict[str, str]:
        """Generate an easier / different question after the candidate skips.

        Parameters
        ----------
        role, level, skills, question_types:
            Same as :meth:`generate_question`.
        messages:
            Conversation transcript.

        Returns
        -------
        dict[str, str]
            ``{"question": ..., "type": ..., "difficulty": ...}``
        """
        system_prompt = _load_prompt("question")
        profile = self._format_profile(role, level, skills, question_types=question_types)
        followup = (
            "Since the candidate skipped, generate a slightly easier question "
            "or a question on a different topic. Vary the question type.\n\n"
            "Based on the candidate's response, generate the next interview question. Consider:\n"
            "1. The quality of their previous answer - adjust difficulty accordingly\n"
            "2. Vary question types - don't repeat the same type consecutively\n"
            "3. Build on the conversation naturally\n"
            "4. Keep track of what topics have been covered\n\n"
            "You MUST respond with valid JSON in exactly this format:\n"
            '{"question": "...", "type": "DSA" or "System Design" or "HR/Behavioral", '
            '"difficulty": "easy" or "medium" or "hard"}\n\n'
            "IMPORTANT: Only respond with the JSON object, nothing else. No markdown, no explanation."
        )
        transcript = self._format_messages(messages or [])
        user_prompt = (
            f"{profile}\n"
            "The candidate chose to skip the last question. "
            "This may indicate the topic was too difficult or unfamiliar.\n\n"
            f"Conversation so far:\n{transcript}\n\n{followup}"
        )

        try:
            raw = await self._chat_completion(system_prompt, user_prompt)
            parsed = _extract_json(raw)
            if parsed and "question" in parsed:
                return {
                    "question": parsed["question"],
                    "type": normalize_type(parsed.get("type", "")),
                    "difficulty": normalize_difficulty(parsed.get("difficulty", "")),
                }
        except Exception:
            logger.exception("generate_skip_question failed")

        return {
            "question": "What is the difference between a stack and a queue?",
            "type": "DSA",
            "difficulty": "easy",
        }

    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        role: Optional[str] = None,
        level: Optional[str] = None,
    ) -> dict[str, Any]:
        """Evaluate a candidate's answer to a specific question.

        Parameters
        ----------
        question:
            The interview question text.
        answer:
            The candidate's answer text.
        role:
            Optional candidate role for context.
        level:
            Optional candidate experience level for context.

        Returns
        -------
        dict[str, Any]
            ``{"score": <1-5>, "feedback": "..."}``
        """
        system_prompt = _load_prompt("evaluation")
        profile_section = ""
        if role or level:
            profile_section = f"Candidate Profile:\n- Role: {role or 'N/A'}\n- Experience Level: {level or 'N/A'}\n\n"
        user_prompt = (
            f"{profile_section}"
            f"Question: {question}\n\n"
            f"Candidate's Answer: {answer}\n\n"
            f"{system_prompt}"
        )

        try:
            raw = await self._chat_completion(system_prompt, user_prompt)
            parsed = _extract_json(raw)
            if parsed and "score" in parsed:
                return {
                    "score": max(1, min(5, int(parsed["score"]))),
                    "feedback": parsed.get("feedback") or "Answer recorded.",
                }
        except Exception:
            logger.exception("evaluate_answer failed")

        return {"score": 3, "feedback": "Answer recorded."}

    async def generate_feedback(
        self,
        role: str,
        level: str,
        skills: Optional[str] = None,
        messages: Optional[list[dict[str, str]]] = None,
    ) -> dict[str, Any]:
        """Generate overall interview feedback based on the full transcript.

        Parameters
        ----------
        role:
            Candidate's target role.
        level:
            Candidate's experience level.
        skills:
            Comma-separated skills string.
        messages:
            Full conversation transcript.

        Returns
        -------
        dict[str, Any]
            ``{"overallScore": <1-10>, "strengths": [...], "improvements": [...], "summary": "..."}``
        """
        system_prompt = _load_prompt("feedback")
        transcript = self._format_messages(messages or [])
        user_prompt = (
            f"Candidate Profile:\n"
            f"- Role: {role}\n"
            f"- Experience Level: {level}\n"
            f"- Skills: {skills or 'Not specified'}\n\n"
            f"Interview Transcript:\n{transcript}\n\n"
            f"{system_prompt}"
        )

        try:
            raw = await self._chat_completion(system_prompt, user_prompt)
            parsed = _extract_json(raw)
            if parsed and "overallScore" in parsed:
                return {
                    "overallScore": max(1, min(10, int(parsed["overallScore"]))),
                    "strengths": (
                        parsed["strengths"][:5]
                        if isinstance(parsed.get("strengths"), list)
                        else ["Completed the interview session"]
                    ),
                    "improvements": (
                        parsed["improvements"][:5]
                        if isinstance(parsed.get("improvements"), list)
                        else ["Continue practicing"]
                    ),
                    "summary": parsed.get("summary") or "Thank you for completing the interview session.",
                }
        except Exception:
            logger.exception("generate_feedback failed")

        return {
            "overallScore": 5,
            "strengths": ["Completed the interview session"],
            "improvements": ["Continue practicing technical concepts"],
            "summary": "Thank you for completing the interview session. Keep practicing!",
        }

    async def generate_hint(
        self,
        question: str,
        role: Optional[str] = None,
        level: Optional[str] = None,
        skills: Optional[str] = None,
    ) -> dict[str, str]:
        """Generate a hint for the current interview question.

        Parameters
        ----------
        question:
            The question the candidate needs a hint for.
        role:
            Optional candidate role for context.
        level:
            Optional candidate experience level for context.
        skills:
            Optional candidate skills for context.

        Returns
        -------
        dict[str, str]
            ``{"hint": "..."}``
        """
        system_prompt = _load_prompt("hint")
        profile_section = ""
        if role or level:
            profile_section = (
                f"Candidate Profile:\n"
                f"- Role: {role or 'N/A'}\n"
                f"- Experience Level: {level or 'N/A'}\n"
                f"- Skills: {skills or 'Not specified'}\n\n"
            )
        user_prompt = (
            f"{profile_section}"
            f"Current Question: {question}\n\n"
            f"{system_prompt}"
        )

        try:
            raw = await self._chat_completion(system_prompt, user_prompt)
            parsed = _extract_json(raw)
            if parsed and "hint" in parsed:
                return {"hint": parsed["hint"]}
        except Exception:
            logger.exception("generate_hint failed")

        return {"hint": "Think about breaking the problem into smaller sub-problems and consider common data structures that might help."}


# ── Module-level singleton ─────────────────────────────────────────────

llm_service = LLMService()
