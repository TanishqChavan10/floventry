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

export type ThermalLabelSize = '2x1' | '50x25mm' | '4x6';

async function fetchThermalLabelsZplText(params: {
  productIds: string[];
  copies?: number;
  labelSize?: ThermalLabelSize;
}): Promise<string> {
  const token = getSessionToken();

  const response = await fetch(`${API_URL}/thermal/labels/zpl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/plain',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      productIds: params.productIds,
      copies: params.copies ?? 1,
      labelSize: params.labelSize ?? '2x1',
    }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || 'Failed to generate ZPL');
  }

  return response.text();
}

export async function getThermalLabelsZplText(params: {
  productIds: string[];
  copies?: number;
  labelSize?: ThermalLabelSize;
}): Promise<string> {
  return fetchThermalLabelsZplText(params);
}

function fallbackCopyToClipboard(text: string): void {
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'fixed';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

export async function copyThermalLabelsZplToClipboard(params: {
  productIds: string[];
  copies?: number;
  labelSize?: ThermalLabelSize;
}): Promise<void> {
  if (typeof window === 'undefined') return;
  const text = await fetchThermalLabelsZplText(params);

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    fallbackCopyToClipboard(text);
  }
}

export async function downloadThermalLabelsZpl(params: {
  productIds: string[];
  filename?: string;
  copies?: number;
  labelSize?: ThermalLabelSize;
}): Promise<void> {
  const text = await fetchThermalLabelsZplText(params);

  const ensureZplExtension = (name: string): string => {
    const trimmed = (name || '').trim() || 'thermal-labels.zpl';
    // Strip any path segments for safety.
    const base = trimmed.split(/[/\\]/g).pop() || 'thermal-labels.zpl';
    if (/\.zpl$/i.test(base)) return base;
    if (/\.[a-z0-9]+$/i.test(base)) return base.replace(/\.[a-z0-9]+$/i, '.zpl');
    return `${base}.zpl`;
  };

  // Use a generic download MIME type to avoid OS/browser misclassification.
  const blob = new Blob([text], { type: 'application/octet-stream' });
  const safeFilename = ensureZplExtension(params.filename || 'thermal-labels.zpl');
  saveAs(blob, safeFilename);
}
