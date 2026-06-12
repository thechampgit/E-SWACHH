import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Resilient env loading for GEMINI_API_KEY
if (!process.env.GEMINI_API_KEY) {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/GEMINI_API_KEY\s*=\s*([^\r\n]*)/);
      if (match && match[1]) {
        process.env.GEMINI_API_KEY = match[1].trim().replace(/['"]/g, '');
        console.log('Manually loaded GEMINI_API_KEY from .env');
      }
    }
  } catch (e) {
    console.warn('Resilient env loader failed:', e);
  }
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
