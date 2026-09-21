import { Router } from 'express';
import { ResumeController } from '../controllers/resume.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { upload } from '../services/storage.service';
import { validate, createResumeSchema, updateResumeSchema } from '../validators';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// GET /api/resume - Get active resume
router.get('/', ResumeController.getResume.bind(ResumeController));

// GET /api/resume/:id/download - Download resume file
router.get('/:id/download', ResumeController.downloadResume.bind(ResumeController));

// ==================== ADMIN ROUTES ====================

// GET /api/admin/resume - List all resumes (admin)
router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  ResumeController.getAdminResume.bind(ResumeController)
);

// POST /api/admin/resume - Upload new resume
router.post(
  '/admin',
  requireAuth,
  requireAdmin,
  upload.single('resume'),
  validate(createResumeSchema),
  ResumeController.createResume.bind(ResumeController)
);

// PUT /api/admin/resume/:id - Update resume (admin)
router.put(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  upload.single('resume'),
  validate(updateResumeSchema),
  ResumeController.updateResume.bind(ResumeController)
);

// DELETE /api/admin/resume/:id - Delete resume (admin)
router.delete(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  ResumeController.deleteResume.bind(ResumeController)
);

export default router;
