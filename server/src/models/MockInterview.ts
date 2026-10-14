import mongoose, { Schema } from 'mongoose';

export interface IMockInterviewQuestion {
  question: string;
  answer?: string;
  evaluation?: string;
  score?: number;
}

export interface IMockInterview extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  careerGoal: string;
  difficulty: string;
  type: 'TECHNICAL' | 'BEHAVIORAL' | 'MIXED';
  status: 'IN_PROGRESS' | 'COMPLETED';
  questions: IMockInterviewQuestion[];
  currentQuestionIndex: number;
  questionCount: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mockInterviewSchema = new Schema<IMockInterview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    careerGoal: { type: String, required: true },
    difficulty: { type: String, default: 'Medium' },
    type: { type: String, enum: ['TECHNICAL', 'BEHAVIORAL', 'MIXED'], default: 'MIXED' },
    status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED'], default: 'IN_PROGRESS' },
    questions: [
      {
        question: String,
        answer: String,
        evaluation: String,
        score: Number,
      },
    ],
    currentQuestionIndex: { type: Number, default: 0 },
    questionCount: { type: Number, min: 1, max: 5, default: 3 },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true },
);

export const MockInterview = mongoose.models.MockInterview || mongoose.model<IMockInterview>('MockInterview', mockInterviewSchema);
