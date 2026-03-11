'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Barcode, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProductByBarcode, useProductByBarcodeDetails } from '@/hooks/apollo';
import { parseScanPayload, type ParsedScanPayload } from '@/lib/barcode/scan-payload';

type ProductByBarcodeResult = {
  productByBarcode: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    is_active: boolean;
  };
};

type ProductByBarcodeDetailsResult = {
  productByBarcodeDetails: {
    barcode_value: string;
    unit_type: string;
    quantity_multiplier: number;
    product: ProductByBarcodeResult['productByBarcode'];
  };
};

type ScanMeta = Omit<ParsedScanPayload, 'barcode' | 'raw'> & {
  unit_type?: string;
  quantity_multiplier?: number;
  barcode_value?: string;
};

export function BarcodeScanInput(props: {
  label?: string;
  description?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  mode?: 'basic' | 'details';
  onProductResolved: (
    product: ProductByBarcodeResult['productByBarcode'],
    scannedBarcode: string,
    scanMeta?: ScanMeta,
  ) => void;
  onError?: (message: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [barcode, setBarcode] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const pendingScanRef = useRef<ParsedScanPayload | null>(null);
  // Tracks the last barcode value that was submitted for lookup.
  // Prevents the idle-timer effect from re-firing for the same value
  // when a re-render (e.g. loading state change) recreates the lookup functions.
  const lastTriggeredBarcodeRef = useRef<string | null>(null);

  const mode = props.mode ?? 'basic';

  const buildBaseScanMeta = (pending: ParsedScanPayload | null): ScanMeta | undefined => {
    if (!pending) return undefined;
    return {
      ...(pending.expiryDate ? { expiryDate: pending.expiryDate } : {}),
      ...(pending.batchNo ? { batchNo: pending.batchNo } : {}),
      ...(typeof pending.quantity === 'number' ? { quantity: pending.quantity } : {}),
    };
  };

  const [lookupBasicFn, { loading: loadingBasic }] = useProductByBarcode();
  const [lookupDetailsFn, { loading: loadingDetails }] = useProductByBarcodeDetails();

  const lookupBasic = (options: { variables: { barcode: string } }) =>
    lookupBasicFn({ ...options, fetchPolicy: 'no-cache', errorPolicy: 'all' })
      .then(({ data, error }) => {
        if (error) {
          pendingScanRef.current = null;
          setBarcode('');
          lastTriggeredBarcodeRef.current = null;
          props.onError?.(error.message || 'Barcode lookup failed');
          return;
        }
        const pending = pendingScanRef.current;
        const scanned = (pending?.barcode ?? barcode ?? '').trim();
        if (!data?.productByBarcode) {
          setBarcode('');
          lastTriggeredBarcodeRef.current = null;
          props.onError?.('No product found for barcode');
          return;
        }
        props.onProductResolved(data.productByBarcode, scanned, buildBaseScanMeta(pending));
        setLastScanned(scanned);
        setBarcode('');
        lastTriggeredBarcodeRef.current = null;
        pendingScanRef.current = null;
        queueMicrotask(() => inputRef.current?.focus());
      })
      .catch((err: any) => {
        pendingScanRef.current = null;
        setBarcode('');
        lastTriggeredBarcodeRef.current = null;
        props.onError?.(err.message || 'Barcode lookup failed');
      });

  const lookupDetails = (options: { variables: { barcode: string } }) =>
    lookupDetailsFn({ ...options, fetchPolicy: 'no-cache', errorPolicy: 'all' })
      .then(({ data, error }) => {
        if (error) {
          pendingScanRef.current = null;
          setBarcode('');
          lastTriggeredBarcodeRef.current = null;
          props.onError?.(error.message || 'Barcode lookup failed');
          return;
        }
        const pending = pendingScanRef.current;
        const scanned = (pending?.barcode ?? barcode ?? '').trim();
        if (!data?.productByBarcodeDetails?.product) {
          setBarcode('');
          lastTriggeredBarcodeRef.current = null;
          props.onError?.('No product found for barcode');
          return;
        }
        const details = data.productByBarcodeDetails;
        props.onProductResolved(details.product, scanned, {
          ...buildBaseScanMeta(pending),
          unit_type: details.unit_type,
          quantity_multiplier: details.quantity_multiplier,
          barcode_value: details.barcode_value,
        });
        setLastScanned(scanned);
        setBarcode('');
        lastTriggeredBarcodeRef.current = null;
        pendingScanRef.current = null;
        queueMicrotask(() => inputRef.current?.focus());
      })
      .catch((err: any) => {
        pendingScanRef.current = null;
        setBarcode('');
        lastTriggeredBarcodeRef.current = null;
        props.onError?.(err.message || 'Barcode lookup failed');
      });

  const loading = mode === 'details' ? loadingDetails : loadingBasic;

  const disabled = props.disabled || loading;

  // Idle-trigger for scanners that don't send Enter.
  useEffect(() => {
    const trimmed = barcode.trim();
    if (!trimmed) {
      lastTriggeredBarcodeRef.current = null;
      return;
    }

    const handle = window.setTimeout(() => {
      // Only auto-fire if it looks like a scan (avoid firing for a single stray key).
      if (trimmed.length >= 4) {
        // Guard: don't re-fire for the same barcode value (prevents spam on re-renders).
        if (lastTriggeredBarcodeRef.current === trimmed) return;
        lastTriggeredBarcodeRef.current = trimmed;
        const parsed = parseScanPayload(trimmed);
        pendingScanRef.current = parsed;
        if (mode === 'details') {
          lookupDetails({ variables: { barcode: parsed.barcode } });
        } else {
          lookupBasic({ variables: { barcode: parsed.barcode } });
        }
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [barcode, lookupBasic, lookupDetails, mode]);

  const canClear = useMemo(() => barcode.length > 0, [barcode]);

  const submit = async () => {
    const trimmed = barcode.trim();
    if (!trimmed) return;

    const parsed = parseScanPayload(trimmed);
    pendingScanRef.current = parsed;
    if (mode === 'details') {
      await lookupDetails({ variables: { barcode: parsed.barcode } });
    } else {
      await lookupBasic({ variables: { barcode: parsed.barcode } });
    }
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
