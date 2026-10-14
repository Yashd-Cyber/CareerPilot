import mongoose, { Schema } from 'mongoose';

export interface IRoadmapMilestone {
  title: string;
  description: string;
  completed: boolean;
  dueDate?: Date;
  completedAt?: Date;
  prerequisites: string[];
  duration: string;
}

export interface ICareerRoadmap extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  careerGoal: string;
  summary: string;
  skillGaps: string[];
  learningStages: { title: string; topics: string[]; duration: string }[];
  milestones: IRoadmapMilestone[];
  learningResources: { title: string; url?: string; type: string }[];
  status: 'ACTIVE' | 'ARCHIVED';
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const roadmapSchema = new Schema<ICareerRoadmap>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    careerGoal: { type: String, required: true },
    summary: { type: String, default: '' },
    skillGaps: { type: [String], default: [] },
    learningStages: [
      {
        title: String,
        topics: [String],
        duration: String,
      },
    ],
    milestones: [
      {
        title: String,
        description: String,
        completed: { type: Boolean, default: false },
        dueDate: Date,
        completedAt: Date,
        prerequisites: [String],
        duration: String,
      },
    ],
    learningResources: [
      {
        title: String,
        url: String,
        type: String,
      },
    ],
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

roadmapSchema.index({ user: 1, createdAt: -1 });

export const CareerRoadmap = mongoose.models.CareerRoadmap || mongoose.model<ICareerRoadmap>('CareerRoadmap', roadmapSchema);
