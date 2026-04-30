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
    const { profile, messages, action } = body;

    if (!profile || !profile.role || !profile.level) {
      return NextResponse.json(
        { error: 'Missing required profile fields' },
        { status: 400 }
      );
    }

    const zai = await getZAI();

    if (action === 'start') {
      // First question based on profile
      const profileContext = `Candidate Profile:
- Role: ${profile.role}
- Experience Level: ${profile.level}
- Skills: ${profile.skills || 'Not specified'}
- Previous Performance Score: ${profile.previousScore || 'Not available'}

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
        type: parsed.type,
        difficulty: parsed.difficulty,
      });
    }

    if (action === 'next') {
      // Subsequent questions based on conversation history
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
        type: parsed.type,
        difficulty: parsed.difficulty,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start" or "next"' },
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
    } else {
      context += `\nCandidate: ${msg.content}`;
    }
  }

  context += `\n\n${FOLLOWUP_PROMPT}`;

  return context;
}

function parseJSONResponse(text: string): {
  question: string;
  type: string;
  difficulty: string;
} {
  // Try to extract JSON from the response
  try {
    // First try direct parse
    return JSON.parse(text);
  } catch {
    // Try to find JSON in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // fall through
      }
    }

    // Fallback
    return {
      question: text.replace(/[{}"]/g, '').trim() || 'Tell me about a challenging technical problem you solved recently.',
      type: 'HR/Behavioral',
      difficulty: 'medium',
    };
  }
}
