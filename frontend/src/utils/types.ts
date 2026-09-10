export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type Nullable<T> = T | null;

export type WithId<T, IdType = string> = T & { id: IdType };

export type SortDirection = 'asc' | 'desc';

export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

export type SortParams<T = string> = {
  sortBy?: T;
  sortDir?: SortDirection;
};

export type PaginatedResult<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ListResponse<T> = PaginatedResult<T> | T[];

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'icontains'
  | 'in';

export type DateTimeRange = {
  start_date?: string;
  end_date?: string;
};

export type EnumValues<T extends object> = T[keyof T];

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
