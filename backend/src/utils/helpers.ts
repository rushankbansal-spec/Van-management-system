export const paginationHelper = {
  parsePage: (query: any): number => {
    const page = parseInt(query?.page as string) || 1;
    return Math.max(1, page);
  },
  parseLimit: (query: any, max: number = 50): number => {
    const limit = parseInt(query?.limit as string) || 10;
    return Math.min(max, Math.max(1, limit));
  },
  calculatePagination: (page: number, limit: number, total: number) => {
    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    };
  },
};
