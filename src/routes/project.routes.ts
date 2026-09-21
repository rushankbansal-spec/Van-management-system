import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { upload } from '../services/storage.service';
import {
  validate,
  createProjectSchema,
  updateProjectSchema,
  projectPublishSchema,
  projectFeaturedSchema,
  projectReorderSchema,
} from '../validators';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// GET /api/projects - Get all published projects
router.get('/', ProjectController.getProjects.bind(ProjectController));

// GET /api/projects/:slug - Get single project by slug
router.get('/:slug', ProjectController.getProjectBySlug.bind(ProjectController));

// ==================== ADMIN ROUTES ====================

// GET /api/admin/projects - List all projects (admin)
router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  ProjectController.getAdminProjects.bind(ProjectController)
);

// POST /api/admin/projects - Create new project
router.post(
  '/admin',
  requireAuth,
  requireAdmin,
  upload.fields([
    { name: 'imageUrl', maxCount: 1 },
    { name: 'videoUrl', maxCount: 1 },
  ]),
  validate(createProjectSchema),
  ProjectController.createProject.bind(ProjectController)
);

// GET /api/admin/projects/:id - Get project by ID (admin)
router.get(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  ProjectController.getAdminProjectById.bind(ProjectController)
);

// PUT /api/admin/projects/:id - Update project (admin)
router.put(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  upload.fields([
    { name: 'imageUrl', maxCount: 1 },
    { name: 'videoUrl', maxCount: 1 },
  ]),
  validate(updateProjectSchema),
  ProjectController.updateProject.bind(ProjectController)
);

// DELETE /api/admin/projects/:id - Delete project (admin)
router.delete(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  ProjectController.deleteProject.bind(ProjectController)
);

// PATCH /api/admin/projects/:id/publish - Publish/unpublish project (admin)
router.patch(
  '/admin/:id/publish',
  requireAuth,
  requireAdmin,
  validate(projectPublishSchema),
  ProjectController.publishProject.bind(ProjectController)
);

// PATCH /api/admin/projects/:id/featured - Feature/unfeature project (admin)
router.patch(
  '/admin/:id/featured',
  requireAuth,
  requireAdmin,
  validate(projectFeaturedSchema),
  ProjectController.featureProject.bind(ProjectController)
);

// PATCH /api/admin/projects/reorder - Reorder projects (admin)
router.patch(
  '/admin/reorder',
  requireAuth,
  requireAdmin,
  validate(projectReorderSchema),
  ProjectController.reorderProjects.bind(ProjectController)
);

export default router;
