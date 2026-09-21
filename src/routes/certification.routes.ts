import { Router } from 'express';
import { CertificationController } from '../controllers/certification.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { upload } from '../services/storage.service';
import { validate, createCertificationSchema, updateCertificationSchema } from '../validators';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// GET /api/certifications - Get all visible certifications
router.get('/', CertificationController.getCertifications.bind(CertificationController));

// ==================== ADMIN ROUTES ====================

// GET /api/admin/certifications - List all certifications (admin)
router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  CertificationController.getAdminCertifications.bind(CertificationController)
);

// POST /api/admin/certifications - Create new certification
router.post(
  '/admin',
  requireAuth,
  requireAdmin,
  upload.single('imageUrl'),
  validate(createCertificationSchema),
  CertificationController.createCertification.bind(CertificationController)
);

// PUT /api/admin/certifications/:id - Update certification (admin)
router.put(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  upload.single('imageUrl'),
  validate(updateCertificationSchema),
  CertificationController.updateCertification.bind(CertificationController)
);

// DELETE /api/admin/certifications/:id - Delete certification (admin)
router.delete(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  CertificationController.deleteCertification.bind(CertificationController)
);

export default router;
