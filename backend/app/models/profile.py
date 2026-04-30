"""Candidate profile models.

These Pydantic models represent the candidate's interview profile,
including role, experience level, skills, and optional settings.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Role(str, Enum):
    """Supported interview roles."""

    SDE = "SDE"
    DEVOPS = "DevOps"
    DATA_ANALYST = "Data Analyst"
    FRONTEND = "Frontend"
    BACKEND = "Backend"
    FULL_STACK = "Full Stack"
    ML_ENGINEER = "ML Engineer"


class ExperienceLevel(str, Enum):
    """Candidate experience levels."""

    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    SENIOR = "Senior"


class QuestionType(str, Enum):
    """Types of interview questions."""

    DSA = "DSA"
    SYSTEM_DESIGN = "System Design"
    HR_BEHAVIORAL = "HR/Behavioral"


class CandidateProfile(BaseModel):
    """Candidate profile used across all interview actions.

    For *start*, *next*, and *skip* actions, ``role`` and ``level`` are
    required.  For *hint*, *evaluate*, and *feedback*, they are optional
    but recommended for better context.
    """

    role: Optional[str] = None
    level: Optional[str] = None
    skills: str = ""
    previousScore: str = ""
    practiceMode: bool = False
    questionTypes: Optional[list[str]] = None
