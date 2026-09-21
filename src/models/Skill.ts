import mongoose, { Document, Schema } from 'mongoose';

export interface ISkill extends Document {
  name: string;
  category: string;
  level: number;
  icon: string;
  description: string;
  order: number;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Programming', 'Frontend', 'Backend', 'Database', 'AI/ML', 'Tools'],
    },
    level: {
      type: Number,
      default: 80,
      min: [0, 'Level must be between 0 and 100'],
      max: [100, 'Level must be between 0 and 100'],
    },
    icon: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
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

skillSchema.index({ category: 1, order: 1 });
skillSchema.index({ visible: 1 });

export const Skill = mongoose.model<ISkill>('Skill', skillSchema);
