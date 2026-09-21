import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { ProfileController } from '../controllers/profile.controller';
import { ProjectController } from '../controllers/project.controller';
import { SkillController } from '../controllers/skill.controller';
import { ExperienceController } from '../controllers/experience.controller';
import { AchievementController } from '../controllers/achievement.controller';
import { CertificationController } from '../controllers/certification.controller';
import { SocialController } from '../controllers/social.controller';
import { GithubController } from '../controllers/github.controller';
import { ResumeController } from '../controllers/resume.controller';
import { ContactController } from '../controllers/contact.controller';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { authLimiter, contactLimiter } from '../middleware/rateLimit.middleware';
import { upload } from '../services/storage.service';
import {
  validate,
  loginSchema,
  profileSchema,
  createProjectSchema,
  updateProjectSchema,
  projectPublishSchema,
  projectFeaturedSchema,
  projectReorderSchema,
  createSkillSchema,
  updateSkillSchema,
  skillReorderSchema,
  createExperienceSchema,
  updateExperienceSchema,
  createAchievementSchema,
  updateAchievementSchema,
  createCertificationSchema,
  updateCertificationSchema,
  createSocialLinkSchema,
  updateSocialLinkSchema,
  githubConfigSchema,
  createResumeSchema,
  updateResumeSchema,
  contactSchema,
} from '../validators';

export function setupRoutes(app: any) {
  // Health check (no auth required)
  app.get('/api/health', HealthController.health.bind(HealthController));

  // Auth routes
  app.post('/api/auth/login', authLimiter, validate(loginSchema), AuthController.login.bind(AuthController));
  app.get('/api/auth/me', requireAuth, AuthController.me.bind(AuthController));
  app.post('/api/auth/logout', AuthController.logout.bind(AuthController));

  // Profile routes
  app.get('/api/profile', ProfileController.getPublicProfile.bind(ProfileController));
  app.get('/api/admin/profile', requireAuth, requireAdmin, ProfileController.getAdminProfile.bind(ProfileController));
  app.put(
    '/api/admin/profile',
    requireAuth,
    requireAdmin,
    upload.single('profileImage'),
    validate(profileSchema),
    ProfileController.updateProfile.bind(ProfileController)
  );

  // Project routes
  app.get('/api/projects', ProjectController.getProjects.bind(ProjectController));
  app.get('/api/projects/:slug', ProjectController.getProjectBySlug.bind(ProjectController));
  app.get('/api/admin/projects', requireAuth, requireAdmin, ProjectController.getAdminProjects.bind(ProjectController));
  app.post(
    '/api/admin/projects',
    requireAuth,
    requireAdmin,
    upload.single('imageUrl'),
    validate(createProjectSchema),
    ProjectController.createProject.bind(ProjectController)
  );
  app.get('/api/admin/projects/:id', requireAuth, requireAdmin, ProjectController.getAdminProjectById.bind(ProjectController));
  app.put(
    '/api/admin/projects/:id',
    requireAuth,
    requireAdmin,
    upload.single('imageUrl'),
    validate(updateProjectSchema),
    ProjectController.updateProject.bind(ProjectController)
  );
  app.delete('/api/admin/projects/:id', requireAuth, requireAdmin, ProjectController.deleteProject.bind(ProjectController));
  app.patch(
    '/api/admin/projects/:id/publish',
    requireAuth,
    requireAdmin,
    validate(projectPublishSchema),
    ProjectController.publishProject.bind(ProjectController)
  );
  app.patch(
    '/api/admin/projects/:id/featured',
    requireAuth,
    requireAdmin,
    validate(projectFeaturedSchema),
    ProjectController.featureProject.bind(ProjectController)
  );
  app.patch(
    '/api/admin/projects/reorder',
    requireAuth,
    requireAdmin,
    validate(projectReorderSchema),
    ProjectController.reorderProjects.bind(ProjectController)
  );

  // Skill routes
  app.get('/api/skills', SkillController.getSkills.bind(SkillController));
  app.get('/api/admin/skills', requireAuth, requireAdmin, SkillController.getAdminSkills.bind(SkillController));
  app.post('/api/admin/skills', requireAuth, requireAdmin, validate(createSkillSchema), SkillController.createSkill.bind(SkillController));
  app.put('/api/admin/skills/:id', requireAuth, requireAdmin, validate(updateSkillSchema), SkillController.updateSkill.bind(SkillController));
  app.delete('/api/admin/skills/:id', requireAuth, requireAdmin, SkillController.deleteSkill.bind(SkillController));
  app.patch(
    '/api/admin/skills/reorder',
    requireAuth,
    requireAdmin,
    validate(skillReorderSchema),
    SkillController.reorderSkills.bind(SkillController)
  );

  // Experience routes
  app.get('/api/experience', ExperienceController.getExperience.bind(ExperienceController));
  app.get(
    '/api/admin/experience',
    requireAuth,
    requireAdmin,
    ExperienceController.getAdminExperience.bind(ExperienceController)
  );
  app.post(
    '/api/admin/experience',
    requireAuth,
    requireAdmin,
    validate(createExperienceSchema),
    ExperienceController.createExperience.bind(ExperienceController)
  );
  app.put(
    '/api/admin/experience/:id',
    requireAuth,
    requireAdmin,
    validate(updateExperienceSchema),
    ExperienceController.updateExperience.bind(ExperienceController)
  );
  app.delete(
    '/api/admin/experience/:id',
    requireAuth,
    requireAdmin,
    ExperienceController.deleteExperience.bind(ExperienceController)
  );

  // Achievement routes
  app.get('/api/achievements', AchievementController.getAchievements.bind(AchievementController));
  app.get(
    '/api/admin/achievements',
    requireAuth,
    requireAdmin,
    AchievementController.getAdminAchievements.bind(AchievementController)
  );
  app.post(
    '/api/admin/achievements',
    requireAuth,
    requireAdmin,
    upload.single('imageUrl'),
    validate(createAchievementSchema),
    AchievementController.createAchievement.bind(AchievementController)
  );
  app.put(
    '/api/admin/achievements/:id',
    requireAuth,
    requireAdmin,
    upload.single('imageUrl'),
    validate(updateAchievementSchema),
    AchievementController.updateAchievement.bind(AchievementController)
  );
  app.delete(
    '/api/admin/achievements/:id',
    requireAuth,
    requireAdmin,
    AchievementController.deleteAchievement.bind(AchievementController)
  );

  // Certification routes
  app.get('/api/certifications', CertificationController.getCertifications.bind(CertificationController));
  app.get(
    '/api/admin/certifications',
    requireAuth,
    requireAdmin,
    CertificationController.getAdminCertifications.bind(CertificationController)
  );
  app.post(
    '/api/admin/certifications',
    requireAuth,
    requireAdmin,
    upload.single('imageUrl'),
    validate(createCertificationSchema),
    CertificationController.createCertification.bind(CertificationController)
  );
  app.put(
    '/api/admin/certifications/:id',
    requireAuth,
    requireAdmin,
    upload.single('imageUrl'),
    validate(updateCertificationSchema),
    CertificationController.updateCertification.bind(CertificationController)
  );
  app.delete(
    '/api/admin/certifications/:id',
    requireAuth,
    requireAdmin,
    CertificationController.deleteCertification.bind(CertificationController)
  );

  // Social routes
  app.get('/api/socials', SocialController.getSocials.bind(SocialController));
  app.get('/api/admin/socials', requireAuth, requireAdmin, SocialController.getAdminSocials.bind(SocialController));
  app.post(
    '/api/admin/socials',
    requireAuth,
    requireAdmin,
    validate(createSocialLinkSchema),
    SocialController.createSocial.bind(SocialController)
  );
  app.put(
    '/api/admin/socials/:id',
    requireAuth,
    requireAdmin,
    validate(updateSocialLinkSchema),
    SocialController.updateSocial.bind(SocialController)
  );
  app.delete('/api/admin/socials/:id', requireAuth, requireAdmin, SocialController.deleteSocial.bind(SocialController));

  // GitHub routes
  app.get('/api/github', GithubController.getGithubConfig.bind(GithubController));
  app.get('/api/github/repos', GithubController.getGithubRepos.bind(GithubController));
  app.get('/api/admin/github', requireAuth, requireAdmin, GithubController.getAdminGithub.bind(GithubController));
  app.put(
    '/api/admin/github',
    requireAuth,
    requireAdmin,
    validate(githubConfigSchema),
    GithubController.updateGithubConfig.bind(GithubController)
  );

  // Resume routes
  app.get('/api/resume', ResumeController.getResume.bind(ResumeController));
  app.get('/api/admin/resume', requireAuth, requireAdmin, ResumeController.getAdminResume.bind(ResumeController));
  app.post(
    '/api/admin/resume',
    requireAuth,
    requireAdmin,
    upload.single('resume'),
    validate(createResumeSchema),
    ResumeController.createResume.bind(ResumeController)
  );
  app.put(
    '/api/admin/resume/:id',
    requireAuth,
    requireAdmin,
    upload.single('resume'),
    validate(updateResumeSchema),
    ResumeController.updateResume.bind(ResumeController)
  );
  app.delete('/api/admin/resume/:id', requireAuth, requireAdmin, ResumeController.deleteResume.bind(ResumeController));

  // Contact routes
  app.post('/api/contact', contactLimiter, validate(contactSchema), ContactController.createContact.bind(ContactController));
  app.get('/api/admin/contact', requireAuth, requireAdmin, ContactController.getAdminContacts.bind(ContactController));
  app.patch(
    '/api/admin/contact/:id/read',
    requireAuth,
    requireAdmin,
    ContactController.markAsRead.bind(ContactController)
  );
  app.delete('/api/admin/contact/:id', requireAuth, requireAdmin, ContactController.deleteContact.bind(ContactController));
}
