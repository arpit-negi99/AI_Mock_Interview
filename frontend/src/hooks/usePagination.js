import { useMemo, useState } from 'react';
import { APP_CONFIG } from '@/constants/appConfig';

export function usePagination(initialPage = 1, initialPageSize = APP_CONFIG.pageSize) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  return useMemo(() => ({
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    setPage,
    setPageSize,
    nextPage: () => setPage((value) => value + 1),
    previousPage: () => setPage((value) => Math.max(1, value - 1)),
    resetPage: () => setPage(1),
  }), [page, pageSize]);
}
