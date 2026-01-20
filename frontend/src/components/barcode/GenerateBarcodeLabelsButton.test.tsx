import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/api/barcode-labels', () => ({
  downloadBarcodeLabelsPdf: vi.fn().mockResolvedValue(undefined),
}));

import { downloadBarcodeLabelsPdf } from '@/lib/api/barcode-labels';
import { GenerateBarcodeLabelsButton } from './GenerateBarcodeLabelsButton';

describe('GenerateBarcodeLabelsButton', () => {
  it('calls downloadBarcodeLabelsPdf when clicked', async () => {
    const user = userEvent.setup();

    render(
      <GenerateBarcodeLabelsButton productIds={['11111111-1111-1111-1111-111111111111']}>
        Download
      </GenerateBarcodeLabelsButton>,
    );

    await user.click(screen.getByRole('button', { name: 'Download' }));

    expect(downloadBarcodeLabelsPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        productIds: ['11111111-1111-1111-1111-111111111111'],
      }),
    );
  });
});
