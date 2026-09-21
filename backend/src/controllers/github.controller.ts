import { Request, Response, NextFunction } from 'express';
import { Github } from '../models/Github';
import { githubService } from '../services/github.service';
import { ApiError } from '../middleware/error.middleware';

export class GithubController {
  // Public
  static async getGithubConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let config = await Github.findOne();
      if (!config) {
        config = await Github.create({
          username: '',
          profileUrl: '',
          enabled: true,
          showRepositories: true,
          showContributions: false,
        });
      }

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGithubRepos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dbConfig = await Github.findOne();
      const githubConfig = dbConfig || { username: '', enabled: false };

      const response: any = {
        config: githubConfig,
        repositories: [],
        cached: false,
        error: null,
      };

      if (!githubConfig.enabled || !githubConfig.username) {
        response.repositories = [];
        res.json({ success: true, data: response });
        return;
      }

      // Try to fetch from GitHub API
      const repos = await githubService.fetchUserRepos(githubConfig.username, {
        limit: 12,
        sort: 'updated',
      });

      if (repos.length > 0) {
        response.repositories = repos;
        response.cached = false;
      } else {
        // GitHub API failed, return empty array
        response.repositories = [];
        response.error = 'Could not fetch repositories from GitHub';
      }

      res.json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  // Admin
  static async getAdminGithub(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let config = await Github.findOne();
      if (!config) {
        config = await Github.create({
          username: '',
          profileUrl: '',
          enabled: true,
          showRepositories: true,
          showContributions: false,
        });
      }

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateGithubConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let config = await Github.findOne();
      if (!config) {
        config = await Github.create({});
      }

      const updates = req.body;

      // If username changed, invalidate cache
      if (updates.username && updates.username !== config.username) {
        githubService.invalidateUserCache();
        githubService.invalidateReposCache();
      }

      const updated = await Github.findByIdAndUpdate(
        config._id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: updated,
        message: 'GitHub configuration updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
