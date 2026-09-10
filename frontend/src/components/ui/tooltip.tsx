import * as React from 'react';
import { cn } from '../../lib/utils';

type TooltipContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
};

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within <TooltipProvider> and <Tooltip>');
  }
  return context;
}

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({
  children,
  delayDuration = 300,
  skipDelayDuration = 0,
}) => {
  return (
    <TooltipDelayContext.Provider value={{ delayDuration, skipDelayDuration }}>
      {children}
    </TooltipDelayContext.Provider>
  );
};

type TooltipDelayContextValue = {
  delayDuration: number;
  skipDelayDuration: number;
};

const TooltipDelayContext = React.createContext<TooltipDelayContextValue>({
  delayDuration: 300,
  skipDelayDuration: 0,
});

interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  delayDuration: delayDurationProp,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen! : uncontrolledOpen;
  const timerRef = React.useRef<number | null>(null);

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const { delayDuration: defaultDelay } = React.useContext(TooltipDelayContext);
  const delayDuration = delayDurationProp ?? defaultDelay;

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  const delayedSetOpen = React.useCallback(
    (newOpen: boolean) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (newOpen) {
        timerRef.current = window.setTimeout(() => {
          setOpen(true);
        }, delayDuration);
      } else {
        setOpen(false);
      }
    },
    [setOpen, delayDuration]
  );

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <TooltipContext.Provider
      value={{
        open,
        setOpen: delayedSetOpen,
        triggerRef,
        contentRef,
      }}
    >
      {children}
    </TooltipContext.Provider>
  );
};
Tooltip.displayName = 'Tooltip';

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const TooltipTrigger = React.forwardRef<HTMLElement, TooltipTriggerProps>(
  ({ className, children, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, _ref) => {
    const { setOpen, triggerRef } = useTooltipContext();

    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
      onMouseEnter?.(e);
      setOpen(true);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
      onMouseLeave?.(e);
      setOpen(false);
    };

    const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
      onFocus?.(e);
      setOpen(true);
    };

    const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
      onBlur?.(e);
      setOpen(false);
    };

    const setRef = (node: HTMLElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
    };

    if (React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref: setRef,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
      });
    }

    return (
      <span
        ref={setRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn('inline-flex', className)}
        tabIndex={0}
        {...props}
      >
        {children}
      </span>
    );
  }
);
TooltipTrigger.displayName = 'TooltipTrigger';

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      className,
      children,
      side = 'top',
      sideOffset = 4,
      align = 'center',
      style,
      ...props
    },
    _ref
  ) => {
    const { open, triggerRef, contentRef } = useTooltipContext();
    const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);

    React.useEffect(() => {
      if (!open || !triggerRef.current || !contentRef.current) {
        setPosition(null);
        return;
      }

      const trigger = triggerRef.current;
      const content = contentRef.current;

      const triggerRect = trigger.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (side) {
        case 'top':
          top = triggerRect.top - contentRect.height - sideOffset;
          break;
        case 'bottom':
          top = triggerRect.bottom + sideOffset;
          break;
        case 'left':
          left = triggerRect.left - contentRect.width - sideOffset;
          break;
        case 'right':
          left = triggerRect.right + sideOffset;
          break;
      }

      switch (side) {
        case 'top':
        case 'bottom':
          switch (align) {
            case 'start':
              left = triggerRect.left;
              break;
            case 'center':
              left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
              break;
            case 'end':
              left = triggerRect.right - contentRect.width;
              break;
          }
          break;
        case 'left':
        case 'right':
          switch (align) {
            case 'start':
              top = triggerRect.top;
              break;
            case 'center':
              top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
              break;
            case 'end':
              top = triggerRect.bottom - contentRect.height;
              break;
          }
          break;
      }

      setPosition({
        top: Math.max(8, top + window.scrollY),
        left: Math.max(8, Math.min(left + window.scrollX, window.scrollX + document.documentElement.clientWidth - contentRect.width - 8)),
      });
    }, [open, side, sideOffset, align]);

    if (!open) return null;

    return (
      <div
        ref={contentRef}
        style={{
          position: 'absolute',
          top: position?.top ?? 0,
          left: position?.left ?? 0,
          ...style,
        }}
        className={cn(
          'z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-gray-50 shadow-md animate-in fade-in-0 zoom-in-95 duration-100',
          className
        )}
        role="tooltip"
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = 'TooltipContent';

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
};
