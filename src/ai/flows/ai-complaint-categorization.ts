'use server';
/**
 * @fileOverview An AI agent for categorizing civic complaints.
 *
 * - categorizeComplaint - A function that handles the complaint categorization process.
 * - AiComplaintCategorizationInput - The input type for the categorizeComplaint function.
 * - AiComplaintCategorizationOutput - The return type for the categorizeComplaint function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiComplaintCategorizationInputSchema = z.object({
  description: z.string().describe('A detailed description of the civic issue.'),
  imageDataUri: z
    .string()
    .optional()
    .describe(
      "An optional photo of the civic issue, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AiComplaintCategorizationInput = z.infer<
  typeof AiComplaintCategorizationInputSchema
>;

const AiComplaintCategorizationOutputSchema = z.object({
  category: z
    .enum([
      'Garbage Collection Delays',
      'Overflowing Dustbins',
      'Illegal Dumping of Waste',
      'Poor Street Cleaning',
      'Lack of Public Toilets',
      'Open Drains & Unhygienic Areas',
      'Potholes & Damaged Roads',
      'Broken Footpaths',
      'Waterlogging During Rain',
      'Poor Drainage Systems',
      'Unsafe Bridges & Crossings',
      'Encroachment on Public Roads',
      'Other',
    ])
    .describe('The most appropriate category for the civic issue.'),
  priority: z
    .enum(['High', 'Medium', 'Low'])
    .describe('The suggested priority level for addressing the issue.'),
});
export type AiComplaintCategorizationOutput = z.infer<
  typeof AiComplaintCategorizationOutputSchema
>;

export async function categorizeComplaint(
  input: AiComplaintCategorizationInput
): Promise<AiComplaintCategorizationOutput> {
  return aiComplaintCategorizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeComplaintPrompt',
  input: { schema: AiComplaintCategorizationInputSchema },
  output: { schema: AiComplaintCategorizationOutputSchema },
  prompt: `You are an expert civic issue classifier. Your task is to analyze the provided complaint description and optionally an image, then determine the most appropriate category and a suitable priority level for the issue.

Available Categories: Road Damage, Garbage, Water Supply, Electricity, Streetlight, Drainage, Other.
Available Priorities: High, Medium, Low.

Complaint Description: {{{description}}}

{{#if imageDataUri}}
Photo of the issue: {{media url=imageDataUri}}
{{/if}}

Based on the information, classify the complaint into one of the categories and assign a priority level. Provide your response in the specified JSON format.`,
});

const aiComplaintCategorizationFlow = ai.defineFlow(
  {
    name: 'aiComplaintCategorizationFlow',
    inputSchema: AiComplaintCategorizationInputSchema,
    outputSchema: AiComplaintCategorizationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
