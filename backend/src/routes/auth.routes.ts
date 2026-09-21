import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// POST /api/auth/login - Login
// Rate limited
router.post('/login', authLimiter, AuthController.login.bind(AuthController));

// GET /api/auth/me - Get current user
// Requires auth
router.get('/me', requireAuth, AuthController.me.bind(AuthController));

// POST /api/auth/logout - Logout
router.post('/logout', AuthController.logout.bind(AuthController));

export default router;
