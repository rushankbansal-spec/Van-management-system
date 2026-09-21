import { Request, Response, NextFunction } from 'express';
import { Profile } from '../models/Profile';
import { ApiError } from '../middleware/error.middleware';

export class ProfileController {
  static async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await Profile.findOne().sort({ updatedAt: -1 }).lean();
      if (!profile) {
        throw ApiError.notFound('Profile not found');
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await Profile.findOne().sort({ updatedAt: -1 });
      if (!profile) {
        throw ApiError.notFound('Profile not found');
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updateData: any = { ...req.body };

      // Handle profile image from upload
      if (req.file && req.file.path) {
        updateData.profileImage = req.file.path;
      }

      const profile = await Profile.findOneAndUpdate(
        {},
        { $set: updateData },
        { new: true, upsert: true, runValidators: true }
      );

      res.json({
        success: true,
        data: profile,
        message: profile?._id ? 'Profile updated successfully' : 'Profile created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
