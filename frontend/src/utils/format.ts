import { formatDistanceStrict } from 'date-fns';

export function formatCurrency(
  amount: number | string,
  currency: string = 'NGN',
  locale: string = 'en-NG'
): string {
  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) || 0 : amount ?? 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
    }).format(numericAmount);
  } catch {
    return `₦${numericAmount.toLocaleString(locale)}`;
  }
}

export function formatDate(
  dateStr: string | Date | null,
  style: 'short' | 'medium' | 'long' = 'short'
): string {
  if (!dateStr) return '-';

  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '-';

    const dateStyleMap: Record<typeof style, Intl.DateTimeFormatOptions['dateStyle']> = {
      short: 'short',
      medium: 'medium',
      long: 'long',
    };

    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: dateStyleMap[style],
    }).format(date);
  } catch {
    return '-';
  }
}

export function formatDateTime(
  dateStr: string | Date | null,
  includeSeconds: boolean = false
): string {
  if (!dateStr) return '-';

  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'short',
      timeStyle: includeSeconds ? 'medium' : 'short',
    }).format(date);
  } catch {
    return '-';
  }
}

export function formatRelativeTime(
  dateStr: string | Date | null,
  baseDate: Date = new Date()
): string {
  if (!dateStr) return '-';

  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '-';

    return formatDistanceStrict(date, baseDate, { addSuffix: true });
  } catch {
    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      const diffMs = baseDate.getTime() - date.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (days < 0) return `${Math.abs(days)}d from now`;
      return `${days}d ago`;
    } catch {
      return '-';
    }
  }
}

export function formatPercentage(
  value: number | null | string,
  decimals: number = 0
): string {
  if (value === null || value === undefined || value === '') return '0%';

  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numeric)) return '0%';

  return `${numeric.toFixed(decimals)}%`;
}

export function formatPhone(phone: string | null): string {
  return phone ?? '-';
}

export function formatStudentCode(code: string | null): string {
  return code ?? 'ICAN-000000';
}

export function truncate(str: string | null, max: number = 50): string {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.slice(0, max) + '...';
}
