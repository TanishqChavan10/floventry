'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { useWarehouse } from '@/context/warehouse-context';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { CREATE_GRN, POST_GRN, GET_GRNS } from '@/lib/graphql/grn';
import { GET_PURCHASE_ORDERS } from '@/lib/graphql/purchase-orders';
import { toast } from 'sonner';

interface GRNItemInput {
  purchase_order_item_id: string;
  received_quantity: number;
  expiry_date?: string;
  product_name?: string;
  ordered_quantity?: number;
  already_received?: number;
  remaining_quantity?: number;
}

interface CreateGRNModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateGRNModal({ open, onOpenChange, onSuccess }: CreateGRNModalProps) {
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

  // Load PO items when PO is selected
  useEffect(() => {
    if (selectedPO && posData?.purchaseOrders) {
      const po = posData.purchaseOrders.find((p: any) => p.id === selectedPO);
      if (po && po.items) {
        const poItems = po.items.map((item: any) => ({
          purchase_order_item_id: item.id,
          received_quantity: 0,
          expiry_date: '',
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

  const handleClose = () => {
    setSelectedPO('');
    setNotes('');
    setItems([]);
    setDraftGRNId(null);
    onOpenChange(false);
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

      const result = await createGRN({
        variables: {
          input: {
            warehouse_id: po.warehouse.id,
            purchase_order_id: selectedPO,
            items: items.map((item) => ({
              purchase_order_item_id: item.purchase_order_item_id,
              received_quantity: Math.floor(Number(item.received_quantity)),
              expiry_date: item.expiry_date || undefined,
            })),
            notes: notes || undefined,
          },
        },
      });

      setDraftGRNId(result.data.createGRN.id);
      setShowPostDialog(true);
    } catch (error: any) {
      console.error('Error creating GRN:', error);
      toast.error(error.message || 'Failed to create GRN');
    }
  };

  const handlePost = async () => {
    if (!draftGRNId) return;

    try {
      const grnId = draftGRNId;
      await postGRN({ variables: { id: draftGRNId } });
      toast.success('GRN posted successfully! Stock has been updated.');
      setShowPostDialog(false);
      handleClose();
      onSuccess?.();
      router.push(`/${companySlug}/warehouses/${warehouseSlug}/inventory/grn/${grnId}`);
    } catch (error: any) {
      console.error('Error posting GRN:', error);
      toast.error(error.message || 'Failed to post GRN');
    }
  };

  const handleSaveAndExit = () => {
    toast.success('GRN saved as draft');
    setShowPostDialog(false);
    handleClose();
    onSuccess?.();
  };

  const selectedPOData = purchaseOrders.find((p: any) => p.id === selectedPO);

  return (
    <>
      <Dialog open={open && !showPostDialog} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Goods Receipt Note</DialogTitle>
            <DialogDescription>Record goods received from a purchase order</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* PO Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Select Purchase Order <span className="text-red-500">*</span>
                </Label>
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

            {/* Items Table */}
            {items.length > 0 && (
              <div className="border rounded-lg">
                <div className="max-h-[350px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-slate-900">
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Ordered</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-right">Receiving *</TableHead>
                        <TableHead>Expiry Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.purchase_order_item_id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell className="text-right">{item.ordered_quantity}</TableCell>
                          <TableCell className="text-right">{item.already_received}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.remaining_quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
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
                              min={new Date().toISOString().split('T')[0]}
                              className="w-40"
                              placeholder="Optional"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Notes */}
            {items.length > 0 && (
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add any additional notes about this goods receipt..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={creating || posting}>
              Cancel
            </Button>
            <Button onClick={handleSaveDraft} disabled={creating || posting || items.length === 0}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Post'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {posting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post GRN'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
