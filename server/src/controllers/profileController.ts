import { z } from 'zod';
import { UserProfile } from '../models/UserProfile.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const profileSchema = z.object({
  education: z.string().optional(),
  experienceLevel: z.string().optional(),
  currentSkills: z.array(z.string()).optional(),
  preferredCareer: z.string().optional(),
  careerInterests: z.array(z.string()).optional(),
  availableStudyTime: z.string().optional(),
  professionalGoals: z.string().optional(),
  customCareerGoal: z.string().optional(),
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const profile = await UserProfile.findOne({ user: req.user?.id }).lean();
  res.json({ profile: profile ?? { user: req.user?.id } });
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Profile data is invalid.' });
  }

  const updates = parsed.data;
  const profile = await UserProfile.findOneAndUpdate(
    { user: req.user?.id },
    { $set: updates },
    { new: true, upsert: true },
  );

  return res.json({ profile });
});
