export function getPagination(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedMeta({ page, limit, total }) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) || 1 };
}
