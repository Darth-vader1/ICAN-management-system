import { useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';

export type ConfirmVariant = 'default' | 'danger' | 'warning' | 'info';

export interface LocalConfirmOptions {
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

export interface LocalConfirmState extends LocalConfirmOptions {
  isOpen: boolean;
}

export interface LocalConfirmApi {
  confirm: (options: LocalConfirmOptions) => Promise<boolean>;
  confirmState: LocalConfirmState;
  handleConfirm: () => void;
  handleCancel: () => void;
  isOpen: boolean;
}

const DEFAULTS = {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger' as ConfirmVariant,
};

export const useLocalConfirm = (): LocalConfirmApi => {
  const [confirmState, setConfirmState] = useState<LocalConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    ...DEFAULTS,
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: LocalConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfirmState({
        isOpen: true,
        confirmText: DEFAULTS.confirmText,
        cancelText: DEFAULTS.cancelText,
        variant: DEFAULTS.variant,
        ...options,
      });
    });
  }, []);

  const finalize = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => finalize(true), [finalize]);
  const handleCancel = useCallback(() => finalize(false), [finalize]);

  return {
    confirm,
    confirmState,
    handleConfirm,
    handleCancel,
    isOpen: confirmState.isOpen,
  };
};

export { useLocalConfirm as useConfirm };
export default useLocalConfirm;
