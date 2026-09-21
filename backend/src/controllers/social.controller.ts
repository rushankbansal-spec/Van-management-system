import { Request, Response, NextFunction } from 'express';
import { SocialLink } from '../models/SocialLink';
import { ApiError } from '../middleware/error.middleware';

export class SocialController {
  static async getSocials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const socials = await SocialLink.find({ visible: true })
        .sort({ order: 1 })
        .lean();

      res.json({
        success: true,
        data: socials,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminSocials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const socials = await SocialLink.find().sort({ order: 1 }).lean();
      res.json({
        success: true,
        data: socials,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createSocial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const social = await SocialLink.create(req.body);
      res.status(201).json({
        success: true,
        data: social,
        message: 'Social link created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSocial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const social = await SocialLink.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
      if (!social) {
        throw ApiError.notFound('Social link not found');
      }
      res.json({
        success: true,
        data: social,
        message: 'Social link updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSocial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const social = await SocialLink.findByIdAndDelete(id);
      if (!social) {
        throw ApiError.notFound('Social link not found');
      }
      res.json({
        success: true,
        message: 'Social link deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
