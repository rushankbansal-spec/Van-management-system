import mongoose, { Document, Schema } from 'mongoose';

export interface IExperience extends Document {
  company: string;
  organization: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  technologies: string[];
  link: string;
  order: number;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const experienceSchema = new Schema<IExperience>(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    organization: {
      type: String,
      default: '',
      trim: true,
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
      maxlength: [200, 'Position cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    startDate: {
      type: String,
      default: '',
    },
    endDate: {
      type: String,
      default: '',
    },
    current: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      default: '',
    },
    technologies: {
      type: [String],
      default: [],
    },
    link: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    visible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

experienceSchema.index({ visible: 1, order: 1 });

export const Experience = mongoose.model<IExperience>('Experience', experienceSchema);
