import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { contactLimiter } from '../middleware/rateLimit.middleware';
import { validate, contactSchema } from '../validators';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// POST /api/contact - Submit contact form
router.post(
  '/',
  contactLimiter,
  validate(contactSchema),
  ContactController.createContact.bind(ContactController)
);

// ==================== ADMIN ROUTES ====================

// GET /api/admin/contact - List all contact messages (admin)
router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  ContactController.getAdminContacts.bind(ContactController)
);

// PATCH /api/admin/contact/:id/read - Mark message as read (admin)
router.patch(
  '/admin/:id/read',
  requireAuth,
  requireAdmin,
  ContactController.markAsRead.bind(ContactController)
);

// DELETE /api/admin/contact/:id - Delete message (admin)
router.delete(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  ContactController.deleteContact.bind(ContactController)
);

export default router;
