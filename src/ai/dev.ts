import { config } from 'dotenv';
config();

import '@/ai/flows/ai-complaint-categorization.ts';
import '@/ai/flows/ai-complaint-moderation.ts';
import '@/ai/flows/ai-assistant.ts';