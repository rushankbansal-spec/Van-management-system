import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { upload } from '../services/storage.service';
import { validate, profileSchema } from '../validators';

const router = Router();

// GET /api/profile - Public profile
router.get('/', ProfileController.getPublicProfile.bind(ProfileController));

// Admin routes
router.get('/admin/profile', requireAuth, requireAdmin, ProfileController.getAdminProfile.bind(ProfileController));
router.put('/admin/profile', requireAuth, requireAdmin, upload.single('profileImage'), validate(profileSchema), ProfileController.updateProfile.bind(ProfileController));

export default router;
