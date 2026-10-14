import mongoose, { Schema } from 'mongoose';

export interface IResume extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  fileName: string;
  storageName: string;
  mimeType: string;
  size: number;
  extractedText: string;
  summary: string;
  skills: string[];
  experienceSummary: string;
  strengths: string[];
  missingSkills: string[];
  suggestions: string[];
  alignmentScore: number;
  createdAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    storageName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    extractedText: { type: String, default: '' },
    summary: { type: String, default: '' },
    skills: { type: [String], default: [] },
    experienceSummary: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
    alignmentScore: { type: Number, default: 0 },
  },
  { timestamps: true },
);

resumeSchema.index({ user: 1, createdAt: -1 });

export const Resume = mongoose.models.Resume || mongoose.model<IResume>('Resume', resumeSchema);
