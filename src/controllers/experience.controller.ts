import { Request, Response, NextFunction } from 'express';
import { Experience } from '../models/Experience';
import { ApiError } from '../middleware/error.middleware';

export class ExperienceController {
  // Public
  static async getExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const experience = await Experience.find({ visible: true })
        .sort({ order: 1 })
        .lean();

      res.json({
        success: true,
        data: experience,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin
  static async getAdminExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const experience = await Experience.find().sort({ order: 1 }).lean();
      res.json({
        success: true,
        data: experience,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const experience = await Experience.create(req.body);
      res.status(201).json({
        success: true,
        data: experience,
        message: 'Experience created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const experience = await Experience.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
      if (!experience) {
        throw ApiError.notFound('Experience not found');
      }
      res.json({
        success: true,
        data: experience,
        message: 'Experience updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const experience = await Experience.findByIdAndDelete(id);
      if (!experience) {
        throw ApiError.notFound('Experience not found');
      }
      res.json({
        success: true,
        message: 'Experience deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
