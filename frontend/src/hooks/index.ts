export {
  useAuth,
  useRequireRole,
} from './useAuth';
export type { UseAuthReturn, UseRequireRoleOptions } from './useAuth';

export {
  useDebouncedValue,
  useDebouncedCallback,
} from './useDebounce';

export { useDisclosure } from './useDisclosure';

export {
  ConfirmDialogProvider,
  confirmPortal,
  useConfirm,
} from './confirm-context';
export type {
  ConfirmOptions as GlobalConfirmOptions,
  ConfirmVariant,
} from './confirm-context';

export {
  useLocalConfirm,
} from './useConfirm';
export type {
  LocalConfirmOptions,
  LocalConfirmState,
  LocalConfirmApi,
} from './useConfirm';

export { useToast } from './useToast';

export { usePagination } from './usePagination';
export type {
  UsePaginationOptions,
  PaginationState,
} from './usePagination';

export { useLocalStorage } from './useLocalStorage';

export {
  useRoleGuard,
  useIsStaff,
  useIsStudent,
  useIsFinance,
  useIsManager,
  useIsITAdmin,
  useIsSuperAdmin,
} from './useRoleGuard';
