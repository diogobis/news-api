export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}
