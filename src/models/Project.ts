import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  detailedDescription: string;
  technologies: string[];
  category: string;
  githubUrl: string;
  liveUrl: string;
  imageUrl: string;
  videoUrl: string;
  year: string;
  featured: boolean;
  published: boolean;
  order: number;
  challenges: string;
  features: string;
  results: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    detailedDescription: {
      type: String,
      default: '',
    },
    technologies: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: 'Other',
      trim: true,
    },
    githubUrl: {
      type: String,
      default: '',
    },
    liveUrl: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    videoUrl: {
      type: String,
      default: '',
    },
    year: {
      type: String,
      default: new Date().getFullYear().toString(),
    },
    featured: {
      type: Boolean,
      default: false,
    },
    published: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    challenges: {
      type: String,
      default: '',
    },
    features: {
      type: String,
      default: '',
    },
    results: {
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
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ slug: 1 }, { unique: true });
projectSchema.index({ published: 1, featured: 1 });
projectSchema.index({ published: 1, category: 1 });
projectSchema.index({ order: 1 });

// Pre-save hook to generate slug from title if not provided
projectSchema.pre('save', function (next) {
  if (!this.isModified('slug') && this.title) {
    const slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    this.slug = slug || 'project';
  }
  next();
});

projectSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug, published: true });
};

export const Project = mongoose.model<IProject>('Project', projectSchema);
