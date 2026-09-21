import mongoose, { Document, Schema } from 'mongoose';

export interface IResume extends Document {
  title: string;
  fileUrl: string;
  fileName: string;
  version: string;
  uploadedAt: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    title: {
      type: String,
      required: [true, 'Resume title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    version: {
      type: String,
      default: '1.0',
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

resumeSchema.index({ active: 1 });

export const Resume = mongoose.model<IResume>('Resume', resumeSchema);
