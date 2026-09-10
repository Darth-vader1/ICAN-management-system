import { useState, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export function useDisclosure(initialOpen = false): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
} {
  const [isOpen, setOpen] = useState<boolean>(initialOpen);

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setOpen,
    onOpen: open,
    onClose: close,
    onToggle: toggle,
  };
}
