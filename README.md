<div align="center">

# 🎯 AI Technical Interviewer

**Practice Smarter, Not Harder — AI-Powered Mock Interviews for Tech Roles**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Latest-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-Latest-FF0066?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

<br />

[🚀 Live Demo](#-getting-started) · [✨ Features](#-features) · [🛠 Tech Stack](#-tech-stack) · [📸 Screenshots](#-screenshots) · [📐 Architecture](#-architecture) · [🤝 Contributing](#-contributing)

</div>

---

## 📖 Overview

**AI Technical Interviewer** is a full-stack web application that simulates real technical interviews using AI. It generates adaptive, role-specific questions across DSA, System Design, and HR/Behavioral domains — adjusting difficulty in real-time based on your responses. Get detailed AI-powered feedback, per-question scoring, and track your progress over time.

> 💡 Whether you're a beginner preparing for your first SDE interview or a senior engineer brushing up on system design — this app adapts to **your** level and helps you improve.

---

## ✨ Features

### 🧠 AI-Powered Interview Engine
- **Adaptive Difficulty** — Questions get harder or easier based on your answer quality
- **Multiple Question Types** — DSA, System Design, and HR/Behavioral
- **6 Tech Roles** — SDE, Frontend, Backend, Full Stack, DevOps, Data Analyst, ML Engineer
- **3 Experience Levels** — Beginner (0-2 yrs), Intermediate (2-5 yrs), Senior (5+ yrs)
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

| Category | Technology |
|----------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **State Management** | [Zustand](https://zustand.docs.pmnd.rs/) |
| **AI Engine** | [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) (LLM) |
| **Database** | [Prisma](https://www.prisma.io/) (SQLite) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Theming** | [next-themes](https://github.com/pacocoursey/next-themes) |

---

## 📸 Screenshots

### 🏠 Profile Setup
> Select your role, experience level, skills, question types, and enable practice mode with quick-start presets.

### 💬 Interview Chat
> AI asks adaptive questions with live stats sidebar, per-question timer, bookmarking, voice input, and TTS.

### 📈 Performance Summary
> Detailed AI feedback with score donut, radar chart, difficulty curve, per-question scores, bookmarked questions, and session comparison.

### 🌙 Dark Mode
> Full dark mode support with teal/emerald theme across all pages.

---

## 📐 Architecture

```
src/
├── app/
│   ├── api/
│   │   └── interview/
│   │       └── route.ts          # Backend API (LLM integration)
│   ├── globals.css               # Global styles, animations, print CSS
│   ├── layout.tsx                # Root layout with ThemeProvider
│   └── page.tsx                  # Main application (3-phase UI)
├── components/
│   └── ui/                       # shadcn/ui component library
├── hooks/
│   ├── use-mobile.ts             # Mobile detection hook
│   └── use-toast.ts              # Toast notification hook
└── lib/
    ├── interview-store.ts        # Zustand state management
    ├── db.ts                     # Prisma database client
    └── utils.ts                  # Utility functions
```

### API Endpoints

| Action | Method | Description |
|--------|--------|-------------|
| `start` | `POST /api/interview` | Generate first question based on profile |
| `next` | `POST /api/interview` | Generate follow-up question based on answer |
| `skip` | `POST /api/interview` | Skip current question, get easier/different one |
| `hint` | `POST /api/interview` | Get AI hint for current question (practice mode) |
| `evaluate` | `POST /api/interview` | Score a specific answer (1-5 stars + feedback) |
| `feedback` | `POST /api/interview` | Generate comprehensive interview feedback |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun** runtime
- An LLM API key (configured via `z-ai-web-dev-sdk`)

### Installation

```bash
# Clone the repository
git clone https://github.com/subrattandon/Ai-technical-interviewer.git
cd Ai-technical-interviewer

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Push database schema
bun run db:push

# Start development server
bun run dev
```

The app will be running at `http://localhost:3000`

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./db/custom.db"
# Add any z-ai-web-dev-sdk configuration variables here
```

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

## 🗂 Project Structure

### State Management (Zustand Store)

The application uses a centralized Zustand store (`interview-store.ts`) managing:

- **Phase state** — `setup` → `interview` → `complete`
- **Profile** — Role, level, skills, practice mode, question type preferences
- **Messages** — Interview chat history with metadata
- **Stats** — Question counts by type and difficulty
- **Feedback** — AI-generated performance review
- **History** — Past sessions with localStorage persistence
- **Bookmarks** — Saved questions for review
- **Question Scores** — Per-answer ratings with feedback
- **Pause State** — Interview pause/resume

### AI Prompt Engineering

The backend uses carefully crafted system prompts for:
- **Question Generation** — Role-aware, difficulty-adaptive question creation
- **Follow-up Questions** — Context-aware continuation based on answer quality
- **Hint Generation** — Suggestive hints without revealing answers
- **Answer Evaluation** — 1-5 star scoring with brief feedback
- **Overall Feedback** — Comprehensive performance review with strengths/improvements

---

## 🧩 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Client-side Voice/TTS** | Web Speech API for zero-cost, zero-latency voice features |
| **localStorage for History** | Simple persistence without backend auth requirement |
| **Zustand over Context** | Better performance, simpler API, no provider nesting |
| **z-ai-web-dev-sdk** | Unified SDK for LLM calls with built-in error handling |
| **SVG Charts** | Lightweight, responsive charts without heavy chart libraries |
| **window.print() for PDF** | Native browser PDF with @media print CSS — no dependencies |

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

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

<br />

**Built with ❤️ by [Subrat Tandon](https://github.com/subrattandon)**

⭐ If this project helped you prepare for your interview, give it a star!

[⬆ Back to Top](#-ai-technical-interviewer)

</div>
