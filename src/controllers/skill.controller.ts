import { Request, Response, NextFunction } from 'express';
import { Skill } from '../models/Skill';
import { ApiError } from '../middleware/error.middleware';

export class SkillController {
  // Public
  static async getSkills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skills = await Skill.find({ visible: true })
        .sort({ category: 1, order: 1 })
        .lean();

      res.json({
        success: true,
        data: skills,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin
  static async getAdminSkills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skills = await Skill.find().sort({ category: 1, order: 1 }).lean();
      res.json({
        success: true,
        data: skills,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const skill = await Skill.create(req.body);
      res.status(201).json({
        success: true,
        data: skill,
        message: 'Skill created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const skill = await Skill.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
      if (!skill) {
        throw ApiError.notFound('Skill not found');
      }
      res.json({
        success: true,
        data: skill,
        message: 'Skill updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSkill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const skill = await Skill.findByIdAndDelete(id);
      if (!skill) {
        throw ApiError.notFound('Skill not found');
      }
      res.json({
        success: true,
        message: 'Skill deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async reorderSkills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { skills } = req.body;
      if (!Array.isArray(skills) || skills.length === 0) {
        throw ApiError.badRequest('Skills array is required');
      }

      const promises = skills.map((s: any, idx: number) =>
        Skill.findByIdAndUpdate(s.id, { $set: { order: s.order ?? idx } })
      );
      await Promise.all(promises);

      const updated = await Skill.find().sort({ category: 1, order: 1 }).lean();
      res.json({
        success: true,
        data: updated,
        message: 'Skills reordered successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
