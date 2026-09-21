// GitHub API Service
// Fetches public repository data from GitHub without requiring a token

import config from '../config/environment';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  topics: string[];
}

interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface CachedData {
  data: GitHubUser | GitHubRepo[];
  timestamp: number;
}

let userCache: CachedData | null = null;
let reposCache: CachedData | null = null;

const CACHE_DURATION = config.github.cacheMinutes * 60 * 1000;

export const githubService = {
  async fetchUserProfile(username: string): Promise<GitHubUser | null> {
    const cacheKey = `github_user_${username}`;
    
    if (userCache && userCache.data && (userCache.data as GitHubUser).login === username) {
      const age = Date.now() - userCache.timestamp;
      if (age < CACHE_DURATION) {
        return userCache.data as GitHubUser;
      }
    }

    try {
      const response = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Portfolio-Backend',
        },
      });

      if (!response.ok) {
        console.warn(`GitHub API error for user ${username}: ${response.status}`);
        return null;
      }

      const data: GitHubUser = (await response.json()) as GitHubUser;
      
      userCache = {
        data,
        timestamp: Date.now(),
      };

      return data;
    } catch (error) {
      console.error('GitHub user fetch error:', error);
      return null;
    }
  },

  async fetchUserRepos(username: string, options?: { limit?: number; sort?: 'updated' | 'created' | 'stars' }): Promise<GitHubRepo[]> {
    const limit = options?.limit || 12;
    const sort = options?.sort || 'updated';
    
    const cacheKey = `github_repos_${username}_${limit}_${sort}`;

    if (reposCache && (reposCache.data as GitHubRepo[]).length > 0) {
      const age = Date.now() - reposCache.timestamp;
      if (age < CACHE_DURATION) {
        return (reposCache.data as GitHubRepo[]).slice(0, limit);
      }
    }

    try {
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=${limit}&sort=${sort}&type=owner&affiliation=owner&akat=public`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Portfolio-Backend',
          },
        }
      );

      if (!response.ok) {
        console.warn(`GitHub repos API error for ${username}: ${response.status}`);
        return [];
      }

      const data: GitHubRepo[] = (await response.json()) as GitHubRepo[];
      
      reposCache = {
        data,
        timestamp: Date.now(),
      };

      return data;
    } catch (error) {
      console.error('GitHub repos fetch error:', error);
      return [];
    }
  },

  async getContributionStats(username: string): Promise<{ total: number; colors: string[] } | null> {
    // GitHub does not provide a simple public API for contribution counts
    // We would need to scrape or use a different approach
    // For now, return basic stats from the user profile
    const user = await this.fetchUserProfile(username);
    if (!user) return null;

    return {
      total: user.public_repos,
      colors: ['#6e40c9', '#2463eb', '#0a559b', '#0969d9', '#6e40c9', '#2463eb', '#0a559b', '#0969d9'],
    };
  },

  clearCache(): void {
    userCache = null;
    reposCache = null;
  },

  invalidateUserCache(): void {
    userCache = null;
  },

  invalidateReposCache(): void {
    reposCache = null;
  },
};
