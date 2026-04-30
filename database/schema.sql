-- ============================================================================
-- SkillGap AI — Database Schema
-- ============================================================================
-- Supports the interview system with users, interviews, questions, answers,
-- and bookmarks. Designed for PostgreSQL / Supabase but compatible with
-- any SQL database that supports UUID, TIMESTAMP, and JSONB types.
-- ============================================================================

-- ── Extensions ────────────────────────────────────────────────────────────
-- Required for generating UUIDs (PostgreSQL 13+ has gen_random_uuid() built-in)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    email       TEXT        NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ── Interviews ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interviews (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        TEXT        NOT NULL,                        -- e.g. "SDE", "Frontend"
    level       TEXT        NOT NULL,                        -- e.g. "Junior", "Mid", "Senior"
    skills      JSONB       DEFAULT '[]'::jsonb,            -- e.g. ["Python", "React"]
    score       INTEGER,                                     -- overall score 1-10 (nullable until complete)
    duration    INTEGER,                                     -- duration in seconds
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews (user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews (created_at DESC);

-- ── Questions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id    UUID        NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    question_text   TEXT        NOT NULL,
    question_type   TEXT        NOT NULL DEFAULT 'DSA',      -- "DSA", "System Design", "HR/Behavioral"
    difficulty      TEXT        NOT NULL DEFAULT 'medium',   -- "easy", "medium", "hard"
    order_index     INTEGER     NOT NULL DEFAULT 0           -- 0-based question number in interview
);

CREATE INDEX IF NOT EXISTS idx_questions_interview_id ON questions (interview_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions (question_type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions (difficulty);

-- ── Answers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS answers (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id         UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text         TEXT        NOT NULL,
    score               INTEGER     CHECK (score >= 1 AND score <= 5),  -- per-question score 1-5
    feedback            TEXT,                                           -- AI-generated feedback
    duration_seconds    INTEGER     DEFAULT 0                        -- time taken to answer
);

CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers (question_id);

-- ── Bookmarks ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks (user_id);

-- ── Row Level Security (Supabase) ────────────────────────────────────────
-- Uncomment the following policies if using Supabase with RLS enabled.

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
-- CREATE POLICY "Users can view own profile" ON users
--     FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update own profile" ON users
--     FOR UPDATE USING (auth.uid() = id);

-- Users can only access their own interviews
-- CREATE POLICY "Users can view own interviews" ON interviews
--     FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own interviews" ON interviews
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only access questions for their own interviews
-- CREATE POLICY "Users can view own questions" ON questions
--     FOR SELECT USING (
--         EXISTS (SELECT 1 FROM interviews WHERE interviews.id = questions.interview_id AND interviews.user_id = auth.uid())
--     );

-- Users can only access answers for their own questions
-- CREATE POLICY "Users can view own answers" ON answers
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM questions q
--             JOIN interviews i ON i.id = q.interview_id
--             WHERE q.id = answers.question_id AND i.user_id = auth.uid()
--         )
--     );

-- Users can only manage their own bookmarks
-- CREATE POLICY "Users can view own bookmarks" ON bookmarks
--     FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own bookmarks" ON bookmarks
--     FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can delete own bookmarks" ON bookmarks
--     FOR DELETE USING (auth.uid() = user_id);

-- ── Useful Views ──────────────────────────────────────────────────────────

-- Interview summary with aggregated scores
CREATE OR REPLACE VIEW interview_summaries AS
SELECT
    i.id            AS interview_id,
    i.user_id,
    u.name          AS user_name,
    u.email,
    i.role,
    i.level,
    i.skills,
    i.score         AS overall_score,
    i.duration,
    COUNT(q.id)     AS total_questions,
    COUNT(a.id)     AS answered_questions,
    COALESCE(AVG(a.score), 0)::numeric(3,2) AS avg_question_score,
    i.created_at
FROM interviews i
JOIN users u ON u.id = i.user_id
LEFT JOIN questions q ON q.interview_id = i.id
LEFT JOIN answers a ON a.question_id = q.id
GROUP BY i.id, u.name, u.email;

-- Question bank (all unique questions ever asked)
CREATE OR REPLACE VIEW question_bank AS
SELECT DISTINCT ON (q.question_text)
    q.question_text,
    q.question_type,
    q.difficulty,
    COUNT(*) OVER (PARTITION BY q.question_text) AS times_asked,
    ROUND(AVG(a.score) OVER (PARTITION BY q.question_text), 2) AS avg_score
FROM questions q
LEFT JOIN answers a ON a.question_id = q.id
ORDER BY q.question_text, times_asked DESC;
