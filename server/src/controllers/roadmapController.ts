import { z } from 'zod';
import { CareerRoadmap } from '../models/CareerRoadmap.js';
import { UserProfile } from '../models/UserProfile.js';
import { SkillAssessment } from '../models/SkillAssessment.js';
import { generateRoadmapFromProfile, geminiAvailable } from '../services/gemini.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const roadmapSchema = z.object({
  careerGoal: z.string().min(2),
  profile: z.object({}).passthrough().optional(),
});

export const createRoadmap = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = roadmapSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Roadmap request is invalid.' });
  }

  const { careerGoal, profile } = parsed.data;
  const profileData = await UserProfile.findOne({ user: req.user?.id }).lean();
  const latestAssessment = await SkillAssessment.findOne({ user: req.user?.id }).sort({ createdAt: -1 });

  if (!geminiAvailable()) {
    return res.status(503).json({ message: 'Gemini is not configured. Add GEMINI_API_KEY to enable roadmap generation.' });
  }

  const prompt = `
  Generate a structured JSON object for a personalized career roadmap.
  User profile: ${JSON.stringify(profile ?? profileData ?? {})}
  Latest assessment summary: ${JSON.stringify(latestAssessment ?? {})}
  Career goal: ${careerGoal}
  Keep output fields: summary, skillGaps, learningStages, milestones, learningResources.
  Add realistic durations and only include verified resource URLs when they are likely valid.
  `;

  const data = await generateRoadmapFromProfile(prompt);

  const roadmap = await CareerRoadmap.create({
    user: req.user?.id,
    careerGoal,
    summary: data.summary,
    skillGaps: data.skillGaps,
    learningStages: data.learningStages,
    milestones: data.milestones.map((milestone) => ({
      title: milestone.title,
      description: milestone.description,
      completed: false,
      prerequisites: milestone.prerequisites,
      duration: milestone.duration,
    })),
    learningResources: data.learningResources,
    status: 'ACTIVE',
  });

  res.status(201).json({ roadmap });
});

export const listRoadmaps = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const roadmaps = await CareerRoadmap.find({ user: req.user?.id }).sort({ createdAt: -1 });
  res.json({ roadmaps });
});

export const toggleMilestone = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id, milestoneIndex } = req.params;
  const roadmap = await CareerRoadmap.findOne({ _id: id, user: req.user?.id });
  if (!roadmap) {
    return res.status(404).json({ message: 'Roadmap not found.' });
  }

  const index = Number(milestoneIndex);
  if (Number.isNaN(index) || index < 0 || index >= roadmap.milestones.length) {
    return res.status(400).json({ message: 'Invalid milestone index.' });
  }

  const milestone = roadmap.milestones[index];
  milestone.completed = !milestone.completed;
  milestone.completedAt = milestone.completed ? new Date() : undefined;
  await roadmap.save();

  res.json({ roadmap });
});
