export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadFromUrl(url: string, filename?: string): void {
  if (filename) {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => downloadBlob(blob, filename))
      .catch(() => {
        window.open(url, '_blank');
      });
  } else {
    window.open(url, '_blank');
  }
}

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV<T extends Record<string, any>>(
  rows: T[],
  filename: string = 'export.csv',
  headers?: Partial<Record<keyof T, string>>
): void {
  if (rows.length === 0) {
    const blob = new Blob(['\ufeff'], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
    return;
  }

  const keys = Object.keys(rows[0]) as (keyof T)[];

  const headerRow = keys.map((key) => {
    if (headers && headers[key] !== undefined) {
      return escapeCSVValue(headers[key]);
    }
    return escapeCSVValue(String(key));
  });

  const dataRows = rows.map((row) =>
    keys.map((key) => escapeCSVValue(row[key]))
  );

  const csvContent = [headerRow, ...dataRows].map((r) => r.join(',')).join('\n');
  const bom = '\ufeff';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

  downloadBlob(blob, filename);
}

export function exportJSON<T>(data: T, filename: string = 'export.json'): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, filename);
}
