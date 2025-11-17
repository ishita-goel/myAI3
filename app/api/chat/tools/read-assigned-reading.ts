import { tool } from "ai";
import { z } from "zod";
import { readDocument } from "@/lib/pinecone";

export const readAssignedReading = tool({
    description: 'Read an assigned reading from a specific class and return the content of the reading',
    inputSchema: z.object({
        hypothetical_document: z.string().describe('An example of what the desired text would look like'),
        class_no: z.number().optional().describe('The class number of the assigned reading (optional)'),
    }),
    execute: async ({ hypothetical_document, class_no }) => {
        return await readDocument('assigned_reading', hypothetical_document, class_no);
    },
});

