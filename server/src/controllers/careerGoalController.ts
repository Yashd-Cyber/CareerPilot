import { z } from 'zod';
import { UserProfile } from '../models/UserProfile.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const careerGoals = [
  'Frontend Developer',
  'Backend Developer',
  'Full-Stack Developer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Cybersecurity Analyst',
];

const customCareerGoalSchema = z.object({
  customCareerGoal: z.string().min(2),
});

export const getCareerGoals = asyncHandler(async (_req, res) => {
  res.json({ goals: careerGoals });
});

export const setCareerGoal = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = customCareerGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Career goal is invalid.' });
  }

  const profile = await UserProfile.findOneAndUpdate(
    { user: req.user?.id },
    { $set: { preferredCareer: parsed.data.customCareerGoal, customCareerGoal: parsed.data.customCareerGoal } },
    { new: true, upsert: true },
  );

  return res.json({ profile });
});
