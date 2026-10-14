import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import mammoth from 'mammoth';
import { z } from 'zod';
import { Resume } from '../models/Resume.js';
import { UserProfile } from '../models/UserProfile.js';
import { generateResumeAnalysis, geminiAvailable } from '../services/gemini.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const uploadDirectory = path.join(process.cwd(), 'private', 'uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirectory),
  filename: (_req, file, cb) => {
    const random = crypto.randomBytes(12).toString('hex');
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${random}-${safe}`);
  },
});

const fileFilter = (_req: unknown, file: any, cb: multer.FileFilterCallback) => {
  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only PDF and DOCX files are allowed.'));
  }
  cb(null, true);
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

async function extractTextFromPdf(filePath: string) {
  const pdfjsLib = await import('pdfjs-dist');
  const pdf = await pdfjsLib.getDocument({ data: fs.readFileSync(filePath) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = (content.items as any[]).map((item: any) => item.str ?? '').join(' ');
    pages.push(pageText);
  }
  return pages.join('\n');
}

async function extractTextFromDocx(filePath: string) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function extractResidualText(filePath: string, mimeType: string) {
  if (mimeType === 'application/pdf') {
    return extractTextFromPdf(filePath);
  }

  if (mimeType.includes('word')) {
    return extractTextFromDocx(filePath);
  }

  return '';
}

const resumePayloadSchema = z.object({
  fileName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  storageName: z.string(),
  extractedText: z.string(),
  careerGoal: z.string().optional(),
});

export const saveResume = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'Resume file is required.' });
  }

  const extractedText = await extractResidualText(file.path, file.mimetype);
  if (!extractedText.trim()) {
    return res.status(400).json({ message: 'Resume file is empty or unreadable. Please upload a valid PDF or DOCX document.' });
  }

  const profile = await UserProfile.findOne({ user: req.user?.id }).lean();
  const careerGoal = (profile?.preferredCareer ?? 'Frontend Developer') as string;

  if (!geminiAvailable()) {
    await Resume.create({
      user: req.user?.id,
      fileName: file.originalname,
      storageName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      extractedText,
      summary: 'Gemini is not configured.',
      skills: [],
      experienceSummary: '',
      strengths: [],
      missingSkills: [],
      suggestions: [],
      alignmentScore: 0,
    });
    return res.status(503).json({ message: 'Gemini API is not configured. Resume text was stored but AI analysis is disabled until setup is complete.' });
  }

  const payload = await generateResumeAnalysis(`Analyze the resume below for a ${careerGoal} role. Return JSON with fields summary, skills, experienceSummary, strengths, missingSkills, suggestions, alignmentScore. Resume text: ${extractedText}`);

  const resume = await Resume.create({
    user: req.user?.id,
    fileName: file.originalname,
    storageName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    extractedText,
    summary: payload.summary,
    skills: payload.skills,
    experienceSummary: payload.experienceSummary,
    strengths: payload.strengths,
    missingSkills: payload.missingSkills,
    suggestions: payload.suggestions,
    alignmentScore: payload.alignmentScore,
  });

  return res.status(201).json({ resume });
});

export const listResumes = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const resumes = await Resume.find({ user: req.user?.id }).sort({ createdAt: -1 });
  return res.json({ resumes });
});

export const getResume = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user?.id });
  if (!resume) {
    return res.status(404).json({ message: 'Resume not found.' });
  }

  return res.json({ resume });
});

export const deleteResume = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user?.id });
  if (!resume) {
    return res.status(404).json({ message: 'Resume not found.' });
  }

  const filePath = path.join(uploadDirectory, resume.storageName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await resume.deleteOne();
  return res.json({ message: 'Resume deleted successfully.' });
});
