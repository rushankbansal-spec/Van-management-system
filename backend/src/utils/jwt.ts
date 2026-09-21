import jwt from 'jsonwebtoken';
import config from '../config/environment';
import { User, IUser } from '../models/User';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest {
  user?: JwtPayload;
}

export const generateToken = (user: Pick<IUser, 'id' | 'email' | 'role'>): string => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.secret as jwt.Secret,
    { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
  );
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch {
    return null;
  }
};

export const requireAuth = (req: any, res: any, next: any): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }

  req.user = decoded;
  next();
};

export const requireAdmin = (req: any, res: any, next: any): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }
  next();
};
