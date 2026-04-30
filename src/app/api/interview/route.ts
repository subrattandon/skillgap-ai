import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const SYSTEM_PROMPT = `You are an expert technical interviewer from a top product company (Google, Amazon, Microsoft level).

Your job is to ask high-quality interview questions based on the candidate profile.

Instructions:
- Ask ONE question at a time
- Adjust difficulty dynamically based on the candidate's responses
- Mix question types based on the candidate's role and level:
  - DSA (if SDE, Frontend, Backend, Full Stack)
  - System Design (if Intermediate or Senior level)
  - HR/Behavioral (for all roles)
- Do NOT give the answer or any hints
- Keep it realistic and interview-like
- If the candidate answers well, increase difficulty for the next question
- If the candidate struggles, decrease difficulty slightly
- Vary the question types - don't ask the same type repeatedly
- For DSA questions, be specific about the problem and constraints
- For System Design questions, ask about real-world scenarios
- For HR questions, ask about past experiences and situational responses

You MUST respond with valid JSON in exactly this format:
{
  "question": "your question here",
  "type": "DSA" or "System Design" or "HR/Behavioral",
  "difficulty": "easy" or "medium" or "hard"
}

IMPORTANT: Only respond with the JSON object, nothing else. No markdown, no explanation.`;

const FOLLOWUP_PROMPT = `Based on the candidate's response, generate the next interview question. Consider:
1. The quality of their previous answer - adjust difficulty accordingly
2. Vary question types - don't repeat the same type consecutively
3. Build on the conversation naturally
4. Keep track of what topics have been covered

You MUST respond with valid JSON in exactly this format:
{
  "question": "your question here",
  "type": "DSA" or "System Design" or "HR/Behavioral",
  "difficulty": "easy" or "medium" or "hard"
}

IMPORTANT: Only respond with the JSON object, nothing else. No markdown, no explanation.`;

const FEEDBACK_PROMPT = `You are an expert technical interviewer evaluating a candidate's interview performance.

Based on the full interview transcript, provide detailed feedback. Evaluate:
1. Technical depth of answers
2. Communication clarity
3. Problem-solving approach
4. Areas of strength
5. Areas needing improvement

You MUST respond with valid JSON in exactly this format:
{
  "overallScore": <number from 1-10>,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "summary": "A 2-3 sentence overall assessment of the candidate's performance"
}

IMPORTANT: Only respond with the JSON object, nothing else. No markdown, no explanation.`;

const HINT_PROMPT = `You are an expert technical interviewer helping a candidate in practice mode.

The candidate has asked for a hint on the current question. Provide a helpful hint that:
1. Points them in the right direction without giving away the answer
2. Suggests an approach or technique to consider
3. Is concise (1-2 sentences max)

You MUST respond with valid JSON in exactly this format:
{
  "hint": "your helpful hint here"
}

IMPORTANT: Only respond with the JSON object, nothing else. No markdown, no explanation.`;

const EVALUATE_PROMPT = `You are an expert technical interviewer evaluating a candidate's answer to a specific question.

Evaluate the answer on a scale of 1-5 stars:
- 1: Completely incorrect or no relevant response
- 2: Partially correct but major gaps
- 3: Acceptable answer with some good points
- 4: Strong answer with minor gaps
- 5: Excellent, comprehensive answer

Provide brief feedback (1 sentence).

You MUST respond with valid JSON in exactly this format:
{
  "score": <number from 1-5>,
  "feedback": "brief feedback sentence"
}

IMPORTANT: Only respond with the JSON object, nothing else. No markdown, no explanation.`;

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, messages, action, question, answer } = body;

    if (action === 'feedback') {
      return await handleFeedback(profile, messages);
    }

    if (action === 'hint') {
      return await handleHint(profile, messages, question);
    }

    if (action === 'evaluate') {
      return await handleEvaluate(question, answer, profile);
    }

    if (!profile || !profile.role || !profile.level) {
      return NextResponse.json(
        { error: 'Missing required profile fields' },
        { status: 400 }
      );
    }

    const zai = await getZAI();

    if (action === 'start') {
      const profileContext = `Candidate Profile:
- Role: ${profile.role}
- Experience Level: ${profile.level}
- Skills: ${profile.skills || 'Not specified'}
- Previous Performance Score: ${profile.previousScore || 'Not available'}
${profile.practiceMode ? '- Practice Mode: Enabled (hints are available)' : ''}

Generate the first interview question for this candidate. Start with an appropriate difficulty level based on their experience.`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM_PROMPT },
          { role: 'user', content: profileContext },
        ],
        thinking: { type: 'disabled' },
      });

      const responseText = completion.choices[0]?.message?.content?.trim() || '';
      const parsed = parseJSONResponse(responseText);

      return NextResponse.json({
        success: true,
        question: parsed.question,
        type: normalizeType(parsed.type),
        difficulty: normalizeDifficulty(parsed.difficulty),
      });
    }

    if (action === 'next') {
      const conversationContext = buildConversationContext(profile, messages);

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM_PROMPT },
          { role: 'user', content: conversationContext },
        ],
        thinking: { type: 'disabled' },
      });

      const responseText = completion.choices[0]?.message?.content?.trim() || '';
      const parsed = parseJSONResponse(responseText);

      return NextResponse.json({
        success: true,
        question: parsed.question,
        type: normalizeType(parsed.type),
        difficulty: normalizeDifficulty(parsed.difficulty),
      });
    }

    if (action === 'skip') {
      const skipContext = buildSkipContext(profile, messages);

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM_PROMPT },
          { role: 'user', content: skipContext },
        ],
        thinking: { type: 'disabled' },
      });

      const responseText = completion.choices[0]?.message?.content?.trim() || '';
      const parsed = parseJSONResponse(responseText);

      return NextResponse.json({
        success: true,
        question: parsed.question,
        type: normalizeType(parsed.type),
        difficulty: normalizeDifficulty(parsed.difficulty),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start", "next", "skip", "hint", "evaluate", or "feedback"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Interview API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    );
  }
}

async function handleHint(
  profile: { role: string; level: string; skills: string },
  messages: Array<{ role: string; content: string; questionType?: string; difficulty?: string }>,
  question?: string
) {
  const zai = await getZAI();

  let context = `Candidate Profile:
- Role: ${profile.role}
- Experience Level: ${profile.level}
- Skills: ${profile.skills || 'Not specified'}

`;

  if (question) {
    context += `Current Question: ${question}\n\n`;
  } else {
    // Find the last interviewer question
    const interviewerMsgs = messages.filter((m) => m.role === 'interviewer');
    const lastQuestion = interviewerMsgs[interviewerMsgs.length - 1];
    if (lastQuestion) {
      context += `Current Question: ${lastQuestion.content}\n\n`;
    }
  }

  context += HINT_PROMPT;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: HINT_PROMPT },
        { role: 'user', content: context },
      ],
      thinking: { type: 'disabled' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    const parsed = parseHintResponse(responseText);

    return NextResponse.json({
      success: true,
      hint: parsed.hint,
    });
  } catch (error) {
    console.error('Hint generation error:', error);
    return NextResponse.json({
      success: true,
      hint: 'Think about breaking the problem into smaller sub-problems and consider common data structures that might help.',
    });
  }
}

async function handleEvaluate(
  question: string,
  answer: string,
  profile: { role: string; level: string }
) {
  const zai = await getZAI();

  const context = `Candidate Profile:
- Role: ${profile.role}
- Experience Level: ${profile.level}

Question: ${question}

Candidate's Answer: ${answer}

${EVALUATE_PROMPT}`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: EVALUATE_PROMPT },
        { role: 'user', content: context },
      ],
      thinking: { type: 'disabled' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    const parsed = parseEvaluateResponse(responseText);

    return NextResponse.json({
      success: true,
      score: parsed.score,
      feedback: parsed.feedback,
    });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json({
      success: true,
      score: 3,
      feedback: 'Answer recorded.',
    });
  }
}

async function handleFeedback(
  profile: { role: string; level: string; skills: string; previousScore: string },
  messages: Array<{ role: string; content: string; questionType?: string; difficulty?: string }>
) {
  const zai = await getZAI();

  let transcript = `Candidate Profile:
- Role: ${profile.role}
- Experience Level: ${profile.level}
- Skills: ${profile.skills || 'Not specified'}

Interview Transcript:\n`;

  for (const msg of messages) {
    if (msg.role === 'interviewer') {
      transcript += `\nInterviewer [${msg.questionType || 'Q'}, ${msg.difficulty || ''}]: ${msg.content}`;
    } else if (msg.role === 'candidate') {
      transcript += `\nCandidate: ${msg.content}`;
    }
  }

  transcript += `\n\n${FEEDBACK_PROMPT}`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: FEEDBACK_PROMPT },
        { role: 'user', content: transcript },
      ],
      thinking: { type: 'disabled' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    const parsed = parseFeedbackResponse(responseText);

    return NextResponse.json({
      success: true,
      feedback: parsed,
    });
  } catch (error) {
    console.error('Feedback generation error:', error);
    return NextResponse.json({
      success: false,
      feedback: {
        overallScore: 5,
        strengths: ['Completed the interview session'],
        improvements: ['Continue practicing technical concepts', 'Work on articulating your thought process'],
        summary: 'Thank you for completing the interview session. Keep practicing!',
      },
    });
  }
}

function buildConversationContext(
  profile: { role: string; level: string; skills: string; previousScore: string },
  messages: Array<{ role: string; content: string; questionType?: string; difficulty?: string }>
) {
  let context = `Candidate Profile:
- Role: ${profile.role}
- Experience Level: ${profile.level}
- Skills: ${profile.skills || 'Not specified'}
- Previous Performance Score: ${profile.previousScore || 'Not available'}

Conversation so far:\n`;

  for (const msg of messages) {
    if (msg.role === 'interviewer') {
      context += `\nInterviewer [${msg.questionType || 'Question'}, ${msg.difficulty || ''}]: ${msg.content}`;
    } else if (msg.role === 'candidate') {
      context += `\nCandidate: ${msg.content}`;
    }
  }

  context += `\n\n${FOLLOWUP_PROMPT}`;

  return context;
}

function buildSkipContext(
  profile: { role: string; level: string; skills: string; previousScore: string },
  messages: Array<{ role: string; content: string; questionType?: string; difficulty?: string }>
) {
  let context = `Candidate Profile:
- Role: ${profile.role}
- Experience Level: ${profile.level}
- Skills: ${profile.skills || 'Not specified'}

The candidate chose to skip the last question. This may indicate the topic was too difficult or unfamiliar.

Conversation so far:\n`;

  for (const msg of messages) {
    if (msg.role === 'interviewer') {
      context += `\nInterviewer [${msg.questionType || 'Question'}, ${msg.difficulty || ''}]: ${msg.content}`;
    } else if (msg.role === 'candidate') {
      context += `\nCandidate: ${msg.content}`;
    }
  }

  context += `\n\nSince the candidate skipped, generate a slightly easier question or a question on a different topic. Vary the question type.\n\n${FOLLOWUP_PROMPT}`;

  return context;
}

function normalizeType(type: string): string {
  const t = type?.toLowerCase().trim();
  if (t?.includes('system') || t?.includes('design')) return 'System Design';
  if (t?.includes('hr') || t?.includes('behavioral') || t?.includes('behaviour')) return 'HR/Behavioral';
  return 'DSA';
}

function normalizeDifficulty(diff: string): string {
  const d = diff?.toLowerCase().trim();
  if (d === 'hard' || d === 'difficult') return 'hard';
  if (d === 'medium' || d === 'moderate') return 'medium';
  return 'easy';
}

function parseJSONResponse(text: string): {
  question: string;
  type: string;
  difficulty: string;
} {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // fall through
      }
    }
    return {
      question: text.replace(/[{}"]/g, '').trim() || 'Tell me about a challenging technical problem you solved recently.',
      type: 'HR/Behavioral',
      difficulty: 'medium',
    };
  }
}

function parseHintResponse(text: string): { hint: string } {
  try {
    const parsed = JSON.parse(text);
    return { hint: parsed.hint || 'Think about breaking the problem into smaller sub-problems.' };
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return { hint: parsed.hint || 'Think about breaking the problem into smaller sub-problems.' };
      } catch {
        // fall through
      }
    }
    return { hint: text.replace(/[{}"]/g, '').trim() || 'Think about breaking the problem into smaller sub-problems.' };
  }
}

function parseEvaluateResponse(text: string): { score: number; feedback: string } {
  try {
    const parsed = JSON.parse(text);
    return {
      score: Math.min(5, Math.max(1, Number(parsed.score) || 3)),
      feedback: parsed.feedback || 'Answer recorded.',
    };
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.min(5, Math.max(1, Number(parsed.score) || 3)),
          feedback: parsed.feedback || 'Answer recorded.',
        };
      } catch {
        // fall through
      }
    }
    return { score: 3, feedback: 'Answer recorded.' };
  }
}

function parseFeedbackResponse(text: string): {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  summary: string;
} {
  try {
    const parsed = JSON.parse(text);
    return {
      overallScore: Math.min(10, Math.max(1, Number(parsed.overallScore) || 5)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : ['Completed the interview session'],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : ['Continue practicing'],
      summary: parsed.summary || 'Thank you for completing the interview session.',
    };
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overallScore: Math.min(10, Math.max(1, Number(parsed.overallScore) || 5)),
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : ['Completed the interview session'],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : ['Continue practicing'],
          summary: parsed.summary || 'Thank you for completing the interview session.',
        };
      } catch {
        // fall through
      }
    }
    return {
      overallScore: 5,
      strengths: ['Completed the interview session'],
      improvements: ['Continue practicing technical concepts'],
      summary: 'Thank you for completing the interview session. Keep practicing!',
    };
  }
}
