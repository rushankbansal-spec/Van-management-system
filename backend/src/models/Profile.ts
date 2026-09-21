import mongoose, { Document, Schema } from 'mongoose';

export interface IProfile extends Document {
  name: string;
  role: string;
  tagline: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  college: string;
  degree: string;
  year: string;
  registrationNumber: string;
  cgpa: string;
  tenthMarks: string;
  twelfthMarks: string;
  profileImage: string;
  resumeUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  availabilityStatus: boolean;
  availabilityText: string;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    tagline: {
      type: String,
      required: [true, 'Tagline is required'],
      trim: true,
      maxlength: [200, 'Tagline cannot exceed 200 characters'],
    },
    bio: {
      type: String,
      default: '',
      maxlength: [2000, 'Bio cannot exceed 2000 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    college: {
      type: String,
      default: '',
    },
    degree: {
      type: String,
      default: '',
    },
    year: {
      type: String,
      default: '',
    },
    registrationNumber: {
      type: String,
      default: '',
    },
    cgpa: {
      type: String,
      default: '',
    },
    tenthMarks: {
      type: String,
      default: '',
    },
    twelfthMarks: {
      type: String,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    githubUrl: {
      type: String,
      default: '',
    },
    linkedinUrl: {
      type: String,
      default: '',
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
    availabilityStatus: {
      type: Boolean,
      default: true,
    },
    availabilityText: {
      type: String,
      default: 'Available for projects',
    },
  },
  {
    timestamps: true,
  }
);

profileSchema.index({ name: 1 });

export const Profile = mongoose.model<IProfile>('Profile', profileSchema);
