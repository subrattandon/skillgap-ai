"""Interview service — business logic for the interview flow.

This module contains all the context-building and orchestration logic
that was previously in the Next.js API route.  It delegates actual LLM
calls to :mod:`app.services.llm_service`.
"""

from __future__ import annotations

import logging
from typing import Any

from ..models.interview import (
    EvaluateResponse,
    FeedbackDetail,
    FeedbackResponse,
    HintResponse,
    InterviewMessage,
    QuestionResponse,
)
from ..models.profile import CandidateProfile
from .llm_service import (
    EVALUATE_PROMPT,
    FEEDBACK_PROMPT,
    FOLLOWUP_PROMPT,
    HINT_PROMPT,
    SYSTEM_PROMPT,
    llm_service,
    normalize_difficulty,
    normalize_type,
    parse_evaluate_response,
    parse_feedback_response,
    parse_hint_response,
    parse_json_response,
)

logger = logging.getLogger(__name__)


# ── Helpers ──────────────────────────────────────────────────────────

def build_type_focus_instruction(question_types: list[str] | None) -> str:
    """Build a context instruction line when the candidate has selected
    specific question types to focus on."""
    if not question_types:
        return ""

    type_labels: dict[str, str] = {
        "DSA": "DSA (Data Structures and Algorithms)",
        "System Design": "System Design",
        "HR/Behavioral": "HR/Behavioral",
    }
    labels = ", ".join(type_labels.get(t, t) for t in question_types)
    return (
        f"- Question Focus: The candidate wants to focus on these question types: {labels}. "
        "Prioritize these types but you may occasionally include others for variety."
    )


def _format_messages(messages: list[InterviewMessage]) -> str:
    """Format interview messages into a human-readable transcript."""
    lines: list[str] = []
    for msg in messages:
        if msg.role == "interviewer":
            qtype = msg.questionType or "Question"
            diff = msg.difficulty or ""
            lines.append(f"\nInterviewer [{qtype}, {diff}]: {msg.content}")
        elif msg.role == "candidate":
            lines.append(f"\nCandidate: {msg.content}")
    return "".join(lines)


def _profile_context(profile: CandidateProfile) -> str:
    """Build the candidate profile section of a prompt."""
    skills = profile.skills or ""
    return (
        f"- Role: {profile.role or 'Not specified'}\n"
        f"- Experience Level: {profile.level or 'Not specified'}\n"
        f"- Skills: {skills or 'Not specified'}"
    )


# ── Action handlers ──────────────────────────────────────────────────

async def handle_start(profile: CandidateProfile) -> QuestionResponse:
    """Generate the first interview question for a candidate.

    Parameters
    ----------
    profile:
        The candidate's full profile including optional practice mode
        and question type preferences.

    Returns
    -------
    QuestionResponse
        The generated question with type and difficulty.
    """
    type_focus = build_type_focus_instruction(
        profile.questionTypes if profile.questionTypes else None
    )

    practice_line = (
        "- Practice Mode: Enabled (hints are available)\n"
        if profile.practiceMode
        else ""
    )

    user_prompt = (
        f"Candidate Profile:\n"
        f"{_profile_context(profile)}\n"
        f"- Previous Performance Score: {profile.previousScore or 'Not available'}\n"
        f"{practice_line}"
        f"{type_focus}\n\n"
        "Generate the first interview question for this candidate. "
        "Start with an appropriate difficulty level based on their experience."
    )

    raw = await llm_service.chat_completion(SYSTEM_PROMPT, user_prompt)
    parsed = parse_json_response(raw)

    return QuestionResponse(
        question=parsed.get("question", ""),
        type=normalize_type(parsed.get("type", "")),
        difficulty=normalize_difficulty(parsed.get("difficulty", "")),
    )


async def handle_next(
    profile: CandidateProfile,
    messages: list[InterviewMessage],
    question_types: list[str] | None = None,
) -> QuestionResponse:
    """Generate the next interview question based on conversation context.

    Parameters
    ----------
    profile:
        The candidate's profile.
    messages:
        The conversation history so far.
    question_types:
        Optional question type filter selected by the candidate.

    Returns
    -------
    QuestionResponse
        The next question with type and difficulty.
    """
    type_focus = build_type_focus_instruction(question_types)

    user_prompt = (
        f"Candidate Profile:\n"
        f"{_profile_context(profile)}\n"
        f"- Previous Performance Score: {profile.previousScore or 'Not available'}\n"
        f"{type_focus}\n\n"
        f"Conversation so far:\n{_format_messages(messages)}\n\n"
        f"{FOLLOWUP_PROMPT}"
    )

    raw = await llm_service.chat_completion(SYSTEM_PROMPT, user_prompt)
    parsed = parse_json_response(raw)

    return QuestionResponse(
        question=parsed.get("question", ""),
        type=normalize_type(parsed.get("type", "")),
        difficulty=normalize_difficulty(parsed.get("difficulty", "")),
    )


async def handle_skip(
    profile: CandidateProfile,
    messages: list[InterviewMessage],
    question_types: list[str] | None = None,
) -> QuestionResponse:
    """Generate an easier or different question after a skip.

    Parameters
    ----------
    profile:
        The candidate's profile.
    messages:
        The conversation history so far.
    question_types:
        Optional question type filter.

    Returns
    -------
    QuestionResponse
        A (typically easier) question with type and difficulty.
    """
    type_focus = build_type_focus_instruction(question_types)

    user_prompt = (
        f"Candidate Profile:\n"
        f"{_profile_context(profile)}\n"
        f"{type_focus}\n\n"
        "The candidate chose to skip the last question. This may indicate "
        "the topic was too difficult or unfamiliar.\n\n"
        f"Conversation so far:\n{_format_messages(messages)}\n\n"
        "Since the candidate skipped, generate a slightly easier question "
        "or a question on a different topic. Vary the question type.\n\n"
        f"{FOLLOWUP_PROMPT}"
    )

    raw = await llm_service.chat_completion(SYSTEM_PROMPT, user_prompt)
    parsed = parse_json_response(raw)

    return QuestionResponse(
        question=parsed.get("question", ""),
        type=normalize_type(parsed.get("type", "")),
        difficulty=normalize_difficulty(parsed.get("difficulty", "")),
    )


async def handle_hint(
    profile: CandidateProfile,
    messages: list[InterviewMessage],
    question: str | None = None,
) -> HintResponse:
    """Generate a hint for the current question.

    If *question* is not provided, the last interviewer message is used.

    Parameters
    ----------
    profile:
        The candidate's profile.
    messages:
        The conversation history.
    question:
        Optional explicit question text.

    Returns
    -------
    HintResponse
        A hint for the current question.
    """
    current_question = question
    if not current_question:
        interviewer_msgs = [m for m in messages if m.role == "interviewer"]
        if interviewer_msgs:
            current_question = interviewer_msgs[-1].content

    user_prompt = (
        f"Candidate Profile:\n{_profile_context(profile)}\n\n"
    )
    if current_question:
        user_prompt += f"Current Question: {current_question}\n\n"
    user_prompt += HINT_PROMPT

    try:
        raw = await llm_service.chat_completion(HINT_PROMPT, user_prompt)
        parsed = parse_hint_response(raw)
        return HintResponse(hint=parsed["hint"])
    except Exception:
        logger.exception("Hint generation error, returning fallback")
        return HintResponse(
            hint="Think about breaking the problem into smaller sub-problems "
            "and consider common data structures that might help."
        )


async def handle_evaluate(
    question: str,
    answer: str,
    profile: CandidateProfile,
) -> EvaluateResponse:
    """Evaluate a single question-answer pair.

    Parameters
    ----------
    question:
        The interview question.
    answer:
        The candidate's answer.
    profile:
        Candidate profile for context.

    Returns
    -------
    EvaluateResponse
        Score (1-5) and brief feedback.
    """
    user_prompt = (
        f"Candidate Profile:\n{_profile_context(profile)}\n\n"
        f"Question: {question}\n\n"
        f"Candidate's Answer: {answer}\n\n"
        f"{EVALUATE_PROMPT}"
    )

    try:
        raw = await llm_service.chat_completion(EVALUATE_PROMPT, user_prompt)
        parsed = parse_evaluate_response(raw)
        return EvaluateResponse(score=parsed["score"], feedback=parsed["feedback"])
    except Exception:
        logger.exception("Evaluate error, returning fallback")
        return EvaluateResponse(score=3, feedback="Answer recorded.")


async def handle_feedback(
    profile: CandidateProfile,
    messages: list[InterviewMessage],
) -> FeedbackResponse:
    """Generate comprehensive feedback for the entire interview.

    Parameters
    ----------
    profile:
        The candidate's profile.
    messages:
        The full interview transcript.

    Returns
    -------
    FeedbackResponse
        Overall score, strengths, improvements, and summary.
    """
    transcript = (
        f"Candidate Profile:\n{_profile_context(profile)}\n\n"
        f"Interview Transcript:\n{_format_messages(messages)}\n\n"
        f"{FEEDBACK_PROMPT}"
    )

    try:
        raw = await llm_service.chat_completion(FEEDBACK_PROMPT, transcript)
        parsed = parse_feedback_response(raw)
        return FeedbackResponse(
            feedback=FeedbackDetail(
                overallScore=parsed["overallScore"],
                strengths=parsed["strengths"],
                improvements=parsed["improvements"],
                summary=parsed["summary"],
            )
        )
    except Exception:
        logger.exception("Feedback generation error, returning fallback")
        return FeedbackResponse(
            feedback=FeedbackDetail(
                overallScore=5,
                strengths=["Completed the interview session"],
                improvements=[
                    "Continue practicing technical concepts",
                    "Work on articulating your thought process",
                ],
                summary="Thank you for completing the interview session. Keep practicing!",
            )
        )
