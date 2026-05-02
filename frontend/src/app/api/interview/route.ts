import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Ordered fallback list — using latest available models as of 2026
const MODEL_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

function getGeminiModel(modelName: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please add it to your environment variables in Vercel.');
  }
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName });
}

async function generateText(prompt: string): Promise<string> {
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACKS) {
    try {
      console.log(`[Interview API] Attempting generation with model: ${modelName}`);
      const model = getGeminiModel(modelName);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('Empty response from Gemini');
      }
      
      return text.trim();
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.response?.status;
      const message = err?.message || 'Unknown error';
      
      console.error(`[Interview API] Model "${modelName}" failed. Status: ${status}, Message: ${message}`);
      
      // Fallback on quota (429), model-not-found (404), or generic server errors (500, 503)
      if (status === 429 || status === 404 || status === 500 || status === 503) {
        console.warn(`[Interview API] Retrying with next model due to transient error: ${status}`);
        continue;
      }
      
      // If it's an auth error or bad request, don't bother retrying other models
      throw err;
    }
  }

  throw lastError ?? new Error('All Gemini models exhausted');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, messages, action, question, answer, questionTypes } = body;

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

    // Build question type focus instruction if provided
    const typeFocusInstruction = buildTypeFocusInstruction(questionTypes);

    if (action === 'start') {
      const profileContext = `${SYSTEM_PROMPT}

Candidate Profile:
- Role: ${profile.role}
- Experience Level: ${profile.level}
- Skills: ${profile.skills || 'Not specified'}
- Previous Performance Score: ${profile.previousScore || 'Not available'}
${profile.practiceMode ? '- Practice Mode: Enabled (hints are available)' : ''}
${typeFocusInstruction}

Generate the first interview question for this candidate. Start with an appropriate difficulty level based on their experience.`;

      const responseText = await generateText(profileContext);
      const parsed = parseJSONResponse(responseText);

      return NextResponse.json({
        success: true,
        question: parsed.question,
        type: normalizeType(parsed.type),
        difficulty: normalizeDifficulty(parsed.difficulty),
      });
    }

    if (action === 'next') {
      const conversationContext = buildConversationContext(profile, messages, typeFocusInstruction);
      const responseText = await generateText(`${SYSTEM_PROMPT}\n\n${conversationContext}`);
      const parsed = parseJSONResponse(responseText);

      return NextResponse.json({
        success: true,
        question: parsed.question,
        type: normalizeType(parsed.type),
        difficulty: normalizeDifficulty(parsed.difficulty),
      });
    }

    if (action === 'skip') {
      const skipContext = buildSkipContext(profile, messages, typeFocusInstruction);
      const responseText = await generateText(`${SYSTEM_PROMPT}\n\n${skipContext}`);
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
  } catch (error: any) {
    console.error('Interview API error:', error);
    
    // Provide a more descriptive error if it's a known issue
    let errorMessage = 'Failed to generate question';
    if (error?.message?.includes('GEMINI_API_KEY')) {
      errorMessage = 'API Key not configured. Please check your Vercel environment variables.';
    } else if (error?.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
    } else if (error?.status === 401 || error?.status === 403) {
      errorMessage = 'Invalid API Key. Please verify your GEMINI_API_KEY.';
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

function buildTypeFocusInstruction(questionTypes?: string[]): string {
  if (!questionTypes || questionTypes.length === 0) return '';
  const typeLabels: Record<string, string> = {
    'DSA': 'DSA (Data Structures and Algorithms)',
    'System Design': 'System Design',
    'HR/Behavioral': 'HR/Behavioral',
  };
  const labels = questionTypes.map((t) => typeLabels[t] || t).join(', ');
  return `- Question Focus: The candidate wants to focus on these question types: ${labels}. Prioritize these types but you may occasionally include others for variety.`;
}

async function handleHint(
  profile: { role: string; level: string; skills: string },
  messages: Array<{ role: string; content: string; questionType?: string; difficulty?: string }>,
  question?: string
) {
  let context = `${HINT_PROMPT}

Candidate Profile:
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

  context += 'Now provide a helpful hint:';

  try {
    const responseText = await generateText(context);
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
  const context = `${EVALUATE_PROMPT}

Candidate Profile:
- Role: ${profile.role}
- Experience Level: ${profile.level}

Question: ${question}

Candidate's Answer: ${answer}

Now evaluate the answer:`;

  try {
    const responseText = await generateText(context);
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
  let transcript = `${FEEDBACK_PROMPT}

Candidate Profile:
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

  transcript += '\n\nNow provide the detailed feedback JSON:';

  try {
    const responseText = await generateText(transcript);
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
  messages: Array<{ role: string; content: string; questionType?: string; difficulty?: string }>,
  typeFocusInstruction: string = ''
) {
  let context = `Candidate Profile:
- Role: ${profile.role}
- Experience Level: ${profile.level}
- Skills: ${profile.skills || 'Not specified'}
- Previous Performance Score: ${profile.previousScore || 'Not available'}
${typeFocusInstruction}

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
  messages: Array<{ role: string; content: string; questionType?: string; difficulty?: string }>,
  typeFocusInstruction: string = ''
) {
  let context = `Candidate Profile:
- Role: ${profile.role}
- Experience Level: ${profile.level}
- Skills: ${profile.skills || 'Not specified'}
${typeFocusInstruction}

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
  // Remove markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // fall through
      }
    }
    return {
      question: cleaned.replace(/[{}"]/g, '').trim() || 'Tell me about a challenging technical problem you solved recently.',
      type: 'HR/Behavioral',
      difficulty: 'medium',
    };
  }
}

function parseHintResponse(text: string): { hint: string } {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return { hint: parsed.hint || 'Think about breaking the problem into smaller sub-problems.' };
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return { hint: parsed.hint || 'Think about breaking the problem into smaller sub-problems.' };
      } catch {
        // fall through
      }
    }
    return { hint: cleaned.replace(/[{}"]/g, '').trim() || 'Think about breaking the problem into smaller sub-problems.' };
  }
}

function parseEvaluateResponse(text: string): { score: number; feedback: string } {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      score: Math.min(5, Math.max(1, Number(parsed.score) || 3)),
      feedback: parsed.feedback || 'Answer recorded.',
    };
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
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
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      overallScore: Math.min(10, Math.max(1, Number(parsed.overallScore) || 5)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : ['Completed the interview session'],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : ['Continue practicing'],
      summary: parsed.summary || 'Thank you for completing the interview session.',
    };
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
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
