import mongoose, { Schema } from 'mongoose';

export interface IAssessmentAnswer {
  question: string;
  selectedOption: string;
  correctOption?: string;
  isCorrect?: boolean;
}

export interface ISkillAssessment extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  careerGoal: string;
  questions: { question: string; options: string[]; answer: string }[];
  answers: IAssessmentAnswer[];
  score: number;
  resultSummary: string;
  weakAreas: string[];
  createdAt: Date;
}

const assessmentSchema = new Schema<ISkillAssessment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    careerGoal: { type: String, required: true },
    questions: [
      {
        question: String,
        options: [String],
        answer: String,
      },
    ],
    answers: [
      {
        question: String,
        selectedOption: String,
        correctOption: String,
        isCorrect: Boolean,
      },
    ],
    score: { type: Number, default: 0 },
    resultSummary: { type: String, default: '' },
    weakAreas: { type: [String], default: [] },
  },
  { timestamps: true },
);

assessmentSchema.index({ user: 1, createdAt: -1 });

export const SkillAssessment = mongoose.models.SkillAssessment || mongoose.model<ISkillAssessment>('SkillAssessment', assessmentSchema);
