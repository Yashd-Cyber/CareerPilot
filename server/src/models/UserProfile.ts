import mongoose, { Schema } from 'mongoose';

export interface IUserProfile extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  education: string;
  experienceLevel: string;
  currentSkills: string[];
  preferredCareer: string;
  careerInterests: string[];
  availableStudyTime: string;
  professionalGoals: string;
  customCareerGoal?: string;
  updatedAt: Date;
}

const profileSchema = new Schema<IUserProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    education: { type: String, default: '' },
    experienceLevel: { type: String, default: 'Beginner' },
    currentSkills: { type: [String], default: [] },
    preferredCareer: { type: String, default: 'Frontend Developer' },
    careerInterests: { type: [String], default: [] },
    availableStudyTime: { type: String, default: '5 hours/week' },
    professionalGoals: { type: String, default: '' },
    customCareerGoal: { type: String, default: '' },
  },
  { timestamps: true },
);

export const UserProfile = mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', profileSchema);
