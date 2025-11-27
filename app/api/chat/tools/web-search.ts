import { tool } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY);

export const webSearch = tool({
  description: 'Use ONLY for general market or category context, NOT for questions that can be answered from the Amazon review database. Do NOT use this for specific ASIN review analysis.',
  inputSchema: z.object({
    query: z.string().min(1).describe('The search query'),
  }),
  execute: async ({ query }) => {
    try {
      const { results } = await exa.search(query, {
        contents: {
          text: true,
        },
        numResults: 3,
      });

      return results.map(result => ({
        title: result.title,
        url: result.url,
        content: result.text?.slice(0, 1000) || '',
        publishedDate: result.publishedDate,
      }));
    } catch (error) {
      console.error('Error searching the web:', error);
      return [];
    }
  },
});
