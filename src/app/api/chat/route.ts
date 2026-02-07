import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildSystemPrompt } from '@/lib/chat/system-prompt';
import { chatTools } from '@/lib/chat/tools';
import { checkRateLimit } from '@/lib/chat/rate-limiter';
import type { CityId } from '@/types/shared';

const MAX_MESSAGE_LENGTH = 500;
const MONTHLY_BUDGET_USD = parseFloat(
  process.env.CHAT_MONTHLY_BUDGET_USD ?? '50',
);

// Approximate cost tracking (resets on serverless restart)
let monthlyTokenCostUsd = 0;

// Rough cost estimate: Sonnet ~$3/1M input, ~$15/1M output
function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * 3) / 1_000_000 + (outputTokens * 15) / 1_000_000;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}

function getLastUserText(messages: UIMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      const textParts = messages[i].parts.filter(
        (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text',
      );
      return textParts.map((p) => p.text).join('');
    }
  }
  return null;
}

export async function POST(req: Request) {
  // Budget check
  if (monthlyTokenCostUsd >= MONTHLY_BUDGET_USD) {
    return new Response(
      JSON.stringify({ error: 'Chat is temporarily unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Rate limiting
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: "You've reached the message limit. Try again in a few minutes.",
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.retryAfterSeconds ?? 3600),
        },
      },
    );
  }

  // Parse request body (UIMessage format from @ai-sdk/react useChat)
  let body: {
    messages: UIMessage[];
    city?: CityId | null;
    filters?: { datePreset: string; activeModes: string[] };
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, city = null, filters } = body;

  // Validate messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Messages required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate last user message length
  const lastUserText = getLastUserText(messages);
  if (lastUserText && lastUserText.length > MAX_MESSAGE_LENGTH) {
    return new Response(
      JSON.stringify({
        error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.`,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('MISSING: ANTHROPIC_API_KEY');
    return new Response(
      JSON.stringify({ error: 'Chat is temporarily unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const systemPrompt = buildSystemPrompt(city ?? null, filters);

    // Convert UIMessages to ModelMessages for the LLM
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages: modelMessages,
      tools: chatTools,
      stopWhen: stepCountIs(3),
      temperature: 0.3,
      onFinish: ({ usage }) => {
        if (usage) {
          const cost = estimateCost(
            usage.inputTokens ?? 0,
            usage.outputTokens ?? 0,
          );
          monthlyTokenCostUsd += cost;
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('Chat API error:', err);
    const message =
      err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
