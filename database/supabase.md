# Supabase Setup Guide

This guide walks you through setting up the SkillGap AI database schema on [Supabase](https://supabase.com/).

## Prerequisites

- A Supabase account (free tier works)
- A Supabase project created

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign in
2. Click **New Project**
3. Fill in:
   - **Name**: `skillgap-ai`
   - **Database Password**: Choose a strong password
   - **Region**: Pick the closest region
4. Click **Create new project** and wait for provisioning (~2 min)

## Step 2: Run the Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `database/schema.sql` and paste it in
4. Click **Run** (or press `Ctrl+Enter`)

You should see success messages for all the `CREATE TABLE` and `CREATE INDEX` statements.

## Step 3: Enable Row Level Security (RLS)

The `schema.sql` file includes commented-out RLS policies. To enable them:

1. In the SQL Editor, run the following:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can view/update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only access their own interviews
CREATE POLICY "Users can view own interviews" ON interviews
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interviews" ON interviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interviews" ON interviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can view questions for their own interviews
CREATE POLICY "Users can view own questions" ON questions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM interviews WHERE interviews.id = questions.interview_id AND interviews.user_id = auth.uid())
    );
CREATE POLICY "Users can insert own questions" ON questions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM interviews WHERE interviews.id = questions.interview_id AND interviews.user_id = auth.uid())
    );

-- Users can view answers for their own questions
CREATE POLICY "Users can view own answers" ON answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM questions q
            JOIN interviews i ON i.id = q.interview_id
            WHERE q.id = answers.question_id AND i.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert own answers" ON answers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM questions q
            JOIN interviews i ON i.id = q.interview_id
            WHERE q.id = answers.question_id AND i.user_id = auth.uid()
        )
    );

-- Users can manage their own bookmarks
CREATE POLICY "Users can view own bookmarks" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON bookmarks
    FOR DELETE USING (auth.uid() = user_id);
```

## Step 4: Get Your Connection String

1. Go to **Settings** → **Database** (left sidebar)
2. Scroll down to **Connection string**
3. Select **URI** format
4. Copy the connection string — it looks like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. Set it as your `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
   ```

## Step 5: Seed Sample Data (Optional)

To populate the database with sample data for development:

```bash
cd scripts/
pip install sqlalchemy httpx
python seed_data.py
```

Make sure `DATABASE_URL` is set before running the seed script.

## Step 6: Verify the Setup

In the Supabase dashboard:

1. Go to **Table Editor** (left sidebar)
2. You should see all 5 tables: `users`, `interviews`, `questions`, `answers`, `bookmarks`
3. If you seeded data, you'll see sample rows in each table

## Using with the Backend

The FastAPI backend reads `DATABASE_URL` (or `BACKEND_DATABASE_URL`) from the environment. For Supabase:

```env
# .env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

For local development with SQLite (no Supabase needed):

```env
DATABASE_URL=sqlite:///./db/custom.db
```

## Useful Supabase SQL Commands

### Check table row counts
```sql
SELECT
    'users' AS table_name, COUNT(*) FROM users
UNION ALL SELECT 'interviews', COUNT(*) FROM interviews
UNION ALL SELECT 'questions', COUNT(*) FROM questions
UNION ALL SELECT 'answers', COUNT(*) FROM answers
UNION ALL SELECT 'bookmarks', COUNT(*) FROM bookmarks;
```

### View interview summaries
```sql
SELECT * FROM interview_summaries ORDER BY created_at DESC LIMIT 10;
```

### View the question bank
```sql
SELECT * FROM question_bank ORDER BY times_asked DESC LIMIT 20;
```

### Clean up all data (keep schema)
```sql
TRUNCATE bookmarks, answers, questions, interviews, users CASCADE;
```

### Drop all tables and start fresh
```sql
DROP VIEW IF EXISTS interview_summaries CASCADE;
DROP VIEW IF EXISTS question_bank CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```
