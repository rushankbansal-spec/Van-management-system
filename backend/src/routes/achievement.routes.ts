import { Router } from 'express';
import { AchievementController } from '../controllers/achievement.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { upload } from '../services/storage.service';
import { validate, createAchievementSchema, updateAchievementSchema } from '../validators';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// GET /api/achievements - Get all visible achievements
router.get('/', AchievementController.getAchievements.bind(AchievementController));

// ==================== ADMIN ROUTES ====================

// GET /api/admin/achievements - List all achievements (admin)
router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  AchievementController.getAdminAchievements.bind(AchievementController)
);

// POST /api/admin/achievements - Create new achievement
router.post(
  '/admin',
  requireAuth,
  requireAdmin,
  upload.single('imageUrl'),
  validate(createAchievementSchema),
  AchievementController.createAchievement.bind(AchievementController)
);

// PUT /api/admin/achievements/:id - Update achievement (admin)
router.put(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  upload.single('imageUrl'),
  validate(updateAchievementSchema),
  AchievementController.updateAchievement.bind(AchievementController)
);

// DELETE /api/admin/achievements/:id - Delete achievement (admin)
router.delete(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  AchievementController.deleteAchievement.bind(AchievementController)
);

export default router;
