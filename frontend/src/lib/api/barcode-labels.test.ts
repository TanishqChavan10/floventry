import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

import { saveAs } from 'file-saver';
import { downloadBarcodeLabelsPdf } from './barcode-labels';

describe('downloadBarcodeLabelsPdf', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (globalThis as any).fetch = vi.fn();
    (window as any).__clerk_session_token = 'test-token';
  });

  it('downloads a PDF when the API returns application/pdf', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    });

    await downloadBarcodeLabelsPdf({
      productIds: ['11111111-1111-1111-1111-111111111111'],
      filename: 'labels.pdf',
    });

    expect(globalThis.fetch).toHaveBeenCalled();
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'labels.pdf');
  });

  it('throws a friendly error message when the API fails', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
      text: async () => JSON.stringify({ message: 'One or more products do not have a barcode' }),
    });

    await expect(
      downloadBarcodeLabelsPdf({
        productIds: ['11111111-1111-1111-1111-111111111111'],
        filename: 'labels.pdf',
      }),
    ).rejects.toThrow('One or more products do not have a barcode');
  });
});
