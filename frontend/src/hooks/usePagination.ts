import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

export interface UsePaginationOptions {
  total: number;
  page?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onChange?: (state: PaginationState) => void;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  canNext: boolean;
  canPrev: boolean;
  pageSizeOptions: number[];
  pages: (number | '...')[];
}

function calculatePages(current: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];
  const first = 1;
  const last = totalPages;
  const currentMinus2 = Math.max(current - 2, first);
  const currentPlus2 = Math.min(current + 2, last);

  pages.push(first);

  if (currentMinus2 > first + 1) {
    pages.push('...');
  }

  for (let i = currentMinus2; i <= currentPlus2; i++) {
    if (i !== first && i !== last) {
      pages.push(i);
    }
  }

  if (currentPlus2 < last - 1) {
    pages.push('...');
  }

  pages.push(last);

  return pages;
}

export function usePagination(
  opts: UsePaginationOptions
): PaginationState & {
  setPage: (n: number) => void;
  setPageSize: (n: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  goToLast: () => void;
  reset: () => void;
} {
  const {
    total,
    page: initialPage = 1,
    pageSize: initialPageSize = 10,
    pageSizeOptions = [10, 20, 50, 100],
    onChange,
  } = opts;

  const [page, setPageState] = useState<number>(initialPage);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const to = Math.min(clampedPage * pageSize, total);
  const canPrev = clampedPage > 1;
  const canNext = clampedPage < totalPages;

  const pages = useMemo(
    () => calculatePages(clampedPage, totalPages),
    [clampedPage, totalPages]
  );

  const state: PaginationState = {
    page: clampedPage,
    pageSize,
    totalPages,
    from,
    to,
    total,
    canNext,
    canPrev,
    pageSizeOptions,
    pages,
  };

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const handler = onChangeRef.current;
    if (!handler) return;
    handler(state);
  }, [state.page, state.pageSize, state.total]);

  const setPage = useCallback(
    (n: number) => {
      setPageState(() => Math.min(Math.max(1, n), Math.max(1, Math.ceil(total / pageSize))));
    },
    [total, pageSize]
  );

  const setPageSize = useCallback((n: number) => {
    setPageSizeState(n);
    setPageState(1);
  }, []);

  const nextPage = useCallback(() => {
    setPageState((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPageState((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToFirst = useCallback(() => {
    setPageState(1);
  }, []);

  const goToLast = useCallback(() => {
    setPageState(totalPages);
  }, [totalPages]);

  const reset = useCallback(() => {
    setPageState(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    ...state,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    goToFirst,
    goToLast,
    reset,
  };
}
