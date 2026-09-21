import { Request, Response, NextFunction } from 'express';
import { Achievement } from '../models/Achievement';
import { ApiError } from '../middleware/error.middleware';

export class AchievementController {
  static async getAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const achievements = await Achievement.find({ visible: true })
        .sort({ order: 1 })
        .lean();

      res.json({
        success: true,
        data: achievements,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const achievements = await Achievement.find().sort({ order: 1 }).lean();
      res.json({
        success: true,
        data: achievements,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: any = { ...req.body };
      
      // Handle image upload
      if (req.file && req.file.path) {
        data.imageUrl = req.file.path;
      }

      const achievement = await Achievement.create(data);
      res.status(201).json({
        success: true,
        data: achievement,
        message: 'Achievement created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: any = { ...req.body };
      
      if (req.file && req.file.path) {
        data.imageUrl = req.file.path;
      }

      const achievement = await Achievement.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
      if (!achievement) {
        throw ApiError.notFound('Achievement not found');
      }
      res.json({
        success: true,
        data: achievement,
        message: 'Achievement updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const achievement = await Achievement.findByIdAndDelete(id);
      if (!achievement) {
        throw ApiError.notFound('Achievement not found');
      }
      res.json({
        success: true,
        message: 'Achievement deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
