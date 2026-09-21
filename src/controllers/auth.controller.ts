import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { ApiError } from '../middleware/error.middleware';
import { generateToken } from '../middleware/auth.middleware';
import { setAuthCookie, clearAuthCookie } from '../middleware/auth.middleware';
import config from '../config/environment';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw ApiError.unauthorized('Invalid credentials');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw ApiError.unauthorized('Invalid credentials');
      }

      const token = generateToken(user.id, user.email, user.role);

      // Set httpOnly cookie if configured
      if (config.nodeEnv === 'production' || req.query.cookie !== 'false') {
        setAuthCookie(res, token);
      }

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById((req as any).user!.userId).select('-password');
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      res.json({
        success: true,
        data: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
          role: user!.role,
          createdAt: user!.createdAt,
          updatedAt: user!.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      clearAuthCookie(res);
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
