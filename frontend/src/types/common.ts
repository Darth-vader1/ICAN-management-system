export type SortDirection = 'asc' | 'desc';

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'icontains'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

export interface PaginationParams {
  page?: number;
  page_size?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
  search?: string;
}

export interface DateTimeRange {
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
}

export interface PaginatedResult<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ListResponse<T> extends PaginatedResult<T> {}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

export interface ActionResponse<T = unknown> extends SuccessResponse {
  data?: T;
}

export interface IdNamePair {
  id: string;
  name: string;
}

export interface IdLabelPair {
  id: string;
  label: string;
}
