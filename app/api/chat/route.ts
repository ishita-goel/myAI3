
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { MODEL } from '@/config';
import { SYSTEM_PROMPT } from '@/prompts';
import { webSearch } from './tools/web-search';
import { readNotebookLecture } from './tools/read-notebook-lecture';
import { readSlideLecture } from './tools/read-slide-lecture';
import { readSyllabus } from './tools/read-syllabus';
import { readAssignment } from './tools/read-assignment';
import { readAssignedReading } from './tools/read-assigned-reading';

export const maxDuration = 30;
export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
        model: MODEL,
        system: SYSTEM_PROMPT,
        messages: convertToModelMessages(messages),
        tools: {
            webSearch,
            readNotebookLecture,
            readSlideLecture,
            readSyllabus,
            readAssignment,
            readAssignedReading,
        },
        stopWhen: stepCountIs(10),
        providerOptions: {
            openai: {
                reasoningSummary: 'auto',
                reasoningEffort: 'low',
                parallelToolCalls: false,
            }
        }
    });

    return result.toUIMessageStreamResponse({
        sendReasoning: true,
    });
}