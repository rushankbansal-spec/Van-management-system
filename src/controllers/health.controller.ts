import { Request, Response } from 'express';

export class HealthController {
  static health(req: Request, res: Response): void {
    res.json({
      success: true,
      message: 'Portfolio API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}
