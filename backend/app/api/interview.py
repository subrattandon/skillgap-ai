"""Interview API endpoints.

All interview-related operations are handled by a single ``POST /api/interview``
endpoint whose ``action`` field determines the specific operation:

========= ======== ====================================================
Action    Method   Description
========= ======== ====================================================
start     POST     Generate the first interview question
next      POST     Generate the next question based on conversation
skip      POST     Generate an easier / different question
hint      POST     Provide a hint for the current question
evaluate  POST     Score a specific question-answer pair
feedback  POST     Generate comprehensive interview feedback
========= ======== ====================================================
"""

from __future__ import annotations

import logging
from typing import Union

from fastapi import APIRouter, HTTPException

from ..models.interview import (
    EvaluateResponse,
    FeedbackResponse,
    HintResponse,
    InterviewRequest,
    QuestionResponse,
)
from ..services.interview_service import (
    handle_evaluate,
    handle_feedback,
    handle_hint,
    handle_next,
    handle_skip,
    handle_start,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["interview"])


@router.post(
    "/interview",
    response_model=Union[
        QuestionResponse,
        HintResponse,
        EvaluateResponse,
        FeedbackResponse,
    ],
    responses={
        200: {"description": "Successful response matching the requested action"},
        400: {"description": "Invalid request or missing required fields"},
        500: {"description": "Internal server error during LLM call"},
    },
)
async def interview_endpoint(body: InterviewRequest) -> dict:
    """Handle all interview actions via a single POST endpoint.

    The ``action`` field in the request body determines which handler
    is invoked and which other fields are required.
    """
    action = body.action

    # ── feedback ────────────────────────────────────────────────
    if action == "feedback":
        if not body.profile or not body.messages:
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: profile and messages for feedback action",
            )
        return await handle_feedback(body.profile, body.messages)

    # ── hint ────────────────────────────────────────────────────
    if action == "hint":
        if not body.profile:
            raise HTTPException(
                status_code=400,
                detail="Missing required field: profile for hint action",
            )
        messages = body.messages or []
        return await handle_hint(body.profile, messages, body.question)

    # ── evaluate ────────────────────────────────────────────────
    if action == "evaluate":
        if not body.question or not body.answer or not body.profile:
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: question, answer, and profile for evaluate action",
            )
        return await handle_evaluate(body.question, body.answer, body.profile)

    # ── start / next / skip all require role and level ──────────
    if not body.profile:
        raise HTTPException(
            status_code=400,
            detail="Missing required field: profile",
        )

    profile = body.profile
    if not profile.role or not profile.level:
        raise HTTPException(
            status_code=400,
            detail="Missing required profile fields: role and level",
        )

    # ── start ───────────────────────────────────────────────────
    if action == "start":
        return await handle_start(profile)

    # ── next ────────────────────────────────────────────────────
    if action == "next":
        if not body.messages:
            raise HTTPException(
                status_code=400,
                detail="Missing required field: messages for next action",
            )
        question_types = profile.questionTypes if profile.questionTypes else None
        return await handle_next(profile, body.messages, question_types)

    # ── skip ────────────────────────────────────────────────────
    if action == "skip":
        if not body.messages:
            raise HTTPException(
                status_code=400,
                detail="Missing required field: messages for skip action",
            )
        question_types = profile.questionTypes if profile.questionTypes else None
        return await handle_skip(profile, body.messages, question_types)

    # Should never reach here due to Literal type, but just in case
    raise HTTPException(
        status_code=400,
        detail='Invalid action. Use "start", "next", "skip", "hint", "evaluate", or "feedback"',
    )
