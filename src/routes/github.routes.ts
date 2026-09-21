import { Router } from 'express';
import { GithubController } from '../controllers/github.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { githubConfigSchema, validate } from '../validators';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// GET /api/github - Get GitHub configuration
router.get('/', GithubController.getGithubConfig.bind(GithubController));

// GET /api/github/repos - Get GitHub repositories
router.get('/repos', GithubController.getGithubRepos.bind(GithubController));

// ==================== ADMIN ROUTES ====================

// GET /api/admin/github - Get GitHub config (admin)
router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  GithubController.getAdminGithub.bind(GithubController)
);

// PUT /api/admin/github - Update GitHub config (admin)
router.put(
  '/admin',
  requireAuth,
  requireAdmin,
  validate(githubConfigSchema),
  GithubController.updateGithubConfig.bind(GithubController)
);

export default router;
