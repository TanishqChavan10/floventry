'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeliveryItem {
  id: string;
  itemName: string;
  sku: string;
  poQty: number;
  deliveredQty: number;
  unitPrice: number;
  batch: string;
  expiry: string;
  status: 'match' | 'shortage' | 'excess' | 'pending';
}

interface DeliveryFormProps {
  poId: string;
  poNumber: string;
  supplier: string;
  expectedItems: DeliveryItem[];
}

export default function DeliveryForm({ poId, poNumber, supplier, expectedItems }: DeliveryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<DeliveryItem[]>(expectedItems);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const updateDeliveredQty = (id: string, qty: number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          let status: DeliveryItem['status'] = 'pending';
          if (qty === item.poQty) status = 'match';
          else if (qty < item.poQty) status = 'shortage';
          else if (qty > item.poQty) status = 'excess';
          return { ...item, deliveredQty: qty, status };
        }
        return item;
      })
    );
  };

  const updateField = (id: string, field: keyof DeliveryItem, value: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const getStatusBadge = (status: DeliveryItem['status'], poQty: number, deliveredQty: number) => {
    switch (status) {
      case 'match':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            Match
          </Badge>
        );
      case 'shortage':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            <AlertCircle className="mr-1 h-3 w-3" />
            Short by {poQty - deliveredQty}
          </Badge>
        );
      case 'excess':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Excess by {deliveredQty - poQty}
          </Badge>
        );
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const calculateTotals = () => {
    const totalOrdered = items.reduce((sum, item) => sum + item.poQty, 0);
    const totalDelivered = items.reduce((sum, item) => sum + item.deliveredQty, 0);
    const shortageCount = items.filter((item) => item.status === 'shortage').length;
    const matchCount = items.filter((item) => item.status === 'match').length;
    
    return { totalOrdered, totalDelivered, shortageCount, matchCount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const { totalDelivered, shortageCount } = calculateTotals();
      toast.success(`Delivery recorded: ${totalDelivered} units received${shortageCount > 0 ? ` (${shortageCount} items short)` : ''}`);
      router.push('/purchase-orders');
    }, 1500);
  };

  const totals = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PO Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-500">PO Number</Label>
              <p className="font-mono font-semibold">{poNumber}</p>
            </div>
            <div>
              <Label className="text-slate-500">Supplier</Label>
              <p className="font-semibold">{supplier}</p>
            </div>
            <div>
              <Label className="text-slate-500">Delivery Status</Label>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{totals.matchCount}/{items.length} matched</Badge>
                {totals.shortageCount > 0 && (
                  <Badge variant="outline" className="text-yellow-600">{totals.shortageCount} short</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Items */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">PO Qty</TableHead>
                  <TableHead className="text-center">Delivered</TableHead>
                  <TableHead>Batch #</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-500">{item.sku}</TableCell>
                    <TableCell className="text-center font-semibold">{item.poQty}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.deliveredQty}
                        onChange={(e) => updateDeliveredQty(item.id, Number(e.target.value))}
                        className="w-24 text-center"
                        min="0"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.batch}
                        onChange={(e) => updateField(item.id, 'batch', e.target.value)}
                        placeholder="BATCH-001"
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={item.expiry}
                        onChange={(e) => updateField(item.id, 'expiry', e.target.value)}
                        className="w-36"
                      />
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status, item.poQty, item.deliveredQty)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="w-80 space-y-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Ordered:</span>
                <span className="font-semibold">{totals.totalOrdered} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Delivered:</span>
                <span className="font-semibold">{totals.totalDelivered} units</span>
              </div>
              <div className="flex justify-between text-lg border-t pt-2">
                <span className="font-bold">Variance:</span>
                <span className={`font-bold ${totals.totalDelivered < totals.totalOrdered ? 'text-yellow-600' : 'text-green-600'}`}>
                  {totals.totalDelivered - totals.totalOrdered > 0 ? '+' : ''}
                  {totals.totalDelivered - totals.totalOrdered}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice & Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-7891"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceUpload">Upload Invoice</Label>
              <div className="flex gap-2">
                <Input id="invoiceUpload" type="file" accept=".pdf,.jpg,.png" />
                <Button type="button" variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryNotes">Delivery Notes</Label>
            <Textarea
              id="deliveryNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about delivery condition, damages, etc..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record Delivery & Update Stock
        </Button>
      </div>
    </form>
  );
}
