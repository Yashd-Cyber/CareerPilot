import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import env, { isGeminiConfigured } from '../config/env.js';
import { interviewEvaluationSchema } from './interviewSchemas.js';

const ai = isGeminiConfigured ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

export const geminiAvailable = () => Boolean(ai);

class GeminiResponseError extends Error {
  statusCode = 502;
}

export async function generateStructuredJson<T>(
  prompt: string,
  schema: z.ZodType<T>,
  options?: { timeoutMs?: number; retries?: number },
): Promise<T> {
  if (!ai) {
    throw new Error('Gemini API is not configured. Add GEMINI_API_KEY and GEMINI_MODEL to the server environment before using AI features.');
  }

  const timeoutMs = options?.timeoutMs ?? 30000;
  const retries = options?.retries ?? 1;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: env.GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: schema.toJSONSchema(),
          },
        }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Gemini request timed out.')), timeoutMs);
        }),
      ]) as { text?: string };

      const text = response.text ?? '{}';
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new GeminiResponseError('Gemini returned invalid JSON. Please retry.');
      }
      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        throw new GeminiResponseError('Gemini returned a response that did not match the required structure. Please retry.');
      }
      return validated.data;
    } catch (error) {
      if (error instanceof GeminiResponseError) {
        throw error;
      }
      const status = typeof error === 'object' && error !== null && 'status' in error
        ? Number(error.status)
        : undefined;
      const message = error instanceof Error ? error.message : String(error);
      const quotaExceeded = status === 429
        || /resource_exhausted|quota exceeded|rate limit/i.test(message);
      if (attempt === retries || quotaExceeded || (status !== undefined && status >= 400 && status < 500)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** attempt, 4000)));
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  throw new Error('Gemini response validation failed.');
}

export const roadmapSchema = z.object({
  summary: z.string(),
  skillGaps: z.array(z.string()),
  learningStages: z.array(z.object({
    title: z.string(),
    topics: z.array(z.string()),
    duration: z.string(),
  })),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string(),
    prerequisites: z.array(z.string()).default([]),
    duration: z.string(),
  })),
  learningResources: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
    type: z.string(),
  })),
});

export const resumeAnalysisSchema = z.object({
  summary: z.string(),
  skills: z.array(z.string()),
  experienceSummary: z.string(),
  strengths: z.array(z.string()),
  missingSkills: z.array(z.string()),
  suggestions: z.array(z.string()),
  alignmentScore: z.number().min(0).max(100),
});

export const jobAnalysisSchema = z.object({
  jobTitle: z.string(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  summary: z.string(),
  recommendedProjects: z.array(z.string()),
  learningResources: z.array(z.object({ title: z.string(), url: z.string().optional() })),
});

export const interviewQuestionSchema = z.object({
  question: z.string(),
  expectedFocus: z.array(z.string()),
});

export const interviewReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  questionScores: z.array(z.object({ question: z.string(), score: z.number().min(0).max(100) })),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

export async function generateRoadmapFromProfile(payload: string) {
  return generateStructuredJson(payload, roadmapSchema);
}

export async function generateResumeAnalysis(payload: string) {
  return generateStructuredJson(payload, resumeAnalysisSchema);
}

export async function generateJobAnalysis(payload: string) {
  return generateStructuredJson(payload, jobAnalysisSchema);
}

export async function generateInterviewQuestion(payload: string) {
  return generateStructuredJson(payload, interviewQuestionSchema);
}

export async function evaluateAnswer(payload: string) {
  return generateStructuredJson(payload, interviewEvaluationSchema);
}

export async function generateFinalInterviewReport(payload: string) {
  return generateStructuredJson(payload, interviewReportSchema);
}
