import { Router } from 'express';
import { ExperienceController } from '../controllers/experience.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { validate, createExperienceSchema, updateExperienceSchema } from '../validators';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// GET /api/experience - Get all visible experience
router.get('/', ExperienceController.getExperience.bind(ExperienceController));

// ==================== ADMIN ROUTES ====================

// GET /api/admin/experience - List all experience (admin)
router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  ExperienceController.getAdminExperience.bind(ExperienceController)
);

// POST /api/admin/experience - Create new experience
router.post(
  '/admin',
  requireAuth,
  requireAdmin,
  validate(createExperienceSchema),
  ExperienceController.createExperience.bind(ExperienceController)
);

// PUT /api/admin/experience/:id - Update experience (admin)
router.put(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  validate(updateExperienceSchema),
  ExperienceController.updateExperience.bind(ExperienceController)
);

// DELETE /api/admin/experience/:id - Delete experience (admin)
router.delete(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  ExperienceController.deleteExperience.bind(ExperienceController)
);

export default router;
