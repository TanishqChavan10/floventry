'use client';

import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { downloadBarcodeLabelsPdf } from '@/lib/api/barcode-labels';

type Props = {
  productIds: string[];
  disabled?: boolean;
  filename?: string;
  children?: ReactNode;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
};

export function GenerateBarcodeLabelsButton({
  productIds,
  disabled,
  filename,
  children,
  size,
  variant,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    if (disabled) return;

    try {
      setIsLoading(true);
      await downloadBarcodeLabelsPdf({ productIds, filename });
      toast.success('Barcode label PDF downloaded');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate barcode labels';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      size={size}
      variant={variant}
    >
      {children ?? (isLoading ? 'Generating…' : 'Generate Barcode Label')}
    </Button>
  );
}
