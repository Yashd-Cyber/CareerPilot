import { z } from 'zod';
import { MockInterview } from '../models/MockInterview.js';
import { InterviewReport } from '../models/InterviewReport.js';
import { generateInterviewQuestion, evaluateAnswer, generateFinalInterviewReport, geminiAvailable } from '../services/gemini.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const interviewStartSchema = z.object({
  careerGoal: z.string().min(2),
  difficulty: z.string().default('Medium'),
  type: z.enum(['TECHNICAL', 'BEHAVIORAL', 'MIXED']).default('MIXED'),
  questionCount: z.number().int().min(1).max(5).default(3),
});

const answerSchema = z.object({
  answer: z.string().min(10),
});

export const startInterview = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = interviewStartSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Interview setup is invalid.' });
  }

  const { careerGoal, difficulty, type, questionCount } = parsed.data;

  if (!geminiAvailable()) {
    return res.status(503).json({ message: 'Gemini is not configured. Please configure GEMINI_API_KEY before starting a mock interview.' });
  }

  const firstQuestion = await generateInterviewQuestion(
    `Generate one ${type.toLowerCase()} interview question for a ${difficulty.toLowerCase()} ${careerGoal} candidate. Return JSON: {"question": string, "expectedFocus": string[]}`,
  );

  const interview = await MockInterview.create({
    user: req.user?.id,
    careerGoal,
    difficulty,
    type,
    status: 'IN_PROGRESS',
    questions: [{ question: firstQuestion.question, answer: '', evaluation: '', score: 0 }],
    currentQuestionIndex: 0,
    questionCount,
  });

  res.status(201).json({ interview });
});

export const getInterviews = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const interviews = await MockInterview.find({ user: req.user?.id }).sort({ createdAt: -1 });
  res.json({ interviews });
});

export const answerInterviewQuestion = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const interview = await MockInterview.findOne({ _id: req.params.id, user: req.user?.id });
  if (!interview) {
    return res.status(404).json({ message: 'Interview not found.' });
  }
  if (interview.status !== 'IN_PROGRESS' || interview.currentQuestionIndex >= interview.questionCount) {
    return res.status(400).json({ message: 'This interview has no unanswered questions.' });
  }

  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Answer is invalid.' });
  }

  const { answer } = parsed.data;
  const currentIndex = interview.currentQuestionIndex;
  const currentQuestion = interview.questions[currentIndex];
  if (!currentQuestion) {
    return res.status(400).json({ message: 'There is no active question.' });
  }

  if (!geminiAvailable()) {
    return res.status(503).json({ message: 'Gemini is not configured. Configure GEMINI_API_KEY before submitting interview answers.' });
  }

  const evaluation = await evaluateAnswer(
    `Evaluate answer ${currentIndex + 1} of ${interview.questionCount} in a ${interview.difficulty.toLowerCase()} ${interview.type.toLowerCase()} interview for a ${interview.careerGoal} role. Return JSON with score (0-100), strengths (string array), improvements (string array), overallSummary (string), and nextQuestion (one relevant, concise interview question). The current question is: ${currentQuestion.question}. The candidate's answer is: ${answer}`,
  );
  currentQuestion.evaluation = evaluation.overallSummary;
  currentQuestion.score = evaluation.score;
  currentQuestion.answer = answer;
  interview.currentQuestionIndex += 1;

  if (interview.currentQuestionIndex < interview.questionCount) {
    interview.questions.push({ question: evaluation.nextQuestion, answer: '', evaluation: '', score: 0 });
  }

  await interview.save();
  res.json({ interview, evaluation });
});

export const finalizeInterview = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const interview = await MockInterview.findOne({ _id: req.params.id, user: req.user?.id });
  if (!interview) {
    return res.status(404).json({ message: 'Interview not found.' });
  }
  const existingReport = await InterviewReport.findOne({ interview: interview._id });
  if (existingReport) {
    if (interview.status !== 'COMPLETED') {
      interview.status = 'COMPLETED';
      interview.completedAt = new Date();
      await interview.save();
    }
    return res.json({ report: existingReport, interview });
  }
  if (interview.currentQuestionIndex < interview.questionCount) {
    return res.status(400).json({ message: 'Answer every interview question before generating the report.' });
  }

  if (!geminiAvailable()) {
    return res.status(503).json({ message: 'Gemini is not configured. Configure GEMINI_API_KEY before generating the interview report.' });
  }
  const reportData = await generateFinalInterviewReport(
    `Create a final interview report JSON with fields overallScore, questionScores, strengths, improvements, summary, recommendations. Relevant data: role: ${interview.careerGoal}, questions: ${JSON.stringify(interview.questions)}`,
  );

  const report = await InterviewReport.create({
    user: req.user?.id,
    interview: interview._id,
    overallScore: reportData.overallScore,
    questionScores: reportData.questionScores,
    strengths: reportData.strengths,
    improvements: reportData.improvements,
    summary: reportData.summary,
    recommendations: reportData.recommendations,
  });

  interview.status = 'COMPLETED';
  interview.completedAt = new Date();
  await interview.save();

  res.json({ report, interview });
});
