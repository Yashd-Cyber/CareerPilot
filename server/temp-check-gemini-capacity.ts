import { GoogleGenAI } from '@google/genai';
import env from './src/config/env.ts';
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const candidates = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash'];
const results = await Promise.all(candidates.map(async (model) => {
  let timeout;
  try {
    const response = await Promise.race([
      ai.models.generateContent({ model, contents: 'Return exactly {"ready":true} as JSON.', config: { responseMimeType: 'application/json' } }),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('timeout')), 12000); }),
    ]);
    return `${model}: ${response.text?.trim() ?? 'empty response'}`;
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : 'unknown';
    return `${model}: failed (${status})`;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}));
console.log(results.join('\n'));