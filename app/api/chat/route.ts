// app/api/chat/route.ts  (or frontend/app/api/chat/route.ts)

import {
  streamText,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";

import { MODEL } from "@/config";
import { SYSTEM_PROMPT } from "@/prompts";
import { isContentFlagged } from "@/lib/moderation";

// 🔧 tools – RAG first, web search as backup
import { vectorDatabaseSearch } from "./tools/search-vector-database";
import { webSearch } from "./tools/web-search";

export const maxDuration = 60;

// make TS happy and also fail fast if the key is missing
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // ---- 1) Run safety / moderation on the latest user text ----
  const latestUserMessage = messages.filter((m) => m.role === "user").pop();

  if (latestUserMessage) {
    const content = latestUserMessage.parts
      .filter((p) => p.type === "text")
      .map((p) => ("text" in p ? p.text : ""))
      .join("");

    if (content) {
      const mod = await isContentFlagged(content);

      if (mod.flagged) {
        // Use the helper from the ai SDK so types stay happy
        const stream = createUIMessageStream({
          execute({ writer }) {
            const id = "moderation-denial";

            writer.write({ type: "start" });
            writer.write({ type: "text-start", id });
            writer.write({
              type: "text-delta",
              id,
              delta:
                mod.denialMessage ??
                "Your message violates our guidelines. I can't answer that.",
            });
            writer.write({ type: "text-end", id });
            writer.write({ type: "finish" });
          },
        });

        return createUIMessageStreamResponse({ stream });
      }
    }
  }

  // ---- 2) Main model call – TOOLS: RAG FIRST, web search SECOND ----
  const result = streamText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),

    // Tools available to the model
    tools: {
      vectorDatabaseSearch, // 🔴 Your Pinecone / RAG tool – should be used first
      webSearch,            // 🔵 Fallback only when RAG has no data / ASIN missing
    },

    // stop tool-calling loops from going crazy
    stopWhen: stepCountIs(20),

    providerOptions: {
      openai: {
        apiKey: OPENAI_API_KEY,
        parallelToolCalls: false,
      },
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}
