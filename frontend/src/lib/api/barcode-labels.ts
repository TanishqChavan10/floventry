import { saveAs } from 'file-saver';
import { API_URL } from '@/config/env';

function getClerkSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__clerk_session_token ?? null;
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

export async function downloadBarcodeLabelsPdf(params: {
  productIds: string[];
  filename?: string;
}): Promise<void> {
  const token = getClerkSessionToken();

  const response = await fetch(`${API_URL}/barcode-labels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/pdf',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ productIds: params.productIds }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || 'Failed to generate barcode labels');
  }

  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

  const safeFilename = params.filename?.trim() || 'barcode-labels.pdf';
  saveAs(blob, safeFilename);
}
