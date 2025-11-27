import {
  streamText,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from 'ai';
import { MODEL } from '@/config';
import { SYSTEM_PROMPT } from '@/prompts';
import { isContentFlagged } from '@/lib/moderation';
import { webSearch } from './tools/web-search';
import { vectorDatabaseSearch } from './tools/search-vector-database';

export const maxDuration = 30;

// ---- API key handling -------------------------------------------------

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  // This will fail fast at build / first request if the env var is missing,
  // instead of giving you confusing 401s from OpenAI.
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// ---- Route handler ----------------------------------------------------

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Grab the latest user message to run moderation on it
  const latestUserMessage = messages.filter(msg => msg.role === 'user').pop();

  if (latestUserMessage) {
    const textParts = latestUserMessage.parts
      .filter(part => part.type === 'text')
      .map(part => ('text' in part ? part.text : ''))
      .join('');

    if (textParts) {
      const moderationResult = await isContentFlagged(textParts);

      if (moderationResult.flagged) {
        const stream = createUIMessageStream({
          execute({ writer }) {
            const textId = 'moderation-denial-text';

            writer.write({ type: 'start' });

            writer.write({
              type: 'text-start',
              id: textId,
            });

            writer.write({
              type: 'text-delta',
              id: textId,
              delta:
                moderationResult.denialMessage ||
                "Your message violates our guidelines. I can't answer that.",
            });

            writer.write({
              type: 'text-end',
              id: textId,
            });

            writer.write({ type: 'finish' });
          },
        });

        return createUIMessageStreamResponse({ stream });
      }
    }
  }

  // Main AI call
  const result = streamText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools: {
      webSearch,
      vectorDatabaseSearch,
    },
    stopWhen: stepCountIs(10),
    providerOptions: {
      openai: {
        apiKey: OPENAI_API_KEY, // <- now guaranteed string (no TS error)
        reasoningSummary: 'auto',
        reasoningEffort: 'low',
        parallelToolCalls: false,
      },
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}
