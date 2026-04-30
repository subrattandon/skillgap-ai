# AI Engine

The AI engine module for SkillGap AI. Provides a clean Python interface for generating interview questions, evaluating answers, producing overall feedback, and generating hints — all powered by the z-ai LLM gateway.

## Architecture

```
ai-engine/
├── prompts/
│   ├── question.txt       # System prompt for question generation
│   ├── evaluation.txt     # System prompt for answer evaluation
│   ├── feedback.txt       # System prompt for overall feedback
│   └── hint.txt           # System prompt for hint generation
├── llm_service.py         # Python LLM service
└── README.md
```

Prompt templates are stored as plain `.txt` files in `prompts/` and loaded on first use with in-process caching. This makes it easy to iterate on prompts without touching Python code.

## Quick Start

```python
import asyncio
from llm_service import LLMService

async def main():
    svc = LLMService()

    # Generate the first interview question
    q = await svc.generate_question(
        role="SDE",
        level="Mid",
        skills="Python, React, System Design",
    )
    print(q)
    # {"question": "...", "type": "DSA", "difficulty": "medium"}

    # Evaluate a candidate's answer
    result = await svc.evaluate_answer(
        question="Explain the difference between a stack and a queue.",
        answer="A stack is LIFO, a queue is FIFO.",
        role="SDE",
        level="Mid",
    )
    print(result)
    # {"score": 4, "feedback": "..."}

    # Generate a hint
    hint = await svc.generate_hint(
        question="Design a URL shortener.",
        role="SDE",
        level="Senior",
    )
    print(hint)
    # {"hint": "..."}

    # Generate overall feedback
    feedback = await svc.generate_feedback(
        role="SDE",
        level="Mid",
        skills="Python, React",
        messages=[
            {"role": "interviewer", "content": "What is a hash table?", "questionType": "DSA", "difficulty": "easy"},
            {"role": "candidate", "content": "A hash table maps keys to values..."},
        ],
    )
    print(feedback)
    # {"overallScore": 7, "strengths": [...], "improvements": [...], "summary": "..."}

    await svc.close()

asyncio.run(main())
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ZAI_API_KEY` | Yes | — | API key for the z-ai gateway |
| `ZAI_GATEWAY_URL` | No | `http://localhost:8080/v1` | Base URL of the z-ai gateway |
| `ZAI_CHAT_ID` | No | — | Optional chat ID header |
| `ZAI_USER_ID` | No | — | Optional user ID header |
| `ZAI_TOKEN` | No | — | Optional token header |

## API Reference

### `LLMService`

| Method | Returns | Description |
|---|---|---|
| `generate_question(role, level, ...)` | `dict[str, str]` | Generate the first interview question |
| `generate_next_question(role, level, ..., messages)` | `dict[str, str]` | Generate the next question based on conversation |
| `generate_skip_question(role, level, ..., messages)` | `dict[str, str]` | Generate an easier/different question after a skip |
| `evaluate_answer(question, answer, ...)` | `dict[str, Any]` | Score a candidate's answer (1-5) |
| `generate_feedback(role, level, ..., messages)` | `dict[str, Any]` | Produce overall interview feedback |
| `generate_hint(question, ...)` | `dict[str, str]` | Generate a hint for the current question |
| `close()` | `None` | Close the HTTP client (call on shutdown) |

## Dependencies

- `httpx` — async HTTP client for calling the z-ai gateway
- No other external dependencies required
