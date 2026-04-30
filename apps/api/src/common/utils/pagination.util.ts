import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PaginationMeta } from '@wavestream/shared';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const normalizePagination = (params: PaginationParams) => {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(params.limit) || DEFAULT_PAGE_SIZE));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
