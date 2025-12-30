'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, XCircle, Package } from 'lucide-react';
import { GET_LOW_STOCK_ITEMS, UPDATE_STOCK_THRESHOLDS } from '@/lib/graphql/low-stock';
import { toast } from 'sonner';

// Status badge helper
const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: any; label: string; icon: any; className: string }> = {
    OK: { variant: 'default', label: 'OK', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-200' },
    WARNING: { variant: 'secondary', label: 'Warning', icon: AlertTriangle, className: 'bg-orange-100 text-orange-700 border-orange-200' },
    CRITICAL: { variant: 'destructive', label: 'Critical', icon: XCircle, className: 'bg-red-100 text-red-700 border-red-200' },
  };
  const item = config[status] || config.OK;
  const Icon = item.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${item.className}`}>
      <Icon className="h-3 w-3" />
      {item.label}
    </Badge>
  );
};

function LowStockContent() {
  const params = useParams();
  const { user } = useAuth();
  const { activeWarehouse } = useWarehouse();
  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;

  const [editingThresholds, setEditingThresholds] = useState<Record<string, any>>({});

  // Get user role for RBAC
  const activeCompany = user?.companies?.find(c => c.id === user.activeCompanyId);
  const userRole = activeCompany?.role;
  const canEdit = userRole ? ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole) : false;

  const { data, loading, error, refetch } = useQuery(GET_LOW_STOCK_ITEMS, {
    variables: { warehouseId: activeWarehouse?.id || '' },
    skip: !activeWarehouse?.id,
    fetchPolicy: 'cache-and-network',
  });

  const [updateThresholds, { loading: updating }] = useMutation(UPDATE_STOCK_THRESHOLDS, {
    onCompleted: () => {
      toast.success('Thresholds updated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update thresholds');
    },
  });

  const lowStockItems = data?.lowStockItems || [];

  // Calculate stats
  const criticalCount = lowStockItems.filter((item: any) => item.status === 'CRITICAL').length;
  const warningCount = lowStockItems.filter((item: any) => item.status === 'WARNING').length;

  const handleThresholdChange = (stockId: string, field: string, value: string) => {
    setEditingThresholds({
      ...editingThresholds,
      [stockId]: {
        ...editingThresholds[stockId],
        [field]: value === '' ? null : parseInt(value, 10),
      },
    });
  };

  const handleSaveThresholds = async (stockId: string) => {
    const thresholds = editingThresholds[stockId];
    if (!thresholds) return;

    // Client-side validation
    const min = thresholds.min_stock_level;
    const reorder = thresholds.reorder_point;
    const max = thresholds.max_stock_level;

    if (min !== null && reorder !== null && min > reorder) {
      toast.error('Min stock must be ≤ reorder point');
      return;
    }
    if (reorder !== null && max !== null && reorder > max) {
      toast.error('Reorder point must be ≤ max stock');
      return;
    }
    if (min !== null && max !== null && min > max) {
      toast.error('Min stock must be ≤ max stock');
      return;
    }

    try {
      await updateThresholds({
        variables: {
          stockId,
          input: thresholds,
        },
      });
      setEditingThresholds({});
    } catch (err) {
      // Error handled by onError callback
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading low stock items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold">Failed to load low stock items</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{error.message}</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Low Stock Alerts
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Products that need attention in {activeWarehouse?.name}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Below minimum level</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warning Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{warningCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Below reorder point</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items ({lowStockItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">All inventory levels are healthy 🎉</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  No products are currently below their reorder thresholds
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Min Level</TableHead>
                      <TableHead className="text-right">Reorder Point</TableHead>
                      <TableHead className="text-right">Max Level</TableHead>
                      <TableHead>Status</TableHead>
                      {canEdit && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item: any) => {
                      const isEditing = !!editingThresholds[item.stockId];
                      const editValues = editingThresholds[item.stockId] || {};

                      return (
                        <TableRow key={item.stockId}>
                          <TableCell className="font-medium">{item.product.name}</TableCell>
                          <TableCell className="font-mono text-sm">{item.product.sku}</TableCell>
                          <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {canEdit ? (
                              <Input
                                type="number"
                                min="0"
                                value={editValues.min_stock_level !== undefined ? editValues.min_stock_level : item.minStockLevel || ''}
                                onChange={(e) => handleThresholdChange(item.stockId, 'min_stock_level', e.target.value)}
                                className="w-20 text-right"
                                placeholder="—"
                              />
                            ) : (
                              item.minStockLevel || '—'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {canEdit ? (
                              <Input
                                type="number"
                                min="0"
                                value={editValues.reorder_point !== undefined ? editValues.reorder_point : item.reorderPoint || ''}
                                onChange={(e) => handleThresholdChange(item.stockId, 'reorder_point', e.target.value)}
                                className="w-20 text-right"
                                placeholder="—"
                              />
                            ) : (
                              item.reorderPoint || '—'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {canEdit ? (
                              <Input
                                type="number"
                                min="0"
                                value={editValues.max_stock_level !== undefined ? editValues.max_stock_level : item.maxStockLevel || ''}
                                onChange={(e) => handleThresholdChange(item.stockId, 'max_stock_level', e.target.value)}
                                className="w-20 text-right"
                                placeholder="—"
                              />
                            ) : (
                              item.maxStockLevel || '—'
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              {isEditing && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveThresholds(item.stockId)}
                                  disabled={updating}
                                >
                                  Save
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function LowStockPage() {
  return (
    <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
      <LowStockContent />
    </RoleGuard>
  );
}
