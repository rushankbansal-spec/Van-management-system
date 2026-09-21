import { Request, Response, NextFunction } from 'express';
import { Resume } from '../models/Resume';
import { ApiError } from '../middleware/error.middleware';
import { storageService } from '../services/storage.service';
import fs from 'fs';
import path from 'path';
import config from '../config/environment';

export class ResumeController {
  static async getResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resume = await Resume.findOne({ active: true }).lean();
      if (!resume) {
        throw ApiError.notFound('No active resume found');
      }

      res.json({
        success: true,
        data: resume,
      });
    } catch (error) {
      next(error);
    }
  }

  static async downloadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resume = await Resume.findOne({ _id: req.params.id });
      if (!resume) {
        throw ApiError.notFound('Resume not found');
      }

      // Construct the file path
      let filePath: string;
      if (config.upload.provider === 'local') {
        filePath = path.join(config.upload.local.uploadsDir, resume.fileUrl);
      } else {
        // For cloud storage, redirect to the URL
        res.redirect(resume.fileUrl);
        return;
      }

      if (!fs.existsSync(filePath)) {
        throw ApiError.notFound('Resume file not found on disk');
      }

      res.download(filePath, resume.fileName);
    } catch (error) {
      next(error);
    }
  }

  // Admin
  static async getAdminResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resumes = await Resume.find().sort({ uploadedAt: -1 }).lean();
      res.json({
        success: true,
        data: resumes,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, version, active } = req.body;
      
      // Handle file upload
      if (!req.file) {
        throw ApiError.badRequest('No file uploaded');
      }

      const fileUrl = req.file.path;
      const fileName = req.file.originalname;

      // If this is set as active, deactivate all others
      if (active) {
        await Resume.updateMany({ active: true }, { active: false });
      }

      const resume = await Resume.create({
        title: title || fileName.replace(/\.[^.]+$/, ''),
        fileUrl,
        fileName,
        version: version || '1.0',
        active: active || false,
        uploadedAt: new Date(),
      });

      res.status(201).json({
        success: true,
        data: resume,
        message: 'Resume uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { title, version, active } = req.body;

      const resume = await Resume.findById(id);
      if (!resume) {
        throw ApiError.notFound('Resume not found');
      }

      const updateData: any = {};
      if (title) updateData.title = title;
      if (version) updateData.version = version;

      // Handle new file upload (replaces old file)
      if (req.file) {
        // Delete old file if local
        if (config.upload.provider === 'local' && resume.fileUrl) {
          const oldPath = path.join(config.upload.local.uploadsDir, resume.fileUrl);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        updateData.fileUrl = req.file.path;
        updateData.fileName = req.file.originalname;
      }

      // Handle active status
      if (active !== undefined) {
        if (active) {
          await Resume.updateMany({ _id: { $ne: id } }, { active: false });
        }
        updateData.active = active;
      }

      const updated = await Resume.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
      if (!updated) {
        throw ApiError.notFound('Resume not found');
      }

      res.json({
        success: true,
        data: updated,
        message: 'Resume updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const resume = await Resume.findById(id);
      if (!resume) {
        throw ApiError.notFound('Resume not found');
      }

      // Delete file if local
      if (config.upload.provider === 'local' && resume.fileUrl) {
        const filePath = path.join(config.upload.local.uploadsDir, resume.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await Resume.findByIdAndDelete(id);
      res.json({
        success: true,
        message: 'Resume deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
