"""Interview request/response Pydantic models.

Defines the schema for all API endpoints under ``/api/interview``.
The single POST endpoint accepts an *action* field that determines
which sub-schema is relevant for the request and response.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

from .profile import CandidateProfile, QuestionType


# ── Shared ───────────────────────────────────────────────────────────

class InterviewMessage(BaseModel):
    """A single message in the interview conversation."""

    role: Literal["interviewer", "candidate", "system"]
    content: str
    questionType: Optional[str] = None
    difficulty: Optional[str] = None


# ── Request models ───────────────────────────────────────────────────

class InterviewRequest(BaseModel):
    """Unified request body for the ``/api/interview`` endpoint.

    The ``action`` field determines which other fields are required:

    * **start**  – ``profile`` is required.
    * **next**   – ``profile`` and ``messages`` are required.
    * **skip**   – ``profile`` and ``messages`` are required.
    * **hint**   – ``profile`` and ``messages`` are required; ``question`` is optional.
    * **evaluate** – ``question`` and ``answer`` are required; ``profile`` (brief) is required.
    * **feedback** – ``profile`` and ``messages`` are required.
    """

    action: Literal["start", "next", "skip", "hint", "evaluate", "feedback"]
    profile: Optional[CandidateProfile] = None
    messages: Optional[list[InterviewMessage]] = None
    question: Optional[str] = None
    answer: Optional[str] = None


# ── Response models ──────────────────────────────────────────────────

class QuestionResponse(BaseModel):
    """Response for ``start``, ``next``, and ``skip`` actions."""

    success: bool = True
    question: str
    type: str
    difficulty: str


class HintResponse(BaseModel):
    """Response for the ``hint`` action."""

    success: bool = True
    hint: str


class EvaluateResponse(BaseModel):
    """Response for the ``evaluate`` action."""

    success: bool = True
    score: int = Field(ge=1, le=5)
    feedback: str


class FeedbackDetail(BaseModel):
    """Detailed AI-generated feedback for the full interview."""

    overallScore: int = Field(ge=1, le=10)
    strengths: list[str]
    improvements: list[str]
    summary: str


class FeedbackResponse(BaseModel):
    """Response for the ``feedback`` action."""

    success: bool = True
    feedback: FeedbackDetail


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str
