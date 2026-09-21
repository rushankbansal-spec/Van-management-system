import { Request, Response, NextFunction } from 'express';
import { Project } from '../models/Project';
import { ApiError } from '../middleware/error.middleware';
import { paginationHelper } from '../utils/helpers';

export class ProjectController {
  // Public endpoints
  static async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
      const featured = req.query.featured === 'true';
      const category = req.query.category as string || undefined;
      const sort = (req.query.sort as string) || 'order';
      const search = req.query.search as string || undefined;

      const query: any = { published: true };

      if (featured) {
        query.featured = true;
      }

      if (category) {
        query.category = new RegExp(`^${category}$`, 'i');
      }

      if (search) {
        query.$or = [
          { title: new RegExp(search, 'i') },
          { shortDescription: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
        ];
      }

      const total = await Project.countDocuments(query);
      const sortOption: any = { [sort]: 1 };
      const projects = await Project.find(query)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      res.json({
        success: true,
        data: projects,
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

  static async getProjectBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const project = await Project.findOne({ slug, published: true }).lean();
      if (!project) {
        throw ApiError.notFound('Project not found');
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoints
  static async getAdminProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
      const featured = req.query.featured === 'true' ? true : undefined;
      const published = req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined;
      const category = req.query.category as string || undefined;
      const search = req.query.search as string || undefined;

      const query: any = {};
      if (featured !== undefined) query.featured = featured;
      if (published !== undefined) query.published = published;
      if (category) query.category = new RegExp(`^${category}$`, 'i');
      if (search) {
        query.$or = [
          { title: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
        ];
      }

      const total = await Project.countDocuments(query);
      const projects = await Project.find(query)
        .sort({ order: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      res.json({
        success: true,
        data: projects,
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

  static async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: any = { ...req.body };

      // Handle file uploads
      if (req.files) {
        if (Array.isArray(req.files) && req.files.length > 0) {
          const file = req.files[0] as any;
          if (file.fieldname === 'imageUrl' || file.fieldname === 'image' || file.fieldname === 'projectImage') {
            data.imageUrl = file.path;
          }
        } else if (typeof req.files === 'object' && !Array.isArray(req.files)) {
          const files = req.files as Record<string, any[]>;
          if (files.imageUrl || files.image || files.projectImage) {
            const file = (files.imageUrl || files.image || files.projectImage)[0];
            data.imageUrl = file.path;
          }
          if (files.videoUrl || files.video) {
            const file = (files.videoUrl || files.video)[0];
            data.videoUrl = file.path;
          }
        }
      }

      // Generate slug if not provided
      if (!data.slug && data.title) {
        const baseSlug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        data.slug = baseSlug || 'project';

        // Ensure uniqueness
        const count = await Project.countDocuments({ slug: new RegExp(`^${data.slug}$`, 'i') });
        if (count > 0) {
          data.slug = `${data.slug}-${count + 1}`;
        }
      }

      // Set default order
      const lastProject = await Project.findOne({}).sort({ order: -1 }).lean();
      data.order = (lastProject?.order || 0) + 1;
      data.technologies = data.technologies || [];
      data.featured = data.featured || false;
      data.published = data.published ?? true;

      const project = await Project.create(data);

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);
      if (!project) {
        throw ApiError.notFound('Project not found');
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: any = { ...req.body };

      // Handle file uploads
      if (req.files) {
        if (Array.isArray(req.files) && req.files.length > 0) {
          const file = req.files[0] as any;
          if (file.fieldname === 'imageUrl' || file.fieldname === 'image' || file.fieldname === 'projectImage') {
            data.imageUrl = file.path;
          }
        } else if (typeof req.files === 'object' && !Array.isArray(req.files)) {
          const files = req.files as Record<string, any[]>;
          if (files.imageUrl || files.image || files.projectImage) {
            const file = (files.imageUrl || files.image || files.projectImage)[0];
            data.imageUrl = file.path;
          }
          if (files.videoUrl || files.video) {
            const file = (files.videoUrl || files.video)[0];
            data.videoUrl = file.path;
          }
        }
      }

      const project = await Project.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!project) {
        throw ApiError.notFound('Project not found');
      }

      res.json({
        success: true,
        data: project,
        message: 'Project updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const project = await Project.findByIdAndDelete(id);
      if (!project) {
        throw ApiError.notFound('Project not found');
      }

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async publishProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { published } = req.body;

      const project = await Project.findByIdAndUpdate(
        id,
        { $set: { published } },
        { new: true, runValidators: true }
      );

      if (!project) {
        throw ApiError.notFound('Project not found');
      }

      const action = published ? 'published' : 'unpublished';
      res.json({
        success: true,
        data: project,
        message: `Project ${action} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async featureProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { featured } = req.body;

      const project = await Project.findByIdAndUpdate(
        id,
        { $set: { featured } },
        { new: true, runValidators: true }
      );

      if (!project) {
        throw ApiError.notFound('Project not found');
      }

      const action = featured ? 'featured' : 'unfeatured';
      res.json({
        success: true,
        data: project,
        message: `Project ${action} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reorderProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projects } = req.body;

      if (!Array.isArray(projects) || projects.length === 0) {
        throw ApiError.badRequest('Projects array is required');
      }

      const updatePromises = projects.map((p: any, index: number) =>
        Project.findByIdAndUpdate(p.id, { $set: { order: p.order || index } })
      );

      await Promise.all(updatePromises);

      // Return updated projects
      const updatedProjects = await Project.find({ _id: { $in: projects.map((p: any) => p.id) } })
        .sort({ order: 1 })
        .lean();

      res.json({
        success: true,
        data: updatedProjects,
        message: 'Projects reordered successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
