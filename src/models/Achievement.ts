import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  title: string;
  description: string;
  organization: string;
  date: string;
  link: string;
  imageUrl: string;
  order: number;
  visible: boolean;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    organization: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: String,
      default: '',
    },
    link: {
      type: String,
      default: '',
    },
    imageUrl: {
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
    seoTitle: {
      type: String,
      default: '',
    },
    seoDescription: {
      type: String,
      default: '',
    },
    ogImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

achievementSchema.index({ visible: 1, order: 1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', achievementSchema);
