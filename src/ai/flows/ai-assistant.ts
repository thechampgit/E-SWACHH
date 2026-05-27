'use server';
/**
 * @fileOverview e-Swachh Assistant chatbot flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiAssistantInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional(),
  message: z.string().describe('The user\'s message to the civic assistant.')
});

const AiAssistantOutputSchema = z.object({
  reply: z.string().describe('The assistant\'s helpful response.'),
  suggestedAction: z.enum(['file_report', 'track_report', 'view_map', 'none']).optional()
});

export async function chatWithAssistant(input: z.infer<typeof AiAssistantInputSchema>) {
  return aiAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistantPrompt',
  input: { schema: AiAssistantInputSchema },
  output: { schema: AiAssistantOutputSchema },
  prompt: `You are the e-Swachh Smart Assistant, a friendly and efficient helper for citizens. 
Your goal is to help users navigate the platform, explain how to file complaints, provide information on civic issues, and answer questions about city governance.

Platform Context:
- Users can file reports for Road Damage, Garbage, Water Supply, Electricity, Streetlight, and Drainage.
- There is a live Impact Map showing all reported issues.
- Users can track their specific reports via a unique reference ID.
- AI is used to automatically prioritize and categorize reports.

User Message: {{{message}}}

{{#if history}}
Conversation History:
{{#each history}}
- {{role}}: {{content}}
{{/each}}
{{/if}}

Provide a helpful, concise response. If the user seems to want to report something, suggest 'file_report'. If they want to see where issues are, suggest 'view_map'.`,
});

const aiAssistantFlow = ai.defineFlow(
  {
    name: 'aiAssistantFlow',
    inputSchema: AiAssistantInputSchema,
    outputSchema: AiAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);