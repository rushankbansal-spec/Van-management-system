import { Request, Response, NextFunction } from 'express';
import { Certification } from '../models/Certification';
import { ApiError } from '../middleware/error.middleware';

export class CertificationController {
  static async getCertifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certifications = await Certification.find({ visible: true })
        .sort({ order: 1 })
        .lean();

      res.json({
        success: true,
        data: certifications,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminCertifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certifications = await Certification.find().sort({ order: 1 }).lean();
      res.json({
        success: true,
        data: certifications,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCertification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: any = { ...req.body };
      
      if (req.file && req.file.path) {
        data.imageUrl = req.file.path;
      }

      const certification = await Certification.create(data);
      res.status(201).json({
        success: true,
        data: certification,
        message: 'Certification created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCertification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: any = { ...req.body };
      
      if (req.file && req.file.path) {
        data.imageUrl = req.file.path;
      }

      const certification = await Certification.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
      if (!certification) {
        throw ApiError.notFound('Certification not found');
      }
      res.json({
        success: true,
        data: certification,
        message: 'Certification updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCertification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const certification = await Certification.findByIdAndDelete(id);
      if (!certification) {
        throw ApiError.notFound('Certification not found');
      }
      res.json({
        success: true,
        message: 'Certification deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
