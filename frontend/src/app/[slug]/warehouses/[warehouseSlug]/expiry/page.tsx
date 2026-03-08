'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useWarehouseStock } from '@/hooks/apollo';
import { useAuth } from '@/context/auth-context';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Calendar, Package, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExpiryStatusBadge } from '@/components/inventory/ExpiryStatusBadge';
import { LotBreakdownModal } from '@/components/inventory/LotBreakdownModal';
import { CopyButton } from '@/components/common/CopyButton';
import {
  getExpiryStatus,
  getDaysUntilExpiry,
  calculateExpiryStats,
  LotWithExpiry,
} from '@/lib/utils/expiry';
import { format } from 'date-fns';

interface ProductWithLots {
  product: {
    id: string;
    name: string;
    sku: string;
  };
  lots: LotWithExpiry[];
}

function ExpiryContent() {
  const params = useParams();
  const { user } = useAuth();
  const warehouseSlug = params.warehouseSlug as string;

  const [selectedTab, setSelectedTab] = useState('all');
  const [lotBreakdownProduct, setLotBreakdownProduct] = useState<ProductWithLots | null>(null);
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);

  // Get warehouse ID
  const activeWarehouse = user?.warehouses?.find((w: any) => w.warehouseSlug === warehouseSlug);
  const warehouseId = activeWarehouse?.warehouseId;

  // Fetch stock with lots
  const { data: stockData, loading } = useWarehouseStock(warehouseId || '');

  const stock = stockData?.stockByWarehouse || [];

  // Process lots from all products
  const allLots = useMemo(() => {
    const lots: Array<
      LotWithExpiry & { productName: string; productSku: string; productId: string }
    > = [];

    stock.forEach((item: any) => {
      if (item.lots && item.lots.length > 0) {
        item.lots.forEach((lot: LotWithExpiry) => {
          lots.push({
            ...lot,
            productName: item.product.name,
            productSku: item.product.sku,
            productId: item.product.id,
          });
        });
      }
    });

    return lots;
  }, [stock]);

  // Calculate statistics
  const stats = useMemo(() => calculateExpiryStats(allLots), [allLots]);

  // Filter lots based on selected tab
  const filteredLots = useMemo(() => {
    if (selectedTab === 'all') return allLots;

    return allLots.filter((lot) => {
      const status = getExpiryStatus(lot.expiry_date);

      if (selectedTab === 'expired') return status === 'EXPIRED';
      if (selectedTab === 'expiring_soon') return status === 'EXPIRING_SOON';
      if (selectedTab === 'critical') {
        const days = getDaysUntilExpiry(lot.expiry_date);
        return days !== null && days >= 0 && days <= 7;
      }
      if (selectedTab === 'warning') {
        const days = getDaysUntilExpiry(lot.expiry_date);
        return days !== null && days > 7 && days <= 30;
      }

      return false;
    });
  }, [allLots, selectedTab]);

  // Sort by expiry date (earliest first)
  const sortedLots = useMemo(() => {
    return [...filteredLots].sort((a, b) => {
      if (!a.expiry_date && !b.expiry_date) return 0;
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    });
  }, [filteredLots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading expiry data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Expiry Risk Report
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Monitor product expiration dates and manage expiring stock
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Lots</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
              <p className="text-xs text-muted-foreground mt-1">Require immediate action</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground mt-1">Within 30 days</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy Stock</CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.ok}</div>
              <p className="text-xs text-muted-foreground mt-1">No immediate risk</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lots</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">In this warehouse</p>
            </CardContent>
          </Card>
        </div>

        {/* Lots Table with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Lot Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="all">All Lots ({allLots.length})</TabsTrigger>
                <TabsTrigger value="expired">Expired ({stats.expired})</TabsTrigger>
                <TabsTrigger value="critical">Critical ≤7d</TabsTrigger>
                <TabsTrigger value="warning">Warning 8-30d</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="mt-4">
                {sortedLots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No lots in this category
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Days Remaining</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedLots.map((lot: any) => {
                        const status = getExpiryStatus(lot.expiry_date);
                        const daysRemaining = getDaysUntilExpiry(lot.expiry_date);

                        return (
                          <TableRow
                            key={lot.id}
                            className={
                              status === 'EXPIRED'
                                ? 'bg-red-50 dark:bg-red-950/20'
                                : status === 'EXPIRING_SOON'
                                  ? 'bg-orange-50 dark:bg-orange-950/20'
                                  : ''
                            }
                          >
                            <TableCell className="font-mono text-sm">
                              <div className="flex items-center gap-1">
                                <span>{lot.productSku}</span>
                                <CopyButton
                                  value={lot.productSku}
                                  ariaLabel="Copy SKU"
                                  successMessage="Copied SKU to clipboard"
                                  className="h-7 w-7 text-muted-foreground"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{lot.productName}</TableCell>
                            <TableCell className="text-right">{lot.quantity.toFixed(2)}</TableCell>
                            <TableCell className="text-sm">
                              {lot.expiry_date
                                ? format(new Date(lot.expiry_date), 'dd MMM yyyy')
                                : '—'}
                            </TableCell>
                            <TableCell
                              className={
                                daysRemaining !== null && daysRemaining < 0
                                  ? 'text-red-600 font-semibold'
                                  : daysRemaining !== null && daysRemaining <= 30
                                    ? 'text-orange-600 font-semibold'
                                    : ''
                              }
                            >
                              {daysRemaining !== null
                                ? daysRemaining < 0
                                  ? `${Math.abs(daysRemaining)} days ago`
                                  : `${daysRemaining} days`
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <ExpiryStatusBadge status={status} daysRemaining={daysRemaining} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {isLotModalOpen && lotBreakdownProduct && (
        <LotBreakdownModal
          isOpen={isLotModalOpen}
          onClose={() => {
            setIsLotModalOpen(false);
            setLotBreakdownProduct(null);
          }}
          productName={lotBreakdownProduct.product.name}
          productSku={lotBreakdownProduct.product.sku}
          lots={lotBreakdownProduct.lots}
        />
      )}
    </div>
  );
}

export default function ExpiryPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <ExpiryContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
