import { Request, Response, NextFunction } from 'express';
import { Contact } from '../models/Contact';
import { ApiError } from '../middleware/error.middleware';
import { emailService } from '../services/email.service';

export class ContactController {
  static async createContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, subject, message } = req.body;

      const contact = await Contact.create({
        name,
        email,
        subject: subject || '',
        message,
        read: false,
      });

      // Send email notification if configured
      if (emailService.isConfigured()) {
        emailService.sendContactNotification({
          name,
          email,
          subject: subject || 'No Subject',
          message,
        }).catch((err) => {
          console.error('Failed to send contact notification:', err);
        });
      }

      res.status(201).json({
        success: true,
        data: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          subject: contact.subject,
          message: contact.message,
          read: contact.read,
          createdAt: contact.createdAt,
        },
        message: 'Message sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const unreadOnly = req.query.unread === 'true';

      const query: any = {};
      if (unreadOnly) {
        query.read = false;
      }

      const total = await Contact.countDocuments(query);
      const contacts = await Contact.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      res.json({
        success: true,
        data: contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const contact = await Contact.findByIdAndUpdate(
        id,
        { $set: { read: true } },
        { new: true, runValidators: true }
      );

      if (!contact) {
        throw ApiError.notFound('Contact message not found');
      }

      res.json({
        success: true,
        data: contact,
        message: 'Message marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const contact = await Contact.findByIdAndDelete(id);
      if (!contact) {
        throw ApiError.notFound('Contact message not found');
      }

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
