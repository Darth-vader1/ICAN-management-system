import React, { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

export type ConfirmVariant = 'default' | 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title?: string;
  message?: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmDialogState extends ConfirmOptions {
  isOpen: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

export const ConfirmDialogProvider: React.FC<ConfirmDialogProviderProps> = ({ children }) => {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: undefined,
    message: undefined,
    confirmText: undefined,
    cancelText: undefined,
    variant: undefined,
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        isOpen: true,
        title: options.title ?? 'Are you sure?',
        message: options.message,
        confirmText: options.confirmText ?? 'Confirm',
        cancelText: options.cancelText ?? 'Cancel',
        variant: options.variant ?? 'default',
      });
    });
  }, []);

  const finalize = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => finalize(true), [finalize]);
  const handleCancel = useCallback(() => finalize(false), [finalize]);

  const variantStyles: Record<NonNullable<ConfirmVariant>, { btn: string; icon: string; bg: string }> = {
    default: {
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    danger: {
      btn: 'bg-red-600 hover:bg-red-700 text-white',
      icon: 'text-red-600',
      bg: 'bg-red-100',
    },
    warning: {
      btn: 'bg-amber-600 hover:bg-amber-700 text-white',
      icon: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    info: {
      btn: 'bg-slate-700 hover:bg-slate-800 text-white',
      icon: 'text-slate-600',
      bg: 'bg-slate-100',
    },
  };

  const styles = variantStyles[state.variant ?? 'default'];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 ${styles.bg} rounded-full p-3`}>
                <svg
                  className={`h-6 w-6 ${styles.icon}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
                  {state.title}
                </h3>
                {typeof state.message === 'string' ? (
                  <p className="text-gray-600 text-sm">{state.message}</p>
                ) : (
                  <div className="text-gray-600 text-sm">{state.message}</div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {state.cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg transition-colors ${styles.btn}`}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export function useConfirm(): { confirm: (options: ConfirmOptions) => Promise<boolean> } {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return { confirm: context.confirm };
}

let portalRoot: Root | null = null;
let portalMountEl: HTMLDivElement | null = null;

export function confirmPortal(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!portalMountEl) {
      portalMountEl = document.createElement('div');
      portalMountEl.id = '__confirm-portal-root__';
      document.body.appendChild(portalMountEl);
    }

    const unmount = () => {
      if (portalRoot) {
        portalRoot.unmount();
        portalRoot = null;
      }
    };

    const cleanup = (result: boolean) => {
      unmount();
      resolve(result);
    };

    const title = options.title ?? 'Are you sure?';
    const message = options.message;
    const confirmText = options.confirmText ?? 'Confirm';
    const cancelText = options.cancelText ?? 'Cancel';
    const variant = options.variant ?? 'default';

    const variantStyles: Record<NonNullable<ConfirmVariant>, { btn: string; icon: string; bg: string }> = {
      default: {
        btn: 'bg-blue-600 hover:bg-blue-700 text-white',
        icon: 'text-blue-600',
        bg: 'bg-blue-100',
      },
      danger: {
        btn: 'bg-red-600 hover:bg-red-700 text-white',
        icon: 'text-red-600',
        bg: 'bg-red-100',
      },
      warning: {
        btn: 'bg-amber-600 hover:bg-amber-700 text-white',
        icon: 'text-amber-600',
        bg: 'bg-amber-100',
      },
      info: {
        btn: 'bg-slate-700 hover:bg-slate-800 text-white',
        icon: 'text-slate-600',
        bg: 'bg-slate-100',
      },
    };

    const styles = variantStyles[variant];

    const DialogContent = () => (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={() => cleanup(false)}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 ${styles.bg} rounded-full p-3`}>
              <svg
                className={`h-6 w-6 ${styles.icon}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              {typeof message === 'string' ? (
                <p className="text-gray-600 text-sm">{message}</p>
              ) : (
                <div className="text-gray-600 text-sm">{message}</div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => cleanup(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => cleanup(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${styles.btn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );

    if (!portalRoot) {
      portalRoot = createRoot(portalMountEl);
    }
    portalRoot.render(<DialogContent />);
  });
}
