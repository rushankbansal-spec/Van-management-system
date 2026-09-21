import { Router } from 'express';
import { SkillController } from '../controllers/skill.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import {
  validate,
  createSkillSchema,
  updateSkillSchema,
  skillReorderSchema,
} from '../validators';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// GET /api/skills - Get all visible skills
router.get('/', SkillController.getSkills.bind(SkillController));

// ==================== ADMIN ROUTES ====================

// GET /api/admin/skills - List all skills (admin)
router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  SkillController.getAdminSkills.bind(SkillController)
);

// POST /api/admin/skills - Create new skill
router.post(
  '/admin',
  requireAuth,
  requireAdmin,
  validate(createSkillSchema),
  SkillController.createSkill.bind(SkillController)
);

// PUT /api/admin/skills/:id - Update skill (admin)
router.put(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  validate(updateSkillSchema),
  SkillController.updateSkill.bind(SkillController)
);

// DELETE /api/admin/skills/:id - Delete skill (admin)
router.delete(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  SkillController.deleteSkill.bind(SkillController)
);

// PATCH /api/admin/skills/reorder - Reorder skills (admin)
router.patch(
  '/admin/reorder',
  requireAuth,
  requireAdmin,
  validate(skillReorderSchema),
  SkillController.reorderSkills.bind(SkillController)
);

export default router;
