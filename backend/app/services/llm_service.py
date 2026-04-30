"""LLM service — calls the z-ai gateway directly over HTTP.

This module replicates the behaviour of the Node.js ``z-ai-web-dev-sdk``
by reading the same configuration (``.z-ai-config``) and sending requests
to the OpenAI-compatible ``/chat/completions`` endpoint.

The service is designed as a singleton so the ``httpx.AsyncClient`` can
be reused across requests.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

# ── Prompt templates (identical to the Next.js route) ───────────────

SYSTEM_PROMPT = """You are an expert technical interviewer from a top product company (Google, Amazon, Microsoft level).

Your job is to ask high-quality interview questions based on the candidate profile.

Instructions:
- Ask ONE question at a time
- Adjust difficulty dynamically based on the candidate's responses
- Mix question types based on the candidate's role and level:
  - DSA (if SDE, Frontend, Backend, Full Stack)
  - System Design (if Intermediate or Senior level)
  - HR/Behavioral (for all roles)
- Do NOT give the answer or any hints
- Keep it realistic and interview-like
- If the candidate answers well, increase difficulty for the next question
- If the candidate struggles, decrease difficulty slightly
- Vary the question types - don't ask the same type repeatedly
- For DSA questions, be specific about the problem and constraints
- For System Design questions, ask about real-world scenarios
- For HR questions, ask about past experiences and situational responses

You MUST respond with valid JSON in exactly this format:
{
  "question": "your question here",
  "type": "DSA" or "System Design" or "HR/Behavioral",
  "difficulty": "easy" or "medium" or "hard"
}

IMPORTANT: Only respond with the JSON object, nothing else. No markdown, no explanation."""

FOLLOWUP_PROMPT = """Based on the candidate's response, generate the next interview question. Consider:
1. The quality of their previous answer - adjust difficulty accordingly
2. Vary question types - don't repeat the same type consecutively
3. Build on the conversation naturally
4. Keep track of what topics have been covered

You MUST respond with valid JSON in exactly this format:
{
  "question": "your question here",
  "type": "DSA" or "System Design" or "HR/Behavioral",
  "difficulty": "easy" or "medium" or "hard"
}

IMPORTANT: Only respond with the JSON object, nothing else. No markdown, no explanation."""

FEEDBACK_PROMPT = """You are an expert technical interviewer evaluating a candidate's interview performance.

Based on the full interview transcript, provide detailed feedback. Evaluate:
1. Technical depth of answers
2. Communication clarity
3. Problem-solving approach
4. Areas of strength
5. Areas needing improvement

You MUST respond with valid JSON in exactly this format:
{
  "overallScore": <number from 1-10>,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "summary": "A 2-3 sentence overall assessment of the candidate's performance"
}

IMPORTANT: Only respond with the JSON object, nothing else. No markdown, no explanation."""

HINT_PROMPT = """You are an expert technical interviewer helping a candidate in practice mode.

The candidate has asked for a hint on the current question. Provide a helpful hint that:
1. Points them in the right direction without giving away the answer
2. Suggests an approach or technique to consider
3. Is concise (1-2 sentences max)

You MUST respond with valid JSON in exactly this format:
{
  "hint": "your helpful hint here"
}

IMPORTANT: Only respond with the JSON object, nothing else. No markdown, no explanation."""

EVALUATE_PROMPT = """You are an expert technical interviewer evaluating a candidate's answer to a specific question.

Evaluate the answer on a scale of 1-5 stars:
- 1: Completely incorrect or no relevant response
- 2: Partially correct but major gaps
- 3: Acceptable answer with some good points
- 4: Strong answer with minor gaps
- 5: Excellent, comprehensive answer

Provide brief feedback (1 sentence).

You MUST respond with valid JSON in exactly this format:
{
  "score": <number from 1-5>,
  "feedback": "brief feedback sentence"
}

IMPORTANT: Only respond with the JSON object, nothing else. No markdown, no explanation."""


# ── Response parsers ─────────────────────────────────────────────────

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


def parse_json_response(text: str) -> dict[str, Any]:
    """Parse a JSON response from the LLM, with fallback extraction.

    Tries direct ``json.loads`` first; if that fails, extracts the
    outermost ``{…}`` block and retries.
    """
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass

    import re
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except (json.JSONDecodeError, TypeError):
            pass

    return {
        "question": text.replace("{", "").replace("}", "").replace('"', "").strip()
        or "Tell me about a challenging technical problem you solved recently.",
        "type": "HR/Behavioral",
        "difficulty": "medium",
    }


def parse_hint_response(text: str) -> dict[str, Any]:
    """Parse a hint response from the LLM."""
    try:
        parsed = json.loads(text)
        return {"hint": parsed.get("hint") or "Think about breaking the problem into smaller sub-problems."}
    except (json.JSONDecodeError, TypeError):
        pass

    import re
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            parsed = json.loads(match.group(0))
            return {"hint": parsed.get("hint") or "Think about breaking the problem into smaller sub-problems."}
        except (json.JSONDecodeError, TypeError):
            pass

    return {"hint": text.replace("{", "").replace("}", "").replace('"', "").strip()
            or "Think about breaking the problem into smaller sub-problems."}


def parse_evaluate_response(text: str) -> dict[str, Any]:
    """Parse an evaluate response from the LLM."""
    try:
        parsed = json.loads(text)
        return {
            "score": max(1, min(5, int(parsed.get("score", 3)))),
            "feedback": parsed.get("feedback") or "Answer recorded.",
        }
    except (json.JSONDecodeError, TypeError, ValueError):
        pass

    import re
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            parsed = json.loads(match.group(0))
            return {
                "score": max(1, min(5, int(parsed.get("score", 3)))),
                "feedback": parsed.get("feedback") or "Answer recorded.",
            }
        except (json.JSONDecodeError, TypeError, ValueError):
            pass

    return {"score": 3, "feedback": "Answer recorded."}


def parse_feedback_response(text: str) -> dict[str, Any]:
    """Parse a feedback response from the LLM."""
    try:
        parsed = json.loads(text)
        return _coerce_feedback(parsed)
    except (json.JSONDecodeError, TypeError):
        pass

    import re
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            parsed = json.loads(match.group(0))
            return _coerce_feedback(parsed)
        except (json.JSONDecodeError, TypeError):
            pass

    return {
        "overallScore": 5,
        "strengths": ["Completed the interview session"],
        "improvements": ["Continue practicing technical concepts"],
        "summary": "Thank you for completing the interview session. Keep practicing!",
    }


def _coerce_feedback(parsed: dict) -> dict[str, Any]:
    """Normalise a parsed feedback dict into the expected shape."""
    return {
        "overallScore": max(1, min(10, int(parsed.get("overallScore", 5)))),
        "strengths": (parsed.get("strengths") or ["Completed the interview session"])[:5]
            if isinstance(parsed.get("strengths"), list)
            else ["Completed the interview session"],
        "improvements": (parsed.get("improvements") or ["Continue practicing"])[:5]
            if isinstance(parsed.get("improvements"), list)
            else ["Continue practicing"],
        "summary": parsed.get("summary") or "Thank you for completing the interview session.",
    }


# ── LLM Service ─────────────────────────────────────────────────────

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

    async def chat_completion(
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
            "Authorization": f"Bearer {settings.llm_api_key}",
            "X-Z-AI-From": "Z",
        }
        if settings.llm_chat_id:
            headers["X-Chat-Id"] = settings.llm_chat_id
        if settings.llm_user_id:
            headers["X-User-Id"] = settings.llm_user_id
        if settings.llm_token:
            headers["X-Token"] = settings.llm_token

        url = f"{settings.llm_base_url.rstrip('/')}/chat/completions"
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


# ── Module-level singleton ───────────────────────────────────────────

llm_service = LLMService()
