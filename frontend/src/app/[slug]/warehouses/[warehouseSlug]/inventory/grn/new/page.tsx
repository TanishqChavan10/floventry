'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import RoleGuard from '@/components/guards/RoleGuard';
import { useWarehouse } from '@/context/warehouse-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, Send, AlertTriangle } from 'lucide-react';
import { CREATE_GRN, POST_GRN, GET_GRNS } from '@/lib/graphql/grn';
import { GET_PURCHASE_ORDERS } from '@/lib/graphql/purchase-orders';
import { toast } from 'sonner';
import Link from 'next/link';
import { SafeBarcodeScanInput } from '@/components/barcode/SafeBarcodeScanInput';

interface GRNItemInput {
  purchase_order_item_id: string;
  product_id?: string;
  received_quantity: number;
  expiry_date?: string; // ISO date string
  product_name?: string;
  ordered_quantity?: number;
  already_received?: number;
  remaining_quantity?: number;
}

function CreateGRNContent() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;
  const { activeWarehouse } = useWarehouse();

  const [selectedPO, setSelectedPO] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<GRNItemInput[]>([]);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [draftGRNId, setDraftGRNId] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [lastScan, setLastScan] = useState<{
    barcode: string;
    productId: string;
    productName: string;
    sku: string;
  } | null>(null);

  // Fetch ORDERED POs for this warehouse
  const { data: posData, loading: loadingPOs } = useQuery(GET_PURCHASE_ORDERS, {
    variables: {
      filters: {
        status: 'ORDERED',
        limit: 100,
      },
    },
    skip: !activeWarehouse?.id,
    fetchPolicy: 'cache-and-network',
  });

  const [createGRN, { loading: creating }] = useMutation(CREATE_GRN, {
    refetchQueries: [{ query: GET_GRNS, variables: { filters: { limit: 100 } } }],
  });

  const [postGRN, { loading: posting }] = useMutation(POST_GRN, {
    refetchQueries: [{ query: GET_GRNS, variables: { filters: { limit: 100 } } }],
  });

  const purchaseOrders = (posData?.purchaseOrders || []).filter(
    (po: any) => po.warehouse?.id === activeWarehouse?.id,
  );

  // When PO is selected, load its items
  useEffect(() => {
    if (selectedPO && posData?.purchaseOrders) {
      const po = posData.purchaseOrders.find((p: any) => p.id === selectedPO);
      if (po && po.items) {
        const poItems = po.items.map((item: any) => ({
          purchase_order_item_id: item.id,
          product_id: item.product?.id,
          received_quantity: 0,
          expiry_date: '', // Initially empty
          product_name: item.product.name,
          ordered_quantity: item.ordered_quantity,
          already_received: item.received_quantity || 0,
          remaining_quantity: item.ordered_quantity - (item.received_quantity || 0),
        }));
        setItems(poItems);
      }
    } else if (!selectedPO) {
      setItems([]);
    }
  }, [selectedPO, posData]);

  useEffect(() => {
    if (highlightIndex === null) return;
    const el = document.getElementById(`grn-item-${highlightIndex}`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const qtyInput = document.getElementById(
      `grn-item-qty-${highlightIndex}`,
    ) as HTMLInputElement | null;
    qtyInput?.focus();
  }, [highlightIndex]);

  const highlightProductFromBarcode = (productId: string) => {
    const index = items.findIndex((i) => i.product_id === productId);
    if (index < 0) {
      toast.error('Scanned product is not part of this purchase order');
      return;
    }
    setHighlightIndex(index);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index].received_quantity = quantity;
    setItems(updated);
  };

  const updateItemExpiryDate = (index: number, date: string) => {
    const updated = [...items];
    updated[index].expiry_date = date;
    setItems(updated);
  };

  const validateItems = () => {
    for (const item of items) {
      if (item.received_quantity <= 0) {
        toast.error('All received quantities must be greater than 0');
        return false;
      }
      if (item.received_quantity > (item.remaining_quantity || 0)) {
        toast.error(`Cannot receive more than remaining quantity for ${item.product_name}`);
        return false;
      }
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!selectedPO) {
      toast.error('Please select a purchase order');
      return;
    }

    if (items.length === 0 || !validateItems()) {
      return;
    }

    try {
      const po = purchaseOrders.find((p: any) => p.id === selectedPO);

      // Prepare the input data
      const inputData = {
        warehouse_id: po.warehouse.id,
        purchase_order_id: selectedPO,
        items: items.map((item) => ({
          purchase_order_item_id: item.purchase_order_item_id,
          received_quantity: Math.floor(Number(item.received_quantity)),
          expiry_date: item.expiry_date || undefined, // Send only if provided
        })),
        notes: notes || undefined,
      };

      // Debug logging
      console.log('[CREATE GRN] Input data:', inputData);
      console.log(
        '[CREATE GRN] Items with quantities:',
        inputData.items.map((i) => ({
          id: i.purchase_order_item_id,
          qty: i.received_quantity,
          type: typeof i.received_quantity,
        })),
      );

      const result = await createGRN({
        variables: {
          input: inputData,
        },
      });

      setDraftGRNId(result.data.createGRN.id);
      toast.success('GRN saved as draft');
      setShowPostDialog(true);
    } catch (error: any) {
      console.error('Error creating GRN:', error);
      toast.error(error.message || 'Failed to create GRN');
    }
  };

  const handlePost = async () => {
    if (!draftGRNId) return;

    try {
      await postGRN({ variables: { id: draftGRNId } });
      toast.success('GRN posted successfully! Stock has been updated.');
      router.push(`/${companySlug}/warehouses/${warehouseSlug}/inventory/grn/${draftGRNId}`);
    } catch (error: any) {
      console.error('Error posting GRN:', error);
      toast.error(error.message || 'Failed to post GRN');
    }
  };

  const handleSaveAndExit = () => {
    if (draftGRNId) {
      router.push(`/${companySlug}/warehouses/${warehouseSlug}/inventory/grn/${draftGRNId}`);
    }
  };

  const selectedPOData = purchaseOrders.find((p: any) => p.id === selectedPO);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/grn`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Create Goods Receipt Note
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Record goods received from a purchase order
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* PO Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Select Purchase Order *</Label>
                <Select
                  value={selectedPO}
                  onValueChange={setSelectedPO}
                  disabled={loadingPOs || purchaseOrders.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingPOs
                          ? 'Loading purchase orders...'
                          : purchaseOrders.length === 0
                            ? 'No ORDERED POs for this warehouse'
                            : 'Select a PO'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map((po: any) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.po_number} - {po.supplier?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!loadingPOs && purchaseOrders.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Create an ORDERED purchase order first to receive goods
                  </p>
                )}
              </div>
              {selectedPOData && (
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input value={selectedPOData.supplier?.name || ''} disabled />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Received Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <SafeBarcodeScanInput
                  context="GRN"
                  label="Scan barcode to select item"
                  description="Scan highlights the matching PO item. Quantity and expiry stay manual."
                  disabled={!selectedPO}
                  onProductResolved={(product, scannedBarcode) => {
                    setLastScan({
                      barcode: scannedBarcode,
                      productId: product.id,
                      productName: product.name,
                      sku: product.sku,
                    });
                    highlightProductFromBarcode(product.id);
                  }}
                  onError={(message) => toast.error(message)}
                />

                {lastScan ? (
                  <div className="rounded-md border bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                    <div className="font-medium">
                      Product selected via barcode. Please confirm quantities.
                    </div>
                    <div className="mt-1 text-slate-600 dark:text-slate-300">
                      Selected: {lastScan.productName} ({lastScan.sku})
                    </div>
                  </div>
                ) : null}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Already Received</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Receiving Now *</TableHead>
                    <TableHead>Expiry Date (Optional)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={item.purchase_order_item_id}
                      id={`grn-item-${index}`}
                      className={
                        highlightIndex === index ? 'bg-indigo-50 dark:bg-indigo-950/30' : undefined
                      }
                    >
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-right">{item.ordered_quantity}</TableCell>
                      <TableCell className="text-right">{item.already_received}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.remaining_quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          id={`grn-item-qty-${index}`}
                          type="number"
                          min="0"
                          max={item.remaining_quantity}
                          value={item.received_quantity || ''}
                          onChange={(e) =>
                            updateItemQuantity(index, parseFloat(e.target.value) || 0)
                          }
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={item.expiry_date || ''}
                          onChange={(e) => updateItemExpiryDate(index, e.target.value)}
                          min={new Date().toISOString().split('T')[0]} // Prevent past dates
                          className="w-40"
                          placeholder="Optional"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add any additional notes about this goods receipt..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {items.length > 0 && (
          <div className="flex justify-end gap-4">
            <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/grn`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSaveDraft} disabled={creating || posting} className="gap-2">
              <Save className="h-4 w-4" />
              {creating ? 'Saving...' : 'Save & Post'}
            </Button>
          </div>
        )}
      </main>

      {/* Post Confirmation Dialog */}
      <AlertDialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Post Goods Receipt Note?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Posting this GRN will immediately update stock quantities and create stock movements.
              This action cannot be undone. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSaveAndExit}>Save as Draft & Exit</AlertDialogCancel>
            <AlertDialogAction onClick={handlePost} disabled={posting}>
              <Send className="h-4 w-4 mr-2" />
              {posting ? 'Posting...' : 'Post GRN'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CreateGRNPage() {
  return (
    <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER']}>
      <CreateGRNContent />
    </RoleGuard>
  );
}
