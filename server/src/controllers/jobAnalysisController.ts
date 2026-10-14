import { z } from 'zod';
import { JobDescriptionAnalysis } from '../models/JobDescriptionAnalysis.js';
import { UserProfile } from '../models/UserProfile.js';
import { generateJobAnalysis, geminiAvailable } from '../services/gemini.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const jobSchema = z.object({
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  rawText: z.string().min(20),
  sourceType: z.enum(['paste', 'upload']).default('paste'),
});

export const createJobAnalysis = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = jobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Job description is invalid.' });
  }

  const { jobTitle, companyName, rawText, sourceType } = parsed.data;
  const profile = await UserProfile.findOne({ user: req.user?.id }).lean();

  if (!geminiAvailable()) {
    return res.status(503).json({ message: 'Gemini API is not configured. Please configure GEMINI_API_KEY to analyze job descriptions.' });
  }

  const payload = await generateJobAnalysis(`Analyze this job description for a candidate targeting ${profile?.preferredCareer ?? 'the target role'}. Compare the applicant profile and return JSON with fields jobTitle, requiredSkills, preferredSkills, matchingSkills, missingSkills, summary, recommendedProjects, learningResources. Job description:
  ${rawText}`);

  const analysis = await JobDescriptionAnalysis.create({
    user: req.user?.id,
    sourceType,
    jobTitle: jobTitle ?? payload.jobTitle,
    companyName: companyName ?? '',
    rawText,
    requiredSkills: payload.requiredSkills,
    preferredSkills: payload.preferredSkills,
    matchingSkills: payload.matchingSkills,
    missingSkills: payload.missingSkills,
    summary: payload.summary,
    recommendedProjects: payload.recommendedProjects,
    learningResources: payload.learningResources,
  });

  res.status(201).json({ analysis });
});

export const listJobAnalyses = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const analyses = await JobDescriptionAnalysis.find({ user: req.user?.id }).sort({ createdAt: -1 });
  res.json({ analyses });
});
