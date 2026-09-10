import { useState, useEffect, useCallback } from 'react';

const isBrowser = typeof window !== 'undefined';

function safeParse<T>(value: string | null, fallback: T): T {
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function safeStringify<T>(value: T): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

type SetValueArg<T> = T | ((prev: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: SetValueArg<T>) => void, () => void] {
  const getInitialValue = (): T => {
    if (typeof initialValue === 'function') {
      return (initialValue as () => T)();
    }
    return initialValue;
  };

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isBrowser) {
      return getInitialValue();
    }
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? safeParse<T>(raw, getInitialValue()) : getInitialValue();
    } catch {
      return getInitialValue();
    }
  });

  useEffect(() => {
    if (!isBrowser) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return;
      try {
        const parsed = safeParse<T>(e.newValue, storedValue);
        setStoredValue(parsed);
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, storedValue]);

  const setValue = useCallback(
    (value: SetValueArg<T>) => {
      try {
        setStoredValue((prev) => {
          const valueToStore =
            typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;

          if (isBrowser) {
            const serialized = safeStringify(valueToStore);
            if (serialized !== null) {
              window.localStorage.setItem(key, serialized);
            }
          }

          return valueToStore;
        });
      } catch (error) {
        console.warn(`useLocalStorage setValue error for key "${key}":`, error);
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      if (isBrowser) {
        window.localStorage.removeItem(key);
      }
      setStoredValue(getInitialValue());
    } catch (error) {
      console.warn(`useLocalStorage removeValue error for key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
