import mongoose, { Document, Schema } from 'mongoose';

export interface IGithub extends Document {
  username: string;
  profileUrl: string;
  enabled: boolean;
  showRepositories: boolean;
  showContributions: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const githubSchema = new Schema<IGithub>(
  {
    username: {
      type: String,
      required: [true, 'GitHub username is required'],
      trim: true,
      lowercase: true,
    },
    profileUrl: {
      type: String,
      default: '',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    showRepositories: {
      type: Boolean,
      default: true,
    },
    showContributions: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Github = mongoose.model<IGithub>('Github', githubSchema);
