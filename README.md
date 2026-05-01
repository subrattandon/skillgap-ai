<div align="center">

# 🔥 SkillGap AI

**AI-Powered Technical Interview Simulator & Skill Gap Analyzer**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

<br />

[✨ Features](#-features) · [📁 Project Structure](#-project-structure) · [🛠 Tech Stack](#-tech-stack) · [🚀 Getting Started](#-getting-started) · [📐 Architecture](#-architecture) · [🤝 Contributing](#-contributing)

</div>

---

## 📖 Overview

**SkillGap AI** is a full-stack monorepo application that simulates real technical interviews using AI and identifies skill gaps. It generates adaptive, role-specific questions across DSA, System Design, and HR/Behavioral domains — adjusting difficulty in real-time based on your responses. Get detailed AI-powered feedback, per-question scoring, and track your progress over time.

> 🟢 **Run it locally** by following the [Getting Started](#-getting-started) guide below.

> 💡 Whether you're a beginner preparing for your first SDE interview or a senior engineer brushing up on system design — this app adapts to **your** level and helps you identify and close skill gaps.

---

## 📁 Project Structure

```
skillgap-ai/
│
├── frontend/              # Next.js 16 (App Router)
│   ├── src/
│   │   ├── app/           # Pages & API routes
│   │   ├── components/    # UI components (shadcn/ui)
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities & Zustand store
│   ├── public/            # Static assets
│   ├── prisma/            # Database schema
│   └── package.json
│
├── backend/               # FastAPI (Python)
│   ├── app/
│   │   ├── main.py        # FastAPI app entry point
│   │   ├── config.py      # Pydantic settings
│   │   ├── api/           # API route handlers
│   │   ├── services/      # Business logic & LLM service
│   │   ├── models/        # Pydantic request/response models
│   │   └── db/            # SQLAlchemy database setup
│   └── requirements.txt
│
├── ai-engine/             # LLM + prompts (standalone module)
│   ├── prompts/
│   │   ├── evaluation.txt # Answer evaluation prompt
│   │   ├── question.txt   # Question generation prompt
│   │   ├── feedback.txt   # Overall feedback prompt
│   │   └── hint.txt       # Hint generation prompt
│   ├── llm_service.py     # Python LLM service
│   └── README.md
│
├── database/
│   ├── schema.sql         # PostgreSQL schema (Supabase-ready)
│   └── supabase.md        # Supabase setup guide
│
├── docs/
│   ├── architecture.md    # System architecture with diagrams
│   └── flow.md            # Interview flow documentation
│
├── scripts/
│   └── seed_data.py       # Database seeding script
│
├── .env.example           # Environment variable template
├── docker-compose.yml     # Docker orchestration
└── README.md
```

---

## ✨ Features

### 🧠 AI-Powered Interview Engine
- **Adaptive Difficulty** — Questions get harder or easier based on your answer quality
- **Multiple Question Types** — DSA, System Design, and HR/Behavioral
- **7 Tech Roles** — SDE, Frontend, Backend, Full Stack, DevOps, Data Analyst, ML Engineer
- **3 Experience Levels** — Beginner, Intermediate, Senior
- **Question Type Filter** — Focus on specific categories you want to practice

### 💬 Interactive Interview Chat
- **Real-time Chat Interface** — Smooth, animated message flow with staggered entrance
- **Per-Question Timer Ring** — SVG circular progress showing time per question
- **Typing Indicator** — Animated "Analyzing your response..." with brain avatar
- **Code Block Formatting** — Syntax-highlighted code blocks with one-click copy
- **Skip Question** — Skip difficult questions; AI generates an easier one next
- **Pause/Resume** — Pause the interview anytime with Ctrl+P

### 🎯 Practice Mode
- **AI Hints** — Stuck on a question? Get a hint without revealing the answer
- **No-Pressure Learning** — Practice at your own pace with guided assistance

### 📊 Comprehensive Feedback & Scoring
- **AI Performance Review** — Overall score (1-10) with strengths & improvements
- **Per-Question AI Scoring** — Star ratings (1-5) with brief feedback after each answer
- **Performance Radar Chart** — Pentagon radar showing DSA, System Design, HR, Communication, Problem Solving
- **Difficulty Curve Visualization** — SVG chart tracking question difficulty progression
- **Session Comparison** — Compare current score vs. your historical average

### 🔖 Bookmarks & History
- **Bookmark Questions** — Save questions for later review
- **Interview History** — Tracks last 50 sessions with scores, duration, and transcripts
- **Transcript Viewer** — Expand any past session to see the full Q&A transcript

### 🎤 Voice & Accessibility
- **Voice Input** — Speak your answers using Web Speech API (Chrome/Edge)
- **Text-to-Speech** — Listen to questions read aloud with one click
- **Keyboard Shortcuts** — Ctrl+Enter (send), Ctrl+K (skip), Ctrl+P (pause), ? (help)

### 📥 Export & Share
- **PDF Export** — Print-friendly format with clean A4 layout
- **Copy Transcript** — Formatted text with header + Q&A pairs
- **Export JSON** — Full structured data including stats and feedback

### 🎨 Premium UI/UX
- **Teal/Emerald Theme** — Vibrant, modern color palette with dark mode support
- **Glassmorphism Effects** — Frosted glass panels with backdrop blur
- **Floating Orb Animations** — Animated gradient orbs on setup & summary pages
- **Phase Transitions** — Smooth slide animations between setup → interview → summary
- **Micro-Interactions** — Hover scales, ripple effects, spring animations
- **Social Proof Section** — Testimonials from engineers at top companies
- **Mobile Responsive** — Full mobile support with bottom action bar
- **Custom Scrollbars** — Styled scrollbars matching the theme

---

## 🛠 Tech Stack

| Category | Frontend | Backend |
|----------|----------|---------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | [FastAPI](https://fastapi.tiangolo.com/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | [Python 3.11+](https://python.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | — |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | — |
| **State** | [Zustand](https://zustand.docs.pmnd.rs/) | — |
| **AI Engine** | [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) | httpx (direct gateway calls) |
| **Database** | [Prisma](https://www.prisma.io/) (SQLite) | [SQLAlchemy](https://www.sqlalchemy.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) | — |
| **Theming** | [next-themes](https://github.com/pacocoursey/next-themes) | — |
| **Validation** | [Zod](https://zod.dev/) | [Pydantic](https://docs.pydantic.dev/) |
| **Deployment** | Docker / any Node host | Docker / any Python host |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **Python** 3.11+ (for backend)
- **Docker** (optional, for containerized setup)

### Quick Start (Frontend Only)

```bash
# Clone the repository
git clone https://github.com/subrattandon/skillgap-ai.git
cd skillgap-ai

# Install dependencies
bun install

# Set up environment variables
cp .env.example frontend/.env
# Edit frontend/.env with your configuration

# Push database schema
bun run db:push

# Start development server
bun run dev
```

The frontend will be running at `http://localhost:3000`

### Full Stack Setup (Frontend + Backend)

```bash
# Terminal 1: Start frontend
bun run dev:frontend

# Terminal 2: Start backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker Setup

```bash
# Start all services
docker compose up -d

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Environment Variables

Copy `.env.example` and fill in your configuration:

```env
# Database
DATABASE_URL=file:./db/custom.db

# Z-AI Gateway (for LLM calls)
ZAI_API_KEY=your-api-key-here
ZAI_GATEWAY_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend
BACKEND_URL=http://localhost:8000
```

---

## 📐 Architecture

### System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│    Frontend      │────▶│    Backend       │────▶│    AI Engine     │
│    (Next.js)     │     │    (FastAPI)     │     │    (z-ai SDK)    │
│    Port: 3000    │     │    Port: 8000    │     │                  │
│                  │     │                  │     │                  │
└────────┬────────┘     └────────┬─────────┘     └──────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│                  │     │                  │
│    Prisma        │     │    SQLAlchemy    │
│    (SQLite)      │     │    (SQLite/PG)   │
│                  │     │                  │
└─────────────────┘     └──────────────────┘
```

### API Endpoints

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| `start` | POST | `/api/interview` | Generate first question based on profile |
| `next` | POST | `/api/interview` | Generate follow-up question based on answer |
| `skip` | POST | `/api/interview` | Skip current question, get easier/different one |
| `hint` | POST | `/api/interview` | Get AI hint for current question (practice mode) |
| `evaluate` | POST | `/api/interview` | Score a specific answer (1-5 stars + feedback) |
| `feedback` | POST | `/api/interview` | Generate comprehensive interview feedback |
| Health | GET | `/api/health` | Backend health check |

### Data Flow

```
User Input → Frontend (React) → API Route → LLM Service → z-ai Gateway → AI Response
                                    │                              │
                                    ▼                              ▼
                              Prisma/SQLite              JSON Response
```

> 📊 For detailed architecture diagrams, see [docs/architecture.md](./docs/architecture.md)
> 🔄 For interview flow diagrams, see [docs/flow.md](./docs/flow.md)

---

## 🎮 Usage

1. **Set up your profile** — Choose your role, experience level, and skills
2. **Customize your session** — Select question types, enable practice mode, or use quick-start presets
3. **Start the interview** — Answer questions as the AI adapts to your performance
4. **Use power features** — Bookmark questions, request hints, use voice input, or TTS
5. **Review your performance** — Get detailed AI feedback with scores, radar chart, and actionable improvements
6. **Track progress** — View interview history and compare sessions over time

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Send answer |
| `Ctrl + K` | Skip question |
| `Ctrl + P` | Pause / Resume interview |
| `?` | Show keyboard shortcuts |
| `Escape` | Close dialogs |

---

## 🧩 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Monorepo Structure** | Single repo for frontend, backend, and AI engine — easier coordination |
| **FastAPI Backend** | High-performance Python API with automatic OpenAPI docs |
| **Separate AI Engine** | Prompts isolated for easy A/B testing and iteration |
| **Client-side Voice/TTS** | Web Speech API for zero-cost, zero-latency voice features |
| **localStorage for History** | Simple persistence without backend auth requirement |
| **Zustand over Context** | Better performance, simpler API, no provider nesting |
| **SVG Charts** | Lightweight, responsive charts without heavy chart libraries |
| **window.print() for PDF** | Native browser PDF with @media print CSS — no dependencies |
| **Supabase-ready Schema** | PostgreSQL schema with RLS policies for production deployment |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

### Ideas for Contributions

- [ ] WebSocket for real-time question streaming
- [ ] Resume/Cover letter analysis feature
- [ ] Collaborative interview mode (multiple interviewers)
- [ ] More question sub-types (debugging, code review, estimation)
- [ ] Interview templates for specific companies
- [ ] Leaderboard and community features
- [ ] Mobile app with React Native
- [ ] Skill gap visualization dashboard
- [ ] Learning resource recommendations based on weak areas
- [ ] Multi-language support

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

<br />

**Built with ❤️ by [Subrat Tandon](https://github.com/subrattandon)**

⭐ If this project helped you prepare for your interview, give it a star!

[⬆ Back to Top](#-skillgap-ai)

</div>
