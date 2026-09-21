import { z } from 'zod';

// Auth validators
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Profile validators
export const profileSchema = z.object({
  name: z.string().trim().max(100, 'Name too long'),
  role: z.string().trim().max(100, 'Role too long'),
  tagline: z.string().trim().max(200, 'Tagline too long'),
  bio: z.string().max(2000, 'Bio too long').optional(),
  email: z.string().email('Invalid email'),
  phone: z.string().max(50, 'Phone too long').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  college: z.string().max(200, 'College too long').optional(),
  degree: z.string().max(200, 'Degree too long').optional(),
  year: z.string().max(20, 'Year too long').optional(),
  registrationNumber: z.string().max(50, 'Registration number too long').optional(),
  cgpa: z.string().max(20, 'CGPA too long').optional(),
  tenthMarks: z.string().max(50, '10th marks too long').optional(),
  twelfthMarks: z.string().max(50, '12th marks too long').optional(),
  profileImage: z.string().url('Invalid URL').optional().or(z.literal('')),
  resumeUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  seoTitle: z.string().max(200, 'SEO title too long').optional(),
  seoDescription: z.string().max(300, 'SEO description too long').optional(),
  ogImage: z.string().url('Invalid URL').optional().or(z.literal('')),
  availabilityStatus: z.boolean().optional(),
  availabilityText: z.string().max(200, 'Availability text too long').optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// Project validators
export const createProjectSchema = z.object({
  title: z.string().trim().max(200, 'Title too long'),
  shortDescription: z.string().trim().max(300, 'Short description too long'),
  description: z.string().max(3000, 'Description too long').optional(),
  detailedDescription: z.string().max(10000, 'Detailed description too long').optional(),
  technologies: z.array(z.string().trim()).max(20, 'Too many technologies'),
  category: z.string().trim().max(100, 'Category too long').optional(),
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  liveUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  videoUrl: z.string().url('Invalid video URL').optional().or(z.literal('')),
  year: z.string().max(10, 'Year too long').optional(),
  challenges: z.string().max(2000, 'Challenges too long').optional(),
  features: z.string().max(2000, 'Features too long').optional(),
  results: z.string().max(2000, 'Results too long').optional(),
  seoTitle: z.string().max(200, 'SEO title too long').optional(),
  seoDescription: z.string().max(300, 'SEO description too long').optional(),
  ogImage: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectPublishSchema = z.object({
  published: z.boolean(),
});

export const projectFeaturedSchema = z.object({
  featured: z.boolean(),
});

export const projectReorderSchema = z.object({
  projects: z.array(
    z.object({
      id: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid project ID'),
      order: z.number().int().min(0),
    })
  ).min(1, 'At least one project required'),
});

// Skill validators
export const createSkillSchema = z.object({
  name: z.string().trim().max(100, 'Name too long'),
  category: z.enum(['Programming', 'Frontend', 'Backend', 'Database', 'AI/ML', 'Tools']),
  level: z.number().int().min(0).max(100).optional().default(80),
  icon: z.string().max(200, 'Icon too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  order: z.number().int().min(0).optional().default(0),
  visible: z.boolean().optional().default(true),
});

export const updateSkillSchema = createSkillSchema.partial();

export const skillReorderSchema = z.object({
  skills: z.array(
    z.object({
      id: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid skill ID'),
      order: z.number().int().min(0),
    })
  ).min(1, 'At least one skill required'),
});

// Experience validators
export const createExperienceSchema = z.object({
  company: z.string().trim().max(200, 'Company too long'),
  organization: z.string().trim().max(200, 'Organization too long').optional(),
  position: z.string().trim().max(200, 'Position too long'),
  description: z.string().max(3000, 'Description too long').optional(),
  startDate: z.string().max(50, 'Invalid start date').optional(),
  endDate: z.string().max(50, 'Invalid end date').optional(),
  current: z.boolean().optional().default(false),
  location: z.string().max(200, 'Location too long').optional(),
  technologies: z.array(z.string().trim()).max(20, 'Too many technologies').optional(),
  link: z.string().url('Invalid URL').optional().or(z.literal('')),
  order: z.number().int().min(0).optional().default(0),
  visible: z.boolean().optional().default(true),
});

export const updateExperienceSchema = createExperienceSchema.partial();

// Achievement validators
export const createAchievementSchema = z.object({
  title: z.string().trim().max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  organization: z.string().trim().max(200, 'Organization too long').optional(),
  date: z.string().max(50, 'Invalid date').optional(),
  link: z.string().url('Invalid URL').optional().or(z.literal('')),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  order: z.number().int().min(0).optional().default(0),
  visible: z.boolean().optional().default(true),
  seoTitle: z.string().max(200, 'SEO title too long').optional(),
  seoDescription: z.string().max(300, 'SEO description too long').optional(),
  ogImage: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

export const updateAchievementSchema = createAchievementSchema.partial();

// Certification validators
export const createCertificationSchema = z.object({
  name: z.string().trim().max(200, 'Name too long'),
  issuer: z.string().trim().max(200, 'Issuer too long'),
  issueDate: z.string().max(50, 'Invalid date').optional(),
  credentialId: z.string().max(100, 'Credential ID too long').optional(),
  credentialUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  order: z.number().int().min(0).optional().default(0),
  visible: z.boolean().optional().default(true),
});

export const updateCertificationSchema = createCertificationSchema.partial();

// Social Link validators
export const createSocialLinkSchema = z.object({
  platform: z.string().trim().max(50, 'Platform too long'),
  username: z.string().trim().max(100, 'Username too long').optional(),
  url: z.string().url('Invalid URL'),
  icon: z.string().max(200, 'Icon too long').optional(),
  order: z.number().int().min(0).optional().default(0),
  visible: z.boolean().optional().default(true),
});

export const updateSocialLinkSchema = createSocialLinkSchema.partial();

// GitHub config validators
export const githubConfigSchema = z.object({
  username: z.string().trim().max(100, 'Username too long').optional(),
  profileUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  enabled: z.boolean().optional(),
  showRepositories: z.boolean().optional(),
  showContributions: z.boolean().optional(),
});

// Resume validators
export const createResumeSchema = z.object({
  title: z.string().trim().max(200, 'Title too long'),
  fileUrl: z.string().url('Invalid file URL'),
  fileName: z.string().trim().max(200, 'File name too long'),
  version: z.string().max(50, 'Version too long').optional().default('1.0'),
  active: z.boolean().optional().default(false),
});

export const updateResumeSchema = createResumeSchema.partial();

// Contact validators (public)
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name too short').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().trim().max(200, 'Subject too long').optional(),
  message: z.string().trim().min(10, 'Message too short').max(5000, 'Message too long'),
});

export type ContactInput = z.infer<typeof contactSchema>;

// Validation middleware factory
export const validate = <T>(schema: z.ZodSchema<T>) => {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }
    req.validatedBody = result.data;
    next();
  };
};

export type ValidationMiddleware = ReturnType<typeof validate>;
