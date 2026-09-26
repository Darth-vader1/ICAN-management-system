/**
 * Shared export utility — centralises blob download logic.
 *
 * Usage:
 *   await exportData(() => reportService.exportPaymentReport('pdf'), 'payments_2026-09-26.pdf');
 */

import showToast from '../utils/toast';
import { reportService } from '../services/reportService';

/**
 * Execute a fetcher that returns a Blob and trigger a browser download.
 * Shows loading / success / error toasts automatically.
 */
export async function exportData(
  fetcher: () => Promise<Blob>,
  filename: string,
): Promise<void> {
  const toastId = showToast.loading(`Generating ${filename.split('.').pop()?.toUpperCase()} export…`);
  try {
    const blob = await fetcher();
    reportService.downloadBlob(blob, filename);
    showToast.dismiss(toastId);
    showToast.success(`Downloaded: ${filename}`);
  } catch (err: any) {
    showToast.dismiss(toastId);
    console.error('Export failed:', err);
    let msg = 'Export failed. Please try again.';
    if (err?.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const parsed = JSON.parse(text);
        msg = parsed?.detail || parsed?.error || msg;
      } catch {
        // ignore parse errors
      }
    } else if (err?.response?.data?.detail) {
      msg = err.response.data.detail;
    }
    showToast.error(msg);
    throw err; // re-throw so callers can react if needed
  }
}

/**
 * Build a date-stamped filename.
 * @example datestampedFilename('payments_report', 'pdf') → 'payments_report_2026-09-26.pdf'
 */
export function datestampedFilename(base: string, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${base}_${date}.${ext}`;
}
