import { Router } from 'express';
import { SocialController } from '../controllers/social.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { validate, createSocialLinkSchema, updateSocialLinkSchema } from '../validators';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// GET /api/socials - Get all visible social links
router.get('/', SocialController.getSocials.bind(SocialController));

// ==================== ADMIN ROUTES ====================

// GET /api/admin/socials - List all social links (admin)
router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  SocialController.getAdminSocials.bind(SocialController)
);

// POST /api/admin/socials - Create new social link
router.post(
  '/admin',
  requireAuth,
  requireAdmin,
  validate(createSocialLinkSchema),
  SocialController.createSocial.bind(SocialController)
);

// PUT /api/admin/socials/:id - Update social link (admin)
router.put(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  validate(updateSocialLinkSchema),
  SocialController.updateSocial.bind(SocialController)
);

// DELETE /api/admin/socials/:id - Delete social link (admin)
router.delete(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  SocialController.deleteSocial.bind(SocialController)
);

export default router;
