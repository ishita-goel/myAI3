import { openai } from "@ai-sdk/openai";
import { wrapLanguageModel, extractReasoningMiddleware } from "ai";
// Fireworks import kept in case you want it later
import { fireworks } from "@ai-sdk/fireworks";

// Default model — simple, fast
export const MODEL = openai("gpt-4.1-mini");

// Optional: enable Fireworks DeepSeek model instead
// export const MODEL = wrapLanguageModel({
//   model: fireworks('fireworks/deepseek-r1-0528'),
//   middleware: extractReasoningMiddleware({ tagName: 'think' }),
// });

function getDateAndTime(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return `The day today is ${dateStr} and the time right now is ${timeStr}.`;
}

export const DATE_AND_TIME = getDateAndTime();

// ==== SELLERSIGHT IDENTITY ====

export const AI_NAME = "SellerSight";
export const OWNER_NAME = "Ishita Goel";

export const WELCOME_MESSAGE = `
Welcome to SellerSight ⚡
An advanced AI system engineered to analyze real customer feedback, uncover hidden performance drivers, and forecast the outcomes of inaction.
I evaluate sentiment signals, competitive positioning, issue severity, and trajectory shifts to reveal the most decisive improvement opportunities.
Enter your ASIN to initiate analysis.
`;

// Button text
export const CLEAR_CHAT_TEXT = "New Analysis";

// ==== MODERATION MESSAGES (unchanged except text tone) ====

export const MODERATION_DENIAL_MESSAGE_ILLEGAL = 
  "I analyze Amazon product reviews and business questions only. I can’t help with illegal or policy-violating requests.";
export const MODERATION_DENIAL_MESSAGE_SEXUAL =
  "I can't discuss explicit sexual content. Please ask something else.";
export const MODERATION_DENIAL_MESSAGE_SEXUAL_MINORS =
  "I can't discuss content involving minors in a sexual context.";
export const MODERATION_DENIAL_MESSAGE_HARASSMENT =
  "I can't engage with harassing content. Please be respectful.";
export const MODERATION_DENIAL_MESSAGE_HARASSMENT_THREATENING =
  "I can't engage with threatening or harassing content.";
export const MODERATION_DENIAL_MESSAGE_HATE =
  "I can't engage with hateful content.";
export const MODERATION_DENIAL_MESSAGE_HATE_THREATENING =
  "I can't engage with threatening hate speech.";
export const MODERATION_DENIAL_MESSAGE_ILLICIT =
  "I can't help with illegal activities. Please keep it business-focused.";
export const MODERATION_DENIAL_MESSAGE_ILLICIT_VIOLENT =
  "I can't help with violent illegal activities.";
export const MODERATION_DENIAL_MESSAGE_SELF_HARM =
  "I can't engage in self-harm related content.";
export const MODERATION_DENIAL_MESSAGE_SELF_HARM_INTENT =
  "I can't discuss intentions of self-harm.";
export const MODERATION_DENIAL_MESSAGE_SELF_HARM_INSTRUCTIONS =
  "I can't provide instructions related to self-harm.";
export const MODERATION_DENIAL_MESSAGE_VIOLENCE =
  "I can't discuss violence. Let's focus on product insights!";
export const MODERATION_DENIAL_MESSAGE_VIOLENCE_GRAPHIC =
  "I can't discuss graphic violence.";
export const MODERATION_DENIAL_MESSAGE_DEFAULT =
  "Your message is outside allowed guidelines. Please ask something else.";

// ==== PINECONE CONFIG: IMPORTANT for RAG ====

export const PINECONE_TOP_K = 8;
export const PINECONE_INDEX_NAME = "sellersight-reviews"; // must match your Colab index name
