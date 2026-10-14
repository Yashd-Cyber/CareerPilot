import mongoose, { Schema } from 'mongoose';

export interface IJobDescriptionAnalysis extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  sourceType: 'paste' | 'upload';
  jobTitle: string;
  companyName?: string;
  rawText: string;
  requiredSkills: string[];
  preferredSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  summary: string;
  recommendedProjects: string[];
  learningResources: { title: string; url?: string }[];
  createdAt: Date;
}

const jobDescriptionAnalysisSchema = new Schema<IJobDescriptionAnalysis>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sourceType: { type: String, enum: ['paste', 'upload'], required: true },
    jobTitle: { type: String, default: '' },
    companyName: { type: String, default: '' },
    rawText: { type: String, default: '' },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    matchingSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    summary: { type: String, default: '' },
    recommendedProjects: { type: [String], default: [] },
    learningResources: [
      {
        title: String,
        url: String,
      },
    ],
  },
  { timestamps: true },
);

jobDescriptionAnalysisSchema.index({ user: 1, createdAt: -1 });

export const JobDescriptionAnalysis = mongoose.models.JobDescriptionAnalysis || mongoose.model<IJobDescriptionAnalysis>('JobDescriptionAnalysis', jobDescriptionAnalysisSchema);
