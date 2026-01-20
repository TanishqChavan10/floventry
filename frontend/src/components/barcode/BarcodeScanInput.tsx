'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { Barcode, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PRODUCT_BY_BARCODE } from '@/lib/graphql/barcode';

type ProductByBarcodeResult = {
  productByBarcode: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    is_active: boolean;
  };
};

export function BarcodeScanInput(props: {
  label?: string;
  description?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  onProductResolved: (
    product: ProductByBarcodeResult['productByBarcode'],
    scannedBarcode: string,
  ) => void;
  onError?: (message: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [barcode, setBarcode] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const [lookup, { loading }] = useLazyQuery<ProductByBarcodeResult>(PRODUCT_BY_BARCODE, {
    fetchPolicy: 'no-cache',
    onCompleted: (data) => {
      const scanned = (barcode || '').trim();
      if (!data?.productByBarcode) {
        props.onError?.('No product found for barcode');
        return;
      }
      props.onProductResolved(data.productByBarcode, scanned);
      setLastScanned(scanned);
      setBarcode('');
      // Keep focus for rapid sequential scans.
      queueMicrotask(() => inputRef.current?.focus());
    },
    onError: (err) => {
      props.onError?.(err.message || 'Barcode lookup failed');
    },
  });

  const disabled = props.disabled || loading;

  // Idle-trigger for scanners that don't send Enter.
  useEffect(() => {
    const trimmed = barcode.trim();
    if (!trimmed) return;

    const handle = window.setTimeout(() => {
      // Only auto-fire if it looks like a scan (avoid firing for a single stray key).
      if (trimmed.length >= 4) {
        lookup({ variables: { barcode: trimmed } });
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [barcode, lookup]);

  const canClear = useMemo(() => barcode.length > 0, [barcode]);

  const submit = async () => {
    const trimmed = barcode.trim();
    if (!trimmed) return;
    await lookup({ variables: { barcode: trimmed } });
  };

  return (
    <div className={props.className}>
      {props.label ? <div className="text-sm font-medium mb-1">{props.label}</div> : null}
      {props.description ? (
        <div className="text-xs text-muted-foreground mb-2">{props.description}</div>
      ) : null}

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            ref={inputRef}
            type="text"
            autoFocus={props.autoFocus}
            disabled={disabled}
            value={barcode}
            placeholder="Scan barcode…"
            className="pl-9"
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void submit();
              }
            }}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => inputRef.current?.focus()}
        >
          Scan
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || !canClear}
          onClick={() => {
            setBarcode('');
            queueMicrotask(() => inputRef.current?.focus());
          }}
          title="Clear"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {lastScanned ? (
        <div className="mt-1 text-xs text-muted-foreground">Last scan: {lastScanned}</div>
      ) : null}
    </div>
  );
}
