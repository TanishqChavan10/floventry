'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Barcode as BarcodeIcon, RotateCcw, Trash2 } from 'lucide-react';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { PRODUCT_BY_BARCODE_DETAILS } from '@/lib/graphql/barcode';
import { parseScanPayload } from '@/lib/barcode/scan-payload';

type BarcodeDetailsResult = {
  productByBarcodeDetails: {
    barcode_value: string;
    unit_type: string;
    quantity_multiplier: number;
    product: {
      id: string;
      name: string;
      sku: string;
      unit: string;
      is_active: boolean;
    };
  };
};

type CartLine = {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
  lastBarcode: string;
  unitType?: string;
  multiplier?: number;
};

function PosNewContent() {
  const params = useParams();
  const companySlug = params.slug as string;
  const { toast } = useToast();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rawScan, setRawScan] = useState('');
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);

  const pendingRef = useRef<{ barcode: string; qty?: number } | null>(null);

  const [lookup, { loading }] = useLazyQuery<BarcodeDetailsResult>(PRODUCT_BY_BARCODE_DETAILS, {
    fetchPolicy: 'no-cache',
    onCompleted: (data) => {
      const row = data?.productByBarcodeDetails;
      if (!row?.product) {
        toast({
          title: 'Not found',
          description: 'No product found for barcode',
          variant: 'destructive',
        });
        return;
      }

      const product = row.product;
      const multiplier = Number(row.quantity_multiplier ?? 1);
      const pending = pendingRef.current;
      const scannedBarcode = pending?.barcode ?? '';
      const qtyOverride = pending?.qty;
      const qtyToAdd =
        typeof qtyOverride === 'number' && Number.isFinite(qtyOverride)
          ? qtyOverride
          : Number.isFinite(multiplier) && multiplier > 0
            ? multiplier
            : 1;

      if (!product.is_active) {
        toast({
          title: 'Product archived',
          description: 'This product is archived and cannot be sold',
          variant: 'destructive',
        });
        return;
      }

      setCart((prev) => {
        const idx = prev.findIndex((p) => p.productId === product.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            quantity: Number(copy[idx].quantity) + qtyToAdd,
            lastBarcode: scannedBarcode || copy[idx].lastBarcode,
            unitType: row.unit_type,
            multiplier,
          };
          return copy;
        }

        return [
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            quantity: qtyToAdd,
            lastBarcode: scannedBarcode,
            unitType: row.unit_type,
            multiplier,
          },
          ...prev,
        ];
      });

      setLastScan(scannedBarcode || null);
      setRawScan('');
      pendingRef.current = null;
      queueMicrotask(() => inputRef.current?.focus());
    },
    onError: (err) => {
      toast({
        title: 'Scan failed',
        description: err.message || 'Barcode lookup failed',
        variant: 'destructive',
      });
    },
  });

  const submit = async () => {
    const parsed = parseScanPayload(rawScan);
    if (!parsed.barcode.trim()) return;
    pendingRef.current = { barcode: parsed.barcode.trim(), qty: parsed.quantity };
    await lookup({ variables: { barcode: parsed.barcode.trim() } });
  };

  // Idle-trigger for scanners that don't send Enter.
  useEffect(() => {
    const trimmed = rawScan.trim();
    if (!trimmed) return;

    const handle = window.setTimeout(() => {
      if (trimmed.length >= 4 && !loading) {
        void submit();
      }
    }, 250);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawScan]);

  const totalLines = cart.length;
  const totalQty = useMemo(
    () => cart.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0),
    [cart],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Link
                  href={`/${companySlug}`}
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Link>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">POS (Scan Cart)</h1>
              <p className="text-muted-foreground">
                Scan items to build a cart. Packaging barcodes apply multipliers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!cart.length}
                onClick={() => {
                  setCart([]);
                  toast({ title: 'Cart cleared' });
                  queueMicrotask(() => inputRef.current?.focus());
                }}
              >
                Clear cart
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Scan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Barcode</Label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <BarcodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    ref={inputRef}
                    value={rawScan}
                    disabled={loading}
                    onChange={(e) => setRawScan(e.target.value)}
                    placeholder="Scan barcode…"
                    className="pl-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void submit();
                      }
                    }}
                    autoFocus
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => inputRef.current?.focus()}
                >
                  Scan
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={loading || !rawScan}
                  onClick={() => {
                    setRawScan('');
                    queueMicrotask(() => inputRef.current?.focus());
                  }}
                  title="Clear"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {lastScan ? (
              <div className="text-xs text-muted-foreground">Last scan: {lastScan}</div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Lines: {totalLines} • Quantity: {totalQty}
            </div>

            {cart.length ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((line) => (
                      <TableRow key={line.productId}>
                        <TableCell>
                          <div className="font-medium">{line.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {line.sku}
                            {line.unitType ? ` • ${String(line.unitType)}` : ''}
                            {line.multiplier ? ` • ×${Number(line.multiplier)}` : ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={String(line.quantity)}
                            onChange={(e) => {
                              const next = Number(e.target.value);
                              setCart((prev) =>
                                prev.map((p) =>
                                  p.productId === line.productId
                                    ? { ...p, quantity: Number.isFinite(next) ? next : p.quantity }
                                    : p,
                                ),
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCart((prev) => prev.filter((p) => p.productId !== line.productId))
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Cart is empty. Scan a barcode to add items.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function PosNewPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <PosNewContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
