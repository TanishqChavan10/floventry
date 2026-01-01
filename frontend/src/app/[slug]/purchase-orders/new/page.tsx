'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
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
import { ArrowLeft, Plus, X, Save, Send } from 'lucide-react';
import { CREATE_PURCHASE_ORDER, GET_PURCHASE_ORDERS } from '@/lib/graphql/purchase-orders';
import { GET_WAREHOUSES_BY_COMPANY } from '@/lib/graphql/company';
import { GET_SUPPLIERS } from '@/lib/graphql/catalog';
import { GET_STOCK_BY_WAREHOUSE } from '@/lib/graphql/stock';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

interface POItem {
  product_id: string;
  product_name?: string;
  ordered_quantity: number;
}

function CreatePurchaseOrderContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const companySlug = params?.slug as string;
  const { user } = useAuth();

  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POItem[]>([{ product_id: '', ordered_quantity: 1 }]);
  const [hasPrefilledData, setHasPrefilledData] = useState(false);

  // Fetch warehouses
  const { data: warehousesData } = useQuery(GET_WAREHOUSES_BY_COMPANY, {
    variables: { slug: companySlug },
    fetchPolicy: 'cache-and-network',
  });

  // Fetch suppliers  
  const { data: suppliersData } = useQuery(GET_SUPPLIERS, {
    variables: { includeArchived: false },
    fetchPolicy: 'cache-and-network',
  });

  // Fetch products for selected warehouse
  const { data: productsData } = useQuery(GET_STOCK_BY_WAREHOUSE, {
    variables: { warehouseId: selectedWarehouse },
    skip: !selectedWarehouse,
    fetchPolicy: 'cache-and-network',
  });

  const [createPO, { loading }] = useMutation(CREATE_PURCHASE_ORDER, {
    refetchQueries: [{ query: GET_PURCHASE_ORDERS, variables: { filters: { limit: 100 } } }],
  });

  // Get user role and assigned warehouses
  const userRole = user?.companies?.find((c: any) => c.slug === companySlug)?.role;
  const userWarehouseIds = user?.warehouses?.map((w: any) => w.warehouseId) || [];
  
  // Filter warehouses based on role
  let warehouses = warehousesData?.companyBySlug?.warehouses || [];
  if (userRole === 'MANAGER') {
    // Managers can only see their assigned warehouses
    warehouses = warehouses.filter((wh: any) => userWarehouseIds.includes(wh.id));
  }
  
  const suppliers = suppliersData?.suppliers || [];
  const products = productsData?.stockByWarehouse || [];

  // Auto-prefill from URL query params (from Low Stock page)
  useEffect(() => {
    if (hasPrefilledData) return;

    const warehouseIdParam = searchParams.get('warehouseId');
    const supplierIdParam = searchParams.get('supplierId');
    const productIdParam = searchParams.get('productId');

    if (warehouseIdParam || supplierIdParam || productIdParam) {
      // Auto-select warehouse
      if (warehouseIdParam && warehouses.some((w: any) => w.id === warehouseIdParam)) {
        setSelectedWarehouse(warehouseIdParam);
      }

      // Auto-select supplier
      if (supplierIdParam && suppliers.some((s: any) => s.id === supplierIdParam)) {
        setSelectedSupplier(supplierIdParam);
      }

      // Auto-add product (after warehouse and products are loaded)
      if (productIdParam && products.length > 0) {
        const product = products.find((p: any) => p.product.id === productIdParam);
        if (product) {
          setItems([{
            product_id: product.product.id,
            product_name: product.product.name,
            ordered_quantity: 1, // User needs to specify quantity
          }]);
        }
        setHasPrefilledData(true);
      }
    }
  }, [searchParams, warehouses, suppliers, products, hasPrefilledData]);

  const addItem = () => {
    setItems([...items, { product_id: '', ordered_quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (markAsOrdered: boolean) => {
    // Validation
    if (!selectedWarehouse) {
      toast.error('Please select a warehouse');
      return;
    }
    if (!selectedSupplier) {
      toast.error('Please select a supplier');
      return;
    }
    if (items.length === 0 || items.some(item => !item.product_id || item.ordered_quantity <= 0)) {
      toast.error('Please add at least one valid product');
      return;
    }

    try {
      const result = await createPO({
        variables: {
          input: {
            warehouse_id: selectedWarehouse,
            supplier_id: selectedSupplier,
            items: items.map(item => ({
              product_id: item.product_id,
              ordered_quantity: parseFloat(item.ordered_quantity.toString()),
            })),
            notes: notes || undefined,
          },
        },
      });

      toast.success('Purchase order created successfully!');
      router.push(`/${companySlug}/purchase-orders/${result.data.createPurchaseOrder.id}`);
    } catch (error: any) {
      console.error('Error creating PO:', error);
      toast.error(error.message || 'Failed to create purchase order');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href={`/${companySlug}/purchase-orders`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Create Purchase Order
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Add products to create a new purchase order
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse *</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger id="warehouse">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((wh: any) => (
                        <SelectItem key={wh.id} value={wh.id}>
                          {wh.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger id="supplier">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes or instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Products</CardTitle>
              <Button onClick={addItem} size="sm" disabled={!selectedWarehouse}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedWarehouse && (
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-4">
                  Select a warehouse first to add products
                </p>
              )}
              
              {selectedWarehouse && items.map((item, index) => (
                <div key={index} className="flex gap-4 items-end">
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
                        {products.map((stock: any) => (
                          <SelectItem key={stock.product.id} value={stock.product.id}>
                            {stock.product.name} ({stock.product.sku}) - Current: {stock.quantity}
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
                      onChange={(e) => updateItem(index, 'ordered_quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href={`/${companySlug}/purchase-orders`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              variant="secondary"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreatePurchaseOrderPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER']}>
        <CreatePurchaseOrderContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
