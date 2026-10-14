import { User } from '../models/User.js';
import { SkillAssessment } from '../models/SkillAssessment.js';
import { CareerRoadmap } from '../models/CareerRoadmap.js';
import { Resume } from '../models/Resume.js';
import { MockInterview } from '../models/MockInterview.js';
import { InterviewReport } from '../models/InterviewReport.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const getAnalytics = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const [assessments, roadmaps, resumes, interviews, reports, userCount] = await Promise.all([
    SkillAssessment.find({ user: req.user?.id }).lean(),
    CareerRoadmap.find({ user: req.user?.id }).lean(),
    Resume.find({ user: req.user?.id }).lean(),
    MockInterview.find({ user: req.user?.id }).lean(),
    InterviewReport.find({ user: req.user?.id }).lean(),
    User.countDocuments({}),
  ]);

  const totalMilestones = roadmaps.reduce((sum, roadmap) => sum + (roadmap.milestones?.length ?? 0), 0);
  const completedMilestones = roadmaps.reduce((sum, roadmap) => sum + (roadmap.milestones?.filter((m: any) => m.completed).length ?? 0), 0);
  const progressPct = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  const averageInterviewScore = reports.length ? Math.round(reports.reduce((sum, item) => sum + (item.overallScore ?? 0), 0) / reports.length) : 0;

  const chartData = reports.map((report) => ({
    date: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A',
    score: report.overallScore ?? 0,
  }));

  return res.json({
    metrics: {
      totalMilestones,
      completedMilestones,
      progressPct,
      assessmentsCompleted: assessments.length,
      interviewAttempts: interviews.length,
      averageInterviewScore,
      resumeCount: resumes.length,
      totalUsers: userCount,
    },
    recentActivities: [...assessments, ...roadmaps, ...resumes, ...interviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
    scoreHistory: chartData,
  });
});
