'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  usePurchaseOrder,
  useUpdatePurchaseOrder,
  useMarkPurchaseOrderOrdered,
  useCancelPurchaseOrder,
  useGRNs,
  useSuppliers,
  useWarehouseStock,
} from '@/hooks/apollo';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/common/CopyButton';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Edit,
  Send,
  XCircle,
  FileText,
  Package,
  CheckCircle,
  Building2,
  Truck,
  Save,
  PackageCheck,
  Plus,
  X,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
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
import { useAuth } from '@/context/auth-context';

// Types
interface POItem {
  id?: string;
  product_id: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
  ordered_quantity: number;
  received_quantity?: number;
}

// GRN Section Component
function GRNSection({
  poId,
  companySlug,
  warehouseSlug,
}: {
  poId: string;
  companySlug: string;
  warehouseSlug: string;
}) {
  const router = useRouter();

  // Fetch GRNs for this PO
  const { data: grnsData, loading: grnsLoading } = useGRNs({
    filters: {
      purchase_order_id: poId,
      limit: 50,
    },
  });

  const grns = grnsData?.grns || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Helper to get status badge
  const getGRNStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      DRAFT: { variant: 'secondary', label: 'Draft' },
      POSTED: { variant: 'default', label: 'Posted' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
    };
    const item = config[status] || config.DRAFT;
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5" />
          Goods Receipt Notes ({grns.length})
        </CardTitle>
        <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/grn/new`}>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create GRN
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {grnsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading GRNs...</p>
          </div>
        ) : grns.length === 0 ? (
          <div className="text-center py-12">
            <PackageCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Goods Receipts Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start receiving goods from this purchase order
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN Number</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Items Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grns.map((grn: any) => (
                  <TableRow key={grn.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {grn.grn_number}
                    </TableCell>
                    <TableCell>{formatDate(grn.received_at)}</TableCell>
                    <TableCell>{getGRNStatusBadge(grn.status)}</TableCell>
                    <TableCell className="text-right">{grn.items?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/grn/${grn.id}`}
                      >
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Status badge helper for PO status
const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: any; label: string; icon: any; className?: string }> = {
    DRAFT: { variant: 'secondary', label: 'Draft', icon: FileText },
    ORDERED: { variant: 'default', label: 'Ordered', icon: Package },
    CLOSED: {
      variant: 'outline',
      label: 'Closed',
      icon: CheckCircle,
      className: 'border-primary/30 bg-primary/10 text-primary',
    },
    CANCELLED: { variant: 'destructive', label: 'Cancelled', icon: XCircle },
  };
  const item = config[status] || config.DRAFT;
  const Icon = item.icon;
  return (
    <Badge variant={item.variant} className={['gap-1', item.className].filter(Boolean).join(' ')}>
      <Icon className="h-3 w-3" />
      {item.label}
    </Badge>
  );
};

function PurchaseOrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companySlug = params?.slug as string;
  const poId = params?.poId as string;

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedSupplier, setEditedSupplier] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [editedItems, setEditedItems] = useState<POItem[]>([]);

  // Dialog states
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Fetch PO details
  const { data, loading, error } = usePurchaseOrder(poId);

  // Fetch suppliers for edit mode
  const { data: suppliersData } = useSuppliers({ includeArchived: false });

  // Fetch stock for current stock context
  const { data: stockData } = useWarehouseStock(data?.purchaseOrder?.warehouse?.id || '');

  const [markOrdered, { loading: orderingLoading }] = useMarkPurchaseOrderOrdered();

  const [cancelPO, { loading: cancellingLoading }] = useCancelPurchaseOrder();

  const [updatePO, { loading: savingLoading }] = useUpdatePurchaseOrder();

  const po = data?.purchaseOrder;
  const suppliers = suppliersData?.suppliers || [];
  const stock = stockData?.stockByWarehouse || [];

  // Create stock map for quick lookup
  const stockMap = new Map(stock.map((s: any) => [s.product.id, s.quantity]));

  // Initialize edit state when PO loads
  useEffect(() => {
    if (po && isEditing) {
      setEditedSupplier(po.supplier.id);
      setEditedNotes(po.notes || '');
      setEditedItems(
        po.items.map((item: any) => ({
          id: item.id,
          product_id: item.product.id,
          product: item.product,
          ordered_quantity: item.ordered_quantity,
          received_quantity: item.received_quantity,
        })),
      );
    }
  }, [po, isEditing]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ' at ' +
      date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  const handleMarkOrdered = async () => {
    try {
      await markOrdered({ variables: { id: poId } });
      toast.success('Purchase order marked as ORDERED');
      setShowOrderDialog(false);
    } catch (error: any) {
      console.error('Error marking PO as ORDERED:', error);
      toast.error(error.message || 'Failed to mark as ORDERED');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelPO({ variables: { id: poId } });
      toast.success('Purchase order cancelled');
      setShowCancelDialog(false);
      // Redirect to purchase orders list
      router.push(`/${companySlug}/purchase-orders`);
    } catch (error: any) {
      console.error('Error cancelling PO:', error);
      toast.error(error.message || 'Failed to cancel purchase order');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setShowDiscardDialog(true);
  };

  const handleDiscardChanges = () => {
    setIsEditing(false);
    setShowDiscardDialog(false);
    // Reset form will happen via useEffect
  };

  const handleSave = async () => {
    // Validation
    if (!editedSupplier) {
      toast.error('Please select a supplier');
      return;
    }
    if (editedItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }
    if (editedItems.some((item) => item.ordered_quantity <= 0)) {
      toast.error('All quantities must be greater than 0');
      return;
    }

    // Check for duplicate products
    const productIds = editedItems.map((item) => item.product_id);
    if (new Set(productIds).size !== productIds.length) {
      toast.error('Duplicate products are not allowed');
      return;
    }

    try {
      await updatePO({
        variables: {
          id: poId,
          input: {
            supplier_id: editedSupplier,
            notes: editedNotes || undefined,
            items: editedItems.map((item) => ({
              product_id: item.product_id,
              ordered_quantity: parseFloat(item.ordered_quantity.toString()),
            })),
          },
        },
      });
      toast.success('Purchase order updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating PO:', error);
      toast.error(error.message || 'Failed to update purchase order');
    }
  };

  const addItem = () => {
    setEditedItems([...editedItems, { product_id: '', ordered_quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const updated = [...editedItems];
    updated[index] = { ...updated[index], [field]: value };

    // Update product details when product_id changes
    if (field === 'product_id') {
      const stockItem = stock.find((s: any) => s.product.id === value);
      if (stockItem) {
        updated[index].product = stockItem.product;
      }
    }

    setEditedItems(updated);
  };

  // Check user role and permissions
  const userRole = user?.companies?.find((c: any) => c.slug === companySlug)?.role;
  const userWarehouses = user?.warehouses?.map((w: any) => w.warehouseId) || [];
  const isWarehouseAssigned = userWarehouses.includes(po?.warehouse?.id);

  // Permission checks
  const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN';
  const isManager = userRole === 'MANAGER';
  const isStaff = userRole === 'STAFF';

  const canViewPO =
    isOwnerOrAdmin || (isManager && isWarehouseAssigned) || (isStaff && isWarehouseAssigned);
  const canEdit = po?.status === 'DRAFT' && (isOwnerOrAdmin || (isManager && isWarehouseAssigned));
  const canMarkOrdered = canEdit;
  const canCancelDraft = canEdit;
  const canCancelOrdered = po?.status === 'ORDERED' && isOwnerOrAdmin;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-lg font-semibold">Purchase order not found</h3>
              <p className="text-sm text-muted-foreground">
                {error?.message || 'The purchase order you are looking for does not exist.'}
              </p>
              <Link href={`/${companySlug}/purchase-orders`}>
                <Button>Back to Purchase Orders</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewPO) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="text-sm text-muted-foreground">
                You don't have permission to view this purchase order.
              </p>
              <Link href={`/${companySlug}/purchase-orders`}>
                <Button>Back to Purchase Orders</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-background">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={`/${companySlug}/purchase-orders`}>
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
                      {po.po_number}
                    </h1>
                    {getStatusBadge(po.status)}
                    {isEditing && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-primary/30 bg-primary/10 text-primary"
                      >
                        <Edit className="h-3 w-3" />
                        Editing
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    Created {formatDate(po.created_at)}
                    {po.user?.fullName && (
                      <>
                        {' '}
                        by <span className="font-medium">{po.user.fullName}</span>
                        {po.user_role && (
                          <span className="text-muted-foreground"> ({po.user_role})</span>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={savingLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {savingLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <>
                    {canEdit && (
                      <Button variant="outline" onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit PO
                      </Button>
                    )}
                    {canMarkOrdered && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setShowOrderDialog(true)}
                            disabled={orderingLoading}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Mark as ORDERED
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Mark this PO as sent to supplier. It will become read-only.
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {(canCancelDraft || canCancelOrdered) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            onClick={() => setShowCancelDialog(true)}
                            disabled={cancellingLoading}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel PO
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {po.status === 'DRAFT'
                            ? 'Cancel this purchase order'
                            : 'Only OWNER/ADMIN can cancel ORDERED POs'}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8 space-y-6">
          {/* Info Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Warehouse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{po.warehouse.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-semibold">
                      {po.warehouse.type?.replace(/_/g, ' ') || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Supplier
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-2">
                    <Label>Supplier *</Label>
                    <Select value={editedSupplier} onValueChange={setEditedSupplier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((sup: any) => (
                          <SelectItem key={sup.id} value={sup.id}>
                            {sup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-semibold">{po.supplier.name}</p>
                    </div>
                    {po.supplier.email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold text-sm">{po.supplier.email}</p>
                      </div>
                    )}
                    {po.supplier.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-semibold">{po.supplier.phone}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  placeholder="Add notes or remarks..."
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  rows={3}
                />
              ) : (
                <p
                  className={`${po.notes ? 'text-foreground' : 'text-muted-foreground'} whitespace-pre-wrap`}
                >
                  {po.notes || 'No notes added'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Products ({isEditing ? editedItems.length : po.items.length})</CardTitle>
              {isEditing && (
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  {editedItems.map((item, index) => (
                    <div key={index} className="flex gap-4 items-end border-b pb-4 last:border-0">
                      <div className="flex-1 space-y-2">
                        <Label>Product *</Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) => updateItem(index, 'product_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {stock.map((stockItem: any) => (
                              <SelectItem key={stockItem.product.id} value={stockItem.product.id}>
                                {stockItem.product.name} ({stockItem.product.sku}) - Stock:{' '}
                                {stockItem.quantity}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32 space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.ordered_quantity}
                          onChange={(e) =>
                            updateItem(index, 'ordered_quantity', parseInt(e.target.value) || 1)
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={editedItems.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Current Stock</TableHead>
                        <TableHead className="text-right">Ordered Qty</TableHead>
                        <TableHead className="text-right">Received Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {po.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product.name}</TableCell>
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-1">
                              <span>{item.product.sku}</span>
                              <CopyButton
                                value={item.product.sku}
                                ariaLabel="Copy SKU"
                                successMessage="Copied SKU to clipboard"
                                className="h-7 w-7 text-muted-foreground"
                              />
                            </div>
                          </TableCell>
                          <TableCell>{item.product.unit || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono text-sm text-muted-foreground">
                              {stockMap.get(item.product.id)?.toString() ?? '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.ordered_quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.received_quantity > 0 ? (
                              <span className="text-primary font-semibold">
                                {item.received_quantity}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goods Receipt Notes */}
          {!isEditing && po.status === 'ORDERED' && (
            <GRNSection poId={poId} companySlug={companySlug} warehouseSlug={po.warehouse.id} />
          )}

          {/* Metadata */}
          {!isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Audit Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">Created By</dt>
                    <dd className="font-semibold">
                      {po.user?.fullName ? (
                        <>
                          {po.user.fullName}
                          {po.user_role && (
                            <span className="text-sm text-muted-foreground font-normal">
                              {' '}
                              ({po.user_role})
                            </span>
                          )}
                        </>
                      ) : po.user_role ? (
                        po.user_role
                      ) : (
                        'Not Available'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Status</dt>
                    <dd>{getStatusBadge(po.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Created At</dt>
                    <dd className="font-semibold text-sm">{formatDate(po.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Last Updated</dt>
                    <dd className="font-semibold text-sm">{formatDate(po.updated_at)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Order Confirmation Dialog */}
        <AlertDialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as ORDERED?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the purchase order as sent to the supplier. The PO will become
                read-only and can no longer be edited. No stock changes will occur until goods are
                received through a GRN.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleMarkOrdered} disabled={orderingLoading}>
                {orderingLoading ? 'Processing...' : 'Mark as ORDERED'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Purchase Order?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The purchase order will be marked as cancelled and no
                further actions can be taken.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep PO</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={cancellingLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancellingLoading ? 'Cancelling...' : 'Cancel PO'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Discard Changes Dialog */}
        <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to discard them?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Editing</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDiscardChanges}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

export default function PurchaseOrderDetailPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <PurchaseOrderDetailContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
