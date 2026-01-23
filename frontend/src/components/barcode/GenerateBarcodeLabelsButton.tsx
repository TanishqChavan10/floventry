'use client';

import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { GENERATE_BARCODE_LABELS } from '@/lib/graphql/barcode';

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
  const [generateLabels, { loading: isLoading }] = useMutation(GENERATE_BARCODE_LABELS);

  const onClick = async () => {
    if (disabled) return;

    try {
      const { data } = await generateLabels({
        variables: {
          input: {
            productIds,
          },
        },
      });

      if (data?.generateBarcodeLabels) {
        // Convert base64 to blob
        const base64Data = data.generateBarcodeLabels.pdfData;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const safeFilename = filename?.trim() || data.generateBarcodeLabels.filename || 'barcode-labels.pdf';
        saveAs(blob, safeFilename);
        toast.success('Barcode label PDF downloaded');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate barcode labels';
      toast.error(message);
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
