import { saveAs } from 'file-saver';
import { API_URL } from '@/config/env';

function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__supabase_access_token ?? null;
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return response.statusText || 'Request failed';

  try {
    const parsed = JSON.parse(text) as any;
    if (typeof parsed?.message === 'string') return parsed.message;
    if (Array.isArray(parsed?.message)) return parsed.message.join(', ');
  } catch {
    // ignore
  }

  return text;
}

export async function downloadBarcodesCsv(params?: {
  productIds?: string[];
  filename?: string;
}): Promise<void> {
  const token = getSessionToken();
  const ids = params?.productIds?.filter(Boolean) ?? [];
  const url = new URL(`${API_URL}/barcodes/export.csv`);
  if (ids.length) url.searchParams.set('productIds', ids.join(','));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || 'Failed to export CSV');
  }

  const csv = await response.text();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, params?.filename?.trim() || 'barcodes-export.csv');
}
