import mongoose, { Schema } from 'mongoose';

export interface IInterviewReport extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  interview: mongoose.Types.ObjectId;
  overallScore: number;
  questionScores: { question: string; score: number }[];
  strengths: string[];
  improvements: string[];
  summary: string;
  recommendations: string[];
  createdAt: Date;
}

const interviewReportSchema = new Schema<IInterviewReport>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    interview: { type: Schema.Types.ObjectId, ref: 'MockInterview', required: true },
    overallScore: { type: Number, default: 0 },
    questionScores: [
      {
        question: String,
        score: Number,
      },
    ],
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    summary: { type: String, default: '' },
    recommendations: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const InterviewReport = mongoose.models.InterviewReport || mongoose.model<IInterviewReport>('InterviewReport', interviewReportSchema);
