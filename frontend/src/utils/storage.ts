const KEY_PREFIX = 'ican:';

export const AUTH_KEYS = {
  ACCESS: 'ican:access_token',
  REFRESH: 'ican:refresh_token',
  USER: 'ican:user',
} as const;

function prefixedKey(key: string): string {
  if (key.startsWith(KEY_PREFIX)) return key;
  return `${KEY_PREFIX}${key}`;
}

function safeParse<T>(value: string | null): T | null {
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function safeStringify<T>(value: T): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function getTokens(): { access: string | null; refresh: string | null } {
  return {
    access: get<string>(AUTH_KEYS.ACCESS.replace(KEY_PREFIX, '')),
    refresh: get<string>(AUTH_KEYS.REFRESH.replace(KEY_PREFIX, '')),
  };
}

export function setTokens(access: string, refresh: string): void {
  set(AUTH_KEYS.ACCESS.replace(KEY_PREFIX, ''), access);
  set(AUTH_KEYS.REFRESH.replace(KEY_PREFIX, ''), refresh);
}

export function clearTokens(): void {
  remove(AUTH_KEYS.ACCESS.replace(KEY_PREFIX, ''));
  remove(AUTH_KEYS.REFRESH.replace(KEY_PREFIX, ''));
}

export function getUser<T = any>(): T | null {
  return get<T>(AUTH_KEYS.USER.replace(KEY_PREFIX, ''));
}

export function setUser<T>(user: T): void {
  set(AUTH_KEYS.USER.replace(KEY_PREFIX, ''), user);
}

export function clearUser(): void {
  remove(AUTH_KEYS.USER.replace(KEY_PREFIX, ''));
}

export function get<T>(key: string, fallback?: T): T | null {
  try {
    const raw = localStorage.getItem(prefixedKey(key));
    if (raw === null) {
      return fallback !== undefined ? fallback : null;
    }
    const parsed = safeParse<T>(raw);
    return parsed !== null ? parsed : (fallback !== undefined ? fallback : null);
  } catch {
    return fallback !== undefined ? fallback : null;
  }
}

export function set<T>(key: string, value: T): void {
  try {
    const serialized = safeStringify(value);
    if (serialized !== null) {
      localStorage.setItem(prefixedKey(key), serialized);
    }
  } catch {
    // localStorage may be disabled
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(prefixedKey(key));
  } catch {
    // localStorage may be disabled
  }
}

export function clearAll(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage may be disabled
  }
}
