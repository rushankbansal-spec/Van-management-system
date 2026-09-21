// Custom slugify implementation (underscore not available)
function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD') // split accented characters into base + diacritic
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // replace whitespace with dash
    .replace(/[^\w\-]+/g, '') // remove non-word chars
    .replace(/\-\-+/g, '-') // collapse multiple dashes
    .replace(/^-+/, '') // remove leading dash
    .replace(/-+$/, ''); // remove trailing dash
}

export const generateSlug = (text: string): string => {
  return slugify(text);
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const paginate = <T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): { data: T[]; pagination: { page: number; limit: number; total: number; pages: number } } => {
  const pages = Math.ceil(total / limit);
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      pages: pages || 1,
    },
  };
};
