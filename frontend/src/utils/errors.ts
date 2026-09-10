import { type AxiosError, isAxiosError } from 'axios';

export type ErrorResponse = {
  detail?: string;
  message?: string;
  [key: string]: any;
};

function extractErrorMessages(data: unknown): string[] {
  const messages: string[] = [];

  if (!data) return messages;

  if (typeof data === 'string') {
    messages.push(data);
    return messages;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'string') {
        messages.push(item);
      } else if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, any>;
        if (typeof obj.message === 'string') messages.push(obj.message);
        else if (typeof obj.detail === 'string') messages.push(obj.detail);
        else messages.push(...extractErrorMessages(item));
      }
    }
    return messages;
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, any>;

    if (typeof obj.detail === 'string') {
      messages.push(obj.detail);
    } else if (typeof obj.message === 'string') {
      messages.push(obj.message);
    }

    if (Array.isArray(obj.non_field_errors)) {
      for (const err of obj.non_field_errors) {
        if (typeof err === 'string') messages.push(err);
      }
    }

    for (const key of Object.keys(obj)) {
      if (key === 'detail' || key === 'message' || key === 'non_field_errors') continue;
      const value = obj[key];
      if (Array.isArray(value)) {
        for (const err of value) {
          if (typeof err === 'string') {
            messages.push(`${key}: ${err}`);
          } else if (typeof err === 'object' && err !== null) {
            const errObj = err as Record<string, any>;
            if (typeof errObj.message === 'string') messages.push(`${key}: ${errObj.message}`);
          }
        }
      } else if (typeof value === 'string') {
        messages.push(`${key}: ${value}`);
      }
    }
  }

  return messages;
}

export function getErrorMessage(
  error: unknown,
  fallback: string = 'An unexpected error occurred'
): string {
  if (isAxiosError(error)) {
    const axiosErr = error as AxiosError<ErrorResponse>;

    if (axiosErr.response?.data) {
      const messages = extractErrorMessages(axiosErr.response.data);
      if (messages.length > 0) {
        return messages.join('; ');
      }
    }

    if (axiosErr.message) {
      return axiosErr.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  if (!isAxiosError(error)) return result;

  const axiosErr = error as AxiosError<ErrorResponse>;
  const data = axiosErr.response?.data;

  if (!data || typeof data !== 'object') return result;

  const detail = (data as ErrorResponse).detail;

  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const detailObj = detail as Record<string, any>;
    for (const key of Object.keys(detailObj)) {
      const value = detailObj[key];
      const fieldMessages: string[] = [];
      if (Array.isArray(value)) {
        for (const err of value) {
          if (typeof err === 'string') fieldMessages.push(err);
          else if (typeof err === 'object' && err !== null) {
            const errObj = err as Record<string, any>;
            if (typeof errObj.message === 'string') fieldMessages.push(errObj.message);
          }
        }
      } else if (typeof value === 'string') {
        fieldMessages.push(value);
      }
      if (fieldMessages.length > 0) {
        result[key] = fieldMessages;
      }
    }
  }

  for (const key of Object.keys(data)) {
    if (key === 'detail' || key === 'message' || key === 'non_field_errors') continue;
    if (result[key]) continue;

    const value = (data as Record<string, any>)[key];
    const fieldMessages: string[] = [];
    if (Array.isArray(value)) {
      for (const err of value) {
        if (typeof err === 'string') fieldMessages.push(err);
        else if (typeof err === 'object' && err !== null) {
          const errObj = err as Record<string, any>;
          if (typeof errObj.message === 'string') fieldMessages.push(errObj.message);
        }
      }
    } else if (typeof value === 'string') {
      fieldMessages.push(value);
    }
    if (fieldMessages.length > 0) {
      result[key] = fieldMessages;
    }
  }

  return result;
}

export function isAuthError(error: unknown): boolean {
  return isAxiosError(error) && (error as AxiosError).response?.status === 401;
}

export function isForbiddenError(error: unknown): boolean {
  return isAxiosError(error) && (error as AxiosError).response?.status === 403;
}

export function isNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && (error as AxiosError).response?.status === 404;
}

export function isValidationError(error: unknown): boolean {
  return isAxiosError(error) && (error as AxiosError).response?.status === 400;
}

export function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !(error as AxiosError).response;
}
