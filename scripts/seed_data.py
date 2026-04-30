#!/usr/bin/env python3
"""Seed the SkillGap AI database with sample data.

This script creates realistic sample data including users, interviews,
questions, answers, and bookmarks. It works with both SQLite (default)
and PostgreSQL/Supabase via the DATABASE_URL environment variable.

Usage
-----
    # Using default SQLite
    python scripts/seed_data.py

    # Using PostgreSQL / Supabase
    DATABASE_URL=postgresql://user:pass@host:5432/db python scripts/seed_data.py

    # Clear existing data first
    python scripts/seed_data.py --clear
"""

from __future__ import annotations

import argparse
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Ensure the project root is on sys.path so we can import sibling packages
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

# ── Configuration ──────────────────────────────────────────────────────────

DEFAULT_DB_URL = f"sqlite:///{_PROJECT_ROOT / 'db' / 'custom.db'}"

# ── Sample data ────────────────────────────────────────────────────────────

USERS = [
    {
        "id": str(uuid.uuid4()),
        "name": "Alice Johnson",
        "email": "alice@example.com",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Bob Smith",
        "email": "bob@example.com",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Carol Williams",
        "email": "carol@example.com",
    },
]

# We'll generate interview/question/answer IDs deterministically
# so the relationships are consistent.

_INTERVIEW_BASE_ID = uuid.UUID("aaaaaaaa-1111-1111-1111-111111111111")
_QUESTION_BASE_ID = uuid.UUID("bbbbbbbb-1111-1111-1111-111111111111")
_ANSWER_BASE_ID = uuid.UUID("cccccccc-1111-1111-1111-111111111111")
_BOOKMARK_BASE_ID = uuid.UUID("dddddddd-1111-1111-1111-111111111111")


def _make_interview_id(idx: int) -> str:
    """Generate a deterministic interview UUID from an index."""
    base = _INTERVIEW_BASE_ID.int + idx
    return str(uuid.UUID(int=base))


def _make_question_id(idx: int) -> str:
    base = _QUESTION_BASE_ID.int + idx
    return str(uuid.UUID(int=base))


def _make_answer_id(idx: int) -> str:
    base = _ANSWER_BASE_ID.int + idx
    return str(uuid.UUID(int=base))


def _make_bookmark_id(idx: int) -> str:
    base = _BOOKMARK_BASE_ID.int + idx
    return str(uuid.UUID(int=base))


INTERVIEWS = [
    # Alice's interviews
    {
        "id": _make_interview_id(0),
        "user_idx": 0,
        "role": "SDE",
        "level": "Mid",
        "skills": '["Python", "React", "System Design"]',
        "score": 7,
        "duration": 1800,
        "created_at": datetime(2025, 1, 15, 10, 30, tzinfo=timezone.utc).isoformat(),
    },
    {
        "id": _make_interview_id(1),
        "user_idx": 0,
        "role": "Frontend",
        "level": "Senior",
        "skills": '["React", "TypeScript", "CSS"]',
        "score": 8,
        "duration": 2400,
        "created_at": datetime(2025, 2, 20, 14, 0, tzinfo=timezone.utc).isoformat(),
    },
    # Bob's interviews
    {
        "id": _make_interview_id(2),
        "user_idx": 1,
        "role": "Backend",
        "level": "Junior",
        "skills": '["Java", "Spring Boot"]',
        "score": 5,
        "duration": 1200,
        "created_at": datetime(2025, 3, 1, 9, 15, tzinfo=timezone.utc).isoformat(),
    },
    {
        "id": _make_interview_id(3),
        "user_idx": 1,
        "role": "Full Stack",
        "level": "Mid",
        "skills": '["Node.js", "React", "PostgreSQL"]',
        "score": 6,
        "duration": 1500,
        "created_at": datetime(2025, 3, 10, 11, 0, tzinfo=timezone.utc).isoformat(),
    },
    # Carol's interviews
    {
        "id": _make_interview_id(4),
        "user_idx": 2,
        "role": "SDE",
        "level": "Senior",
        "skills": '["Python", "System Design", "AWS"]',
        "score": 9,
        "duration": 2700,
        "created_at": datetime(2025, 3, 15, 16, 45, tzinfo=timezone.utc).isoformat(),
    },
]

QUESTIONS = [
    # Interview 0 — Alice's SDE Mid interview (5 questions)
    {"id": _make_question_id(0), "interview_idx": 0, "order_index": 0,
     "question_text": "Explain the time complexity of finding an element in a balanced BST.",
     "question_type": "DSA", "difficulty": "medium"},
    {"id": _make_question_id(1), "interview_idx": 0, "order_index": 1,
     "question_text": "Design a simple rate limiter for an API.",
     "question_type": "System Design", "difficulty": "medium"},
    {"id": _make_question_id(2), "interview_idx": 0, "order_index": 2,
     "question_text": "Tell me about a time you had to work with a difficult team member.",
     "question_type": "HR/Behavioral", "difficulty": "easy"},
    {"id": _make_question_id(3), "interview_idx": 0, "order_index": 3,
     "question_text": "How would you detect a cycle in a linked list?",
     "question_type": "DSA", "difficulty": "hard"},
    {"id": _make_question_id(4), "interview_idx": 0, "order_index": 4,
     "question_text": "Describe the CAP theorem and its implications for distributed systems.",
     "question_type": "System Design", "difficulty": "hard"},

    # Interview 1 — Alice's Frontend Senior interview (4 questions)
    {"id": _make_question_id(5), "interview_idx": 1, "order_index": 0,
     "question_text": "What is the virtual DOM and how does React use it for efficient rendering?",
     "question_type": "DSA", "difficulty": "medium"},
    {"id": _make_question_id(6), "interview_idx": 1, "order_index": 1,
     "question_text": "Design a real-time collaborative text editor.",
     "question_type": "System Design", "difficulty": "hard"},
    {"id": _make_question_id(7), "interview_idx": 1, "order_index": 2,
     "question_text": "How do you handle state management in a large React application?",
     "question_type": "DSA", "difficulty": "hard"},
    {"id": _make_question_id(8), "interview_idx": 1, "order_index": 3,
     "question_text": "Describe your approach to mentoring junior developers.",
     "question_type": "HR/Behavioral", "difficulty": "medium"},

    # Interview 2 — Bob's Backend Junior interview (3 questions)
    {"id": _make_question_id(9), "interview_idx": 2, "order_index": 0,
     "question_text": "What is the difference between a stack and a queue?",
     "question_type": "DSA", "difficulty": "easy"},
    {"id": _make_question_id(10), "interview_idx": 2, "order_index": 1,
     "question_text": "Explain REST API principles.",
     "question_type": "System Design", "difficulty": "easy"},
    {"id": _make_question_id(11), "interview_idx": 2, "order_index": 2,
     "question_text": "Why do you want to work in backend development?",
     "question_type": "HR/Behavioral", "difficulty": "easy"},

    # Interview 3 — Bob's Full Stack Mid interview (4 questions)
    {"id": _make_question_id(12), "interview_idx": 3, "order_index": 0,
     "question_text": "How does garbage collection work in Node.js?",
     "question_type": "DSA", "difficulty": "medium"},
    {"id": _make_question_id(13), "interview_idx": 3, "order_index": 1,
     "question_text": "Design a URL shortener service.",
     "question_type": "System Design", "difficulty": "medium"},
    {"id": _make_question_id(14), "interview_idx": 3, "order_index": 2,
     "question_text": "How would you optimize a slow database query?",
     "question_type": "DSA", "difficulty": "medium"},
    {"id": _make_question_id(15), "interview_idx": 3, "order_index": 3,
     "question_text": "Describe a challenging bug you fixed in production.",
     "question_type": "HR/Behavioral", "difficulty": "medium"},

    # Interview 4 — Carol's SDE Senior interview (5 questions)
    {"id": _make_question_id(16), "interview_idx": 4, "order_index": 0,
     "question_text": "Implement an LRU cache with O(1) get and put operations.",
     "question_type": "DSA", "difficulty": "hard"},
    {"id": _make_question_id(17), "interview_idx": 4, "order_index": 1,
     "question_text": "Design a distributed messaging system like Kafka.",
     "question_type": "System Design", "difficulty": "hard"},
    {"id": _make_question_id(18), "interview_idx": 4, "order_index": 2,
     "question_text": "How would you find the median of two sorted arrays in O(log n)?",
     "question_type": "DSA", "difficulty": "hard"},
    {"id": _make_question_id(19), "interview_idx": 4, "order_index": 3,
     "question_text": "Design a system for real-time analytics on streaming data.",
     "question_type": "System Design", "difficulty": "hard"},
    {"id": _make_question_id(20), "interview_idx": 4, "order_index": 4,
     "question_text": "How do you handle disagreements with your tech lead on architecture decisions?",
     "question_type": "HR/Behavioral", "difficulty": "medium"},
]

ANSWERS = [
    # Interview 0 — Alice's answers
    {"id": _make_answer_id(0), "question_idx": 0,
     "answer_text": "Finding an element in a balanced BST has O(log n) time complexity because at each node, we eliminate half of the remaining tree.",
     "score": 4, "feedback": "Correct and concise explanation of BST search complexity.",
     "duration_seconds": 45},
    {"id": _make_answer_id(1), "question_idx": 1,
     "answer_text": "I would use a token bucket algorithm. Each client gets a bucket with a fixed number of tokens that refill at a constant rate. Each API request consumes one token.",
     "score": 5, "feedback": "Excellent answer with specific algorithm choice and clear explanation.",
     "duration_seconds": 120},
    {"id": _make_answer_id(2), "question_idx": 2,
     "answer_text": "In my previous project, I had a teammate who consistently missed deadlines. I scheduled a 1-on-1 to understand their challenges and we created a shared timeline.",
     "score": 4, "feedback": "Good use of the STAR method with a constructive resolution.",
     "duration_seconds": 90},
    {"id": _make_answer_id(3), "question_idx": 3,
     "answer_text": "Floyd's cycle detection algorithm uses two pointers — a slow pointer moving one step and a fast pointer moving two steps. If they meet, there's a cycle.",
     "score": 5, "feedback": "Perfect explanation of Floyd's tortoise and hare algorithm.",
     "duration_seconds": 60},
    {"id": _make_answer_id(4), "question_idx": 4,
     "answer_text": "CAP theorem states that a distributed system can only guarantee two of Consistency, Availability, and Partition tolerance. In practice, since partitions are inevitable, we choose between CP and AP systems.",
     "score": 4, "feedback": "Solid explanation with practical insight about the CP vs AP tradeoff.",
     "duration_seconds": 75},

    # Interview 1 — Alice's answers
    {"id": _make_answer_id(5), "question_idx": 5,
     "answer_text": "The virtual DOM is a lightweight JavaScript representation of the real DOM. React compares the virtual DOM with the previous version (reconciliation) and only updates the real DOM where changes occurred.",
     "score": 5, "feedback": "Comprehensive explanation covering reconciliation and batch updates.",
     "duration_seconds": 55},
    {"id": _make_answer_id(6), "question_idx": 6,
     "answer_text": "I would use CRDTs (Conflict-free Replicated Data Types) for conflict resolution and WebSockets for real-time sync. Each user gets a local copy and changes are merged automatically.",
     "score": 5, "feedback": "Excellent answer mentioning CRDTs which is the industry-standard approach.",
     "duration_seconds": 150},
    {"id": _make_answer_id(7), "question_idx": 7,
     "answer_text": "For large apps, I use a combination of local state for UI concerns and a global store like Redux or Zustand for shared state. Server state is managed with React Query or SWR.",
     "score": 4, "feedback": "Good separation of concerns between UI, global, and server state.",
     "duration_seconds": 80},
    {"id": _make_answer_id(8), "question_idx": 8,
     "answer_text": "I believe in pairing with junior developers rather than just reviewing their code. I create safe-to-fail tasks and have regular 1-on-1s to discuss their growth areas.",
     "score": 4, "feedback": "Strong mentoring philosophy with practical techniques.",
     "duration_seconds": 95},

    # Interview 2 — Bob's answers
    {"id": _make_answer_id(9), "question_idx": 9,
     "answer_text": "A stack is last-in-first-out, a queue is first-in-first-out.",
     "score": 3, "feedback": "Correct but very brief — could elaborate with examples or use cases.",
     "duration_seconds": 20},
    {"id": _make_answer_id(10), "question_idx": 10,
     "answer_text": "REST APIs use HTTP methods like GET, POST, PUT, DELETE to operate on resources identified by URLs.",
     "score": 3, "feedback": "Basic understanding shown but missing key principles like statelessness and HATEOAS.",
     "duration_seconds": 35},
    {"id": _make_answer_id(11), "question_idx": 11,
     "answer_text": "I enjoy building the logic that powers applications and working with databases.",
     "score": 3, "feedback": "Decent motivation but could be more specific about backend challenges that excite you.",
     "duration_seconds": 25},

    # Interview 3 — Bob's answers
    {"id": _make_answer_id(12), "question_idx": 12,
     "answer_text": "V8 uses a mark-and-sweep garbage collector. It marks all reachable objects starting from roots, then sweeps unreachable ones.",
     "score": 4, "feedback": "Good explanation of the mark-and-sweep approach in V8.",
     "duration_seconds": 60},
    {"id": _make_answer_id(13), "question_idx": 13,
     "answer_text": "A URL shortener maps long URLs to short codes. I would use a hash function or base62 encoding, store mappings in a database, and use caching for hot URLs.",
     "score": 4, "feedback": "Solid design covering hashing, storage, and caching layers.",
     "duration_seconds": 110},
    {"id": _make_answer_id(14), "question_idx": 14,
     "answer_text": "I would start with EXPLAIN ANALYZE to find the bottleneck, check for missing indexes, and consider denormalization if needed.",
     "score": 4, "feedback": "Practical debugging approach starting with analysis before optimization.",
     "duration_seconds": 50},
    {"id": _make_answer_id(15), "question_idx": 15,
     "answer_text": "We had a memory leak in production caused by unclosed database connections. I used heap profiling to identify the leak and added proper connection pooling.",
     "score": 3, "feedback": "Good specific example but could elaborate on the debugging process.",
     "duration_seconds": 70},

    # Interview 4 — Carol's answers
    {"id": _make_answer_id(16), "question_idx": 16,
     "answer_text": "I would use a combination of a hash map for O(1) lookups and a doubly linked list for O(1) insertion/deletion. The hash map stores key-to-node references.",
     "score": 5, "feedback": "Perfect answer — exactly the right data structure combination for LRU cache.",
     "duration_seconds": 90},
    {"id": _make_answer_id(17), "question_idx": 17,
     "answer_text": "A distributed messaging system needs producers, consumers, topics/partitions, and a commit log. I'd use an append-only log per partition with consumer offsets for tracking. Replication ensures durability, and partitioning enables horizontal scaling.",
     "score": 5, "feedback": "Excellent high-level design covering all critical Kafka-like components.",
     "duration_seconds": 180},
    {"id": _make_answer_id(18), "question_idx": 18,
     "answer_text": "Use binary search on the smaller array. Compare medians of both arrays and recursively eliminate half of the search space. The base case handles arrays of size 1 or 2.",
     "score": 5, "feedback": "Correct algorithm with clear explanation of the divide-and-conquer approach.",
     "duration_seconds": 120},
    {"id": _make_answer_id(19), "question_idx": 19,
     "answer_text": "I would use a Lambda architecture with a speed layer for real-time processing (e.g., Flink) and a batch layer for historical data. A serving layer merges both for queries.",
     "score": 5, "feedback": "Strong answer referencing Lambda architecture with specific technology choices.",
     "duration_seconds": 150},
    {"id": _make_answer_id(20), "question_idx": 20,
     "answer_text": "I document my reasoning with data and trade-off analysis. If I still disagree after discussion, I defer to the lead's decision but request we revisit if metrics show issues.",
     "score": 4, "feedback": "Mature approach — data-driven with respectful escalation path.",
     "duration_seconds": 65},
]

BOOKMARKS = [
    # Alice bookmarked the LRU cache question from Carol's interview
    # (not realistic but demonstrates the feature)
    {"id": _make_bookmark_id(0), "user_idx": 0, "question_idx": 16},
    # Alice bookmarked the rate limiter question
    {"id": _make_bookmark_id(1), "user_idx": 0, "question_idx": 1},
    # Bob bookmarked the URL shortener question
    {"id": _make_bookmark_id(2), "user_idx": 1, "question_idx": 13},
    # Carol bookmarked the distributed messaging design
    {"id": _make_bookmark_id(3), "user_idx": 2, "question_idx": 17},
]


# ── Database helpers ───────────────────────────────────────────────────────


def _normalize_db_url(raw: str) -> str:
    """Convert a DATABASE_URL value to a SQLAlchemy-compatible URL.

    Handles both Prisma-style ``file:./path`` URLs and standard
    ``sqlite:///`` / ``postgresql://`` URLs.
    """
    if raw.startswith("file:"):
        # Prisma-style: file:./db/custom.db → sqlite:///./db/custom.db
        path = raw[5:]  # strip "file:"
        if not path.startswith("/"):
            path = f"./{path.lstrip('./')}"
        return f"sqlite:///{path}"
    return raw


def get_engine() -> Engine:
    """Create a SQLAlchemy engine from the DATABASE_URL environment variable."""
    db_url = _normalize_db_url(os.getenv("DATABASE_URL", DEFAULT_DB_URL))
    print(f"Connecting to database: {db_url.split('@')[-1] if '@' in db_url else db_url}")
    return create_engine(db_url, echo=False)


def ensure_schema(engine: Engine) -> None:
    """Create tables if they don't exist, using SQL compatible with both SQLite and PostgreSQL."""
    statements = [
        """CREATE TABLE IF NOT EXISTS users (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            email       TEXT NOT NULL UNIQUE,
            created_at  TEXT NOT NULL DEFAULT 'now'
        )""",
        """CREATE TABLE IF NOT EXISTS interviews (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL REFERENCES users(id),
            role        TEXT NOT NULL,
            level       TEXT NOT NULL,
            skills      TEXT DEFAULT '[]',
            score       INTEGER,
            duration    INTEGER,
            created_at  TEXT NOT NULL DEFAULT 'now'
        )""",
        """CREATE TABLE IF NOT EXISTS questions (
            id              TEXT PRIMARY KEY,
            interview_id    TEXT NOT NULL REFERENCES interviews(id),
            question_text   TEXT NOT NULL,
            question_type   TEXT NOT NULL DEFAULT 'DSA',
            difficulty      TEXT NOT NULL DEFAULT 'medium',
            order_index     INTEGER NOT NULL DEFAULT 0
        )""",
        """CREATE TABLE IF NOT EXISTS answers (
            id                  TEXT PRIMARY KEY,
            question_id         TEXT NOT NULL REFERENCES questions(id),
            answer_text         TEXT NOT NULL,
            score               INTEGER CHECK (score >= 1 AND score <= 5),
            feedback            TEXT,
            duration_seconds    INTEGER DEFAULT 0
        )""",
        """CREATE TABLE IF NOT EXISTS bookmarks (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL REFERENCES users(id),
            question_id TEXT NOT NULL REFERENCES questions(id),
            created_at  TEXT NOT NULL DEFAULT 'now',
            UNIQUE (user_id, question_id)
        )""",
    ]
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
    print("Schema ensured (tables created if not existing).")


def clear_data(engine: Engine) -> None:
    """Delete all rows from the tables (preserving schema)."""
    with engine.begin() as conn:
        for table in ("bookmarks", "answers", "questions", "interviews", "users"):
            conn.execute(text(f"DELETE FROM {table}"))
    print("Cleared all existing data.")


def seed_users(engine: Engine) -> dict[int, str]:
    """Insert sample users. Returns a mapping of user_idx → user_id."""
    with engine.begin() as conn:
        for user in USERS:
            conn.execute(
                text(
                    "INSERT INTO users (id, name, email, created_at) "
                    "VALUES (:id, :name, :email, :created_at)"
                ),
                {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
            )
    print(f"  Inserted {len(USERS)} users")
    return {i: u["id"] for i, u in enumerate(USERS)}


def seed_interviews(engine: Engine, user_map: dict[int, str]) -> dict[int, str]:
    """Insert sample interviews. Returns a mapping of interview_idx → interview_id."""
    with engine.begin() as conn:
        for iv in INTERVIEWS:
            conn.execute(
                text(
                    "INSERT INTO interviews (id, user_id, role, level, skills, score, duration, created_at) "
                    "VALUES (:id, :user_id, :role, :level, :skills, :score, :duration, :created_at)"
                ),
                {
                    "id": iv["id"],
                    "user_id": user_map[iv["user_idx"]],
                    "role": iv["role"],
                    "level": iv["level"],
                    "skills": iv["skills"],
                    "score": iv["score"],
                    "duration": iv["duration"],
                    "created_at": iv["created_at"],
                },
            )
    print(f"  Inserted {len(INTERVIEWS)} interviews")
    return {i: iv["id"] for i, iv in enumerate(INTERVIEWS)}


def seed_questions(engine: Engine, interview_map: dict[int, str]) -> dict[int, str]:
    """Insert sample questions. Returns a mapping of question_idx → question_id."""
    with engine.begin() as conn:
        for q in QUESTIONS:
            conn.execute(
                text(
                    "INSERT INTO questions (id, interview_id, question_text, question_type, difficulty, order_index) "
                    "VALUES (:id, :interview_id, :question_text, :question_type, :difficulty, :order_index)"
                ),
                {
                    "id": q["id"],
                    "interview_id": interview_map[q["interview_idx"]],
                    "question_text": q["question_text"],
                    "question_type": q["question_type"],
                    "difficulty": q["difficulty"],
                    "order_index": q["order_index"],
                },
            )
    print(f"  Inserted {len(QUESTIONS)} questions")
    return {i: q["id"] for i, q in enumerate(QUESTIONS)}


def seed_answers(engine: Engine, question_map: dict[int, str]) -> None:
    """Insert sample answers."""
    with engine.begin() as conn:
        for a in ANSWERS:
            conn.execute(
                text(
                    "INSERT INTO answers (id, question_id, answer_text, score, feedback, duration_seconds) "
                    "VALUES (:id, :question_id, :answer_text, :score, :feedback, :duration_seconds)"
                ),
                {
                    "id": a["id"],
                    "question_id": question_map[a["question_idx"]],
                    "answer_text": a["answer_text"],
                    "score": a["score"],
                    "feedback": a["feedback"],
                    "duration_seconds": a["duration_seconds"],
                },
            )
    print(f"  Inserted {len(ANSWERS)} answers")


def seed_bookmarks(engine: Engine, user_map: dict[int, str], question_map: dict[int, str]) -> None:
    """Insert sample bookmarks."""
    with engine.begin() as conn:
        for b in BOOKMARKS:
            conn.execute(
                text(
                    "INSERT INTO bookmarks (id, user_id, question_id, created_at) "
                    "VALUES (:id, :user_id, :question_id, :created_at)"
                ),
                {
                    "id": b["id"],
                    "user_id": user_map[b["user_idx"]],
                    "question_id": question_map[b["question_idx"]],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
            )
    print(f"  Inserted {len(BOOKMARKS)} bookmarks")


# ── Main ───────────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the SkillGap AI database with sample data")
    parser.add_argument("--clear", action="store_true", help="Delete existing data before seeding")
    parser.add_argument("--db-url", type=str, default=None, help="Database URL (overrides DATABASE_URL env var)")
    args = parser.parse_args()

    if args.db_url:
        os.environ["DATABASE_URL"] = args.db_url

    engine = get_engine()
    ensure_schema(engine)

    if args.clear:
        clear_data(engine)

    print("Seeding database...")
    user_map = seed_users(engine)
    interview_map = seed_interviews(engine, user_map)
    question_map = seed_questions(engine, interview_map)
    seed_answers(engine, question_map)
    seed_bookmarks(engine, user_map, question_map)
    print("Done! Sample data seeded successfully.")

    # Print summary
    with engine.connect() as conn:
        for table in ("users", "interviews", "questions", "answers", "bookmarks"):
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()
            print(f"  {table}: {count} rows")


if __name__ == "__main__":
    main()
