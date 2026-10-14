import { z } from 'zod';

export const interviewEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  nextQuestion: z.string().min(1),
  overallSummary: z.string(),
});
