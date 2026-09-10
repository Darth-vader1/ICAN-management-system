import toast from 'react-hot-toast';

export function useToast() {
  return {
    success: (message: string, opts?: Parameters<typeof toast.success>[1]) =>
      toast.success(message, { duration: 4000, position: 'top-right', ...opts }),
    error: (message: string, opts?: Parameters<typeof toast.error>[1]) =>
      toast.error(message, { duration: 5000, ...opts }),
    info: (message: string, opts?: Parameters<typeof toast>[1]) =>
      toast(message, { duration: 4000, ...opts }),
    warning: (message: string, opts?: Parameters<typeof toast>[1]) =>
      toast(message, {
        duration: 4500,
        style: { background: '#fef3c7', color: '#92400e' },
        ...opts,
      }),
    promise: <T>(
      promise: Promise<T>,
      msgs: {
        loading: string;
        success: string | ((t: T) => string);
        error: string | ((e: any) => string);
      },
      opts?: Parameters<typeof toast.promise>[2]
    ) => toast.promise(promise, msgs, opts),
    dismiss: (id?: string) => toast.dismiss(id),
    raw: toast,
  };
}
