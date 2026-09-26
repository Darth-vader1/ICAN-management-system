import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export interface ExportDropdownProps {
  /** Handler called when the user selects PDF export. */
  onExportPdf: () => void | Promise<void>;
  /** Handler called when the user selects Excel export. */
  onExportExcel: () => void | Promise<void>;
  /** Disable the entire dropdown (e.g. when there is no data). */
  disabled?: boolean;
  /** Button label — defaults to "Export". */
  label?: string;
  /** Visual size preset: `sm` for card headers, `md` for page headers. */
  size?: 'sm' | 'md';
}

type ExportingState = null | 'pdf' | 'excel';

/**
 * Unified export dropdown that replaces standalone "Export PDF" buttons.
 *
 * Uses Radix UI `DropdownMenu` for keyboard accessibility,
 * click-outside-to-close, and focus management.
 */
export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportPdf,
  onExportExcel,
  disabled = false,
  label = 'Export',
  size = 'md',
}) => {
  const [exporting, setExporting] = useState<ExportingState>(null);

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (exporting) return; // prevent double-click
    setExporting(format);
    try {
      if (format === 'pdf') {
        await onExportPdf();
      } else {
        await onExportExcel();
      }
    } catch {
      // Error handling is expected in the onExport* handlers (via exportData util)
    } finally {
      setExporting(null);
    }
  };

  const isDisabled = disabled || exporting !== null;

  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs gap-1'
      : 'px-4 py-2.5 text-sm gap-1.5';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isDisabled}
          className={`inline-flex items-center font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          disabled={exporting !== null}
          onSelect={() => handleExport('pdf')}
          className="flex items-center gap-2.5 text-sm"
        >
          {exporting === 'pdf' ? (
            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
          ) : (
            <FileText className="h-4 w-4 text-red-500" />
          )}
          <span>Export as PDF</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={exporting !== null}
          onSelect={() => handleExport('excel')}
          className="flex items-center gap-2.5 text-sm"
        >
          {exporting === 'excel' ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          )}
          <span>Export as Excel</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportDropdown;
