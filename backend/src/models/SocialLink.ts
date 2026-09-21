import mongoose, { Document, Schema } from 'mongoose';

export interface ISocialLink extends Document {
  platform: string;
  username: string;
  url: string;
  icon: string;
  visible: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const socialLinkSchema = new Schema<ISocialLink>(
  {
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      trim: true,
      maxlength: [50, 'Platform cannot exceed 50 characters'],
    },
    username: {
      type: String,
      default: '',
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
    },
    icon: {
      type: String,
      default: '',
    },
    visible: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

socialLinkSchema.index({ visible: 1, order: 1 });
socialLinkSchema.index({ platform: 1 });

export const SocialLink = mongoose.model<ISocialLink>('SocialLink', socialLinkSchema);
