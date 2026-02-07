'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useWarehouse } from '@/context/warehouse-context';
import { useQuery } from '@apollo/client';
import {
  GET_STOCK_SNAPSHOT,
  GET_STOCK_MOVEMENTS,
  GET_ADJUSTMENT_REPORT,
} from '@/lib/graphql/warehouse-reports';
import { GET_WAREHOUSE_STOCK_HEALTH } from '@/lib/graphql/stock-health';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/common/CopyButton';
import { format, subDays } from 'date-fns';
import {
  FileText,
  Activity,
  AlertTriangle,
  Calendar,
  Package,
  TrendingDown,
  Shield,
  Clock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/export/ExportButton';
import { StockHealthBadge } from '@/components/inventory/stock-health-badge';

function WarehouseReportsContent() {
  const { activeWarehouse } = useWarehouse();
  const [activeTab, setActiveTab] = useState('snapshot');

  // Date range for movements (default: last 30 days)
  const [movementsDateRange, setMovementsDateRange] = useState({
    fromDate: subDays(new Date(), 30).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
  });

  // Date range for adjustments (default: last 30 days)
  const [adjustmentsDateRange, setAdjustmentsDateRange] = useState({
    fromDate: subDays(new Date(), 30).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
  });

  // Stock Snapshot Query (CURRENT STATE - no date filters)
  const { data: snapshotData, loading: snapshotLoading } = useQuery(GET_STOCK_SNAPSHOT, {
    variables: {
      warehouseId: activeWarehouse?.id,
      filters: {
        limit: 100,
        offset: 0,
      },
    },
    skip: !activeWarehouse?.id,
  });

  // Warehouse Stock Health Query (for health overview cards)
  const { data: healthData, loading: healthLoading } = useQuery(GET_WAREHOUSE_STOCK_HEALTH, {
    variables: { warehouseId: activeWarehouse?.id },
    skip: !activeWarehouse?.id,
  });

  // Stock Movements Query (HISTORICAL - requires date range)
  const {
    data: movementsData,
    loading: movementsLoading,
    refetch: refetchMovements,
  } = useQuery(GET_STOCK_MOVEMENTS, {
    variables: {
      warehouseId: activeWarehouse?.id,
      filters: {
        fromDate: new Date(movementsDateRange.fromDate),
        toDate: new Date(movementsDateRange.toDate),
        limit: 100,
        offset: 0,
      },
    },
    skip: !activeWarehouse?.id,
  });

  // Adjustments Report Query (HISTORICAL - requires date range)
  const {
    data: adjustmentsData,
    loading: adjustmentsLoading,
    refetch: refetchAdjustments,
  } = useQuery(GET_ADJUSTMENT_REPORT, {
    variables: {
      warehouseId: activeWarehouse?.id,
      filters: {
        fromDate: new Date(adjustmentsDateRange.fromDate),
        toDate: new Date(adjustmentsDateRange.toDate),
        limit: 100,
        offset: 0,
      },
    },
    skip: !activeWarehouse?.id,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      OK: 'default',
      WARNING: 'secondary',
      CRITICAL: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getMovementTypeBadge = (type: string) => {
    const isIncoming = ['GRN', 'ADJUSTMENT_IN', 'TRANSFER_IN'].includes(type);
    return (
      <Badge
        variant={isIncoming ? 'default' : 'secondary'}
        className={isIncoming ? 'bg-green-600' : 'bg-red-600'}
      >
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Warehouse Reports
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Historical analysis and current inventory snapshot for {activeWarehouse?.name}
        </p>
      </div>

      {/* Health Overview Cards */}
      {!healthLoading &&
        healthData?.warehouseStockHealth &&
        (() => {
          const healthMetrics = healthData.warehouseStockHealth.reduce(
            (acc: any, item: any) => {
              acc.totalStock += item.totalStock || 0;
              acc.usableStock += item.usableStock || 0;
              acc.expiredQty += item.expiredQty || 0;
              acc.expiringSoonQty += item.expiringSoonQty || 0;

              if (item.state === 'BLOCKED') acc.blockedCount++;
              else if (item.state === 'CRITICAL') acc.criticalCount++;
              else if (item.state === 'AT_RISK') acc.atRiskCount++;
              else if (item.state === 'LOW_STOCK') acc.lowStockCount++;

              return acc;
            },
            {
              totalStock: 0,
              usableStock: 0,
              expiredQty: 0,
              expiringSoonQty: 0,
              blockedCount: 0,
              criticalCount: 0,
              atRiskCount: 0,
              lowStockCount: 0,
            },
          );

          return (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{healthMetrics.totalStock.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">All inventory</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 dark:border-green-900">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usable Stock</CardTitle>
                    <Shield className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {healthMetrics.usableStock.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Available for use</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 dark:border-red-900">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expired Qty</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {healthMetrics.expiredQty.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Requires action</p>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 dark:border-orange-900">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {healthMetrics.expiringSoonQty.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Within 30 days</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Product Health Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Blocked</span>
                      <Badge variant="secondary" className="bg-gray-500">
                        {healthMetrics.blockedCount}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Critical</span>
                      <Badge variant="destructive">{healthMetrics.criticalCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">At Risk</span>
                      <Badge variant="secondary" className="border-yellow-500 text-yellow-700">
                        {healthMetrics.atRiskCount}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Low Stock</span>
                      <Badge variant="secondary" className="border-orange-500 text-orange-700">
                        {healthMetrics.lowStockCount}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          );
        })()}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="snapshot" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Stock Snapshot
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Stock Movements
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Adjustments
          </TabsTrigger>
        </TabsList>

        {/* Stock Snapshot Tab */}
        <TabsContent value="snapshot" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Inventory Snapshot</CardTitle>
                  <CardDescription>
                    Real-time view of all products in this warehouse. No historical data.
                  </CardDescription>
                </div>
                <ExportButton
                  type="stock_snapshot"
                  warehouseId={activeWarehouse?.id}
                  disabled={!snapshotData?.stockSnapshot?.items?.length}
                />
              </div>
            </CardHeader>
            <CardContent>
              {snapshotLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshotData?.stockSnapshot?.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-1">
                            <span>{item.sku}</span>
                            <CopyButton
                              value={item.sku}
                              ariaLabel="Copy SKU"
                              successMessage="Copied SKU to clipboard"
                              className="h-7 w-7 text-muted-foreground"
                            />
                          </div>
                        </TableCell>
                        <TableCell>{item.categoryName || '-'}</TableCell>
                        <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                        <TableCell>{item.unit || '-'}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(item.lastUpdated), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Movements Tab */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stock Movement Ledger</CardTitle>
                  <CardDescription>
                    Historical record of all stock changes within the selected date range.
                  </CardDescription>
                </div>
                <ExportButton
                  type="stock_movements"
                  warehouseId={activeWarehouse?.id}
                  filters={{
                    dateFrom: movementsDateRange.fromDate,
                    dateTo: movementsDateRange.toDate,
                  }}
                  disabled={!movementsData?.stockMovements?.items?.length}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range Filter */}
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="movements-from">From Date</Label>
                  <Input
                    id="movements-from"
                    type="date"
                    value={movementsDateRange.fromDate}
                    onChange={(e) =>
                      setMovementsDateRange({ ...movementsDateRange, fromDate: e.target.value })
                    }
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="movements-to">To Date</Label>
                  <Input
                    id="movements-to"
                    type="date"
                    value={movementsDateRange.toDate}
                    onChange={(e) =>
                      setMovementsDateRange({ ...movementsDateRange, toDate: e.target.value })
                    }
                  />
                </div>
                <Button onClick={() => refetchMovements()}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              </div>

              {movementsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementsData?.stockMovements?.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">
                          {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.productName}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                            <span>{item.sku}</span>
                            <CopyButton
                              value={item.sku}
                              ariaLabel="Copy SKU"
                              successMessage="Copied SKU to clipboard"
                              className="h-6 w-6 text-muted-foreground"
                            />
                          </div>
                        </TableCell>
                        <TableCell>{getMovementTypeBadge(item.type)}</TableCell>
                        <TableCell
                          className={`text-right font-mono font-semibold ${
                            item.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {item.quantity > 0 ? '+' : ''}
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.referenceId
                            ? `${item.referenceType || ''} #${item.referenceId.slice(0, 8)}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.performedBy}
                          {item.userRole && (
                            <div className="text-xs text-muted-foreground">{item.userRole}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adjustments Tab */}
        <TabsContent value="adjustments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Adjustments Report</CardTitle>
                  <CardDescription>
                    Stock corrections and manual adjustments within the selected date range.
                  </CardDescription>
                </div>
                <ExportButton
                  type="adjustments"
                  warehouseId={activeWarehouse?.id}
                  filters={{
                    dateFrom: adjustmentsDateRange.fromDate,
                    dateTo: adjustmentsDateRange.toDate,
                  }}
                  disabled={!adjustmentsData?.adjustmentReport?.items?.length}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range Filter */}
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="adjustments-from">From Date</Label>
                  <Input
                    id="adjustments-from"
                    type="date"
                    value={adjustmentsDateRange.fromDate}
                    onChange={(e) =>
                      setAdjustmentsDateRange({ ...adjustmentsDateRange, fromDate: e.target.value })
                    }
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="adjustments-to">To Date</Label>
                  <Input
                    id="adjustments-to"
                    type="date"
                    value={adjustmentsDateRange.toDate}
                    onChange={(e) =>
                      setAdjustmentsDateRange({ ...adjustmentsDateRange, toDate: e.target.value })
                    }
                  />
                </div>
                <Button onClick={() => refetchAdjustments()}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              </div>

              {adjustmentsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustmentsData?.adjustmentReport?.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">
                          {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.productName}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                            <span>{item.sku}</span>
                            <CopyButton
                              value={item.sku}
                              ariaLabel="Copy SKU"
                              successMessage="Copied SKU to clipboard"
                              className="h-6 w-6 text-muted-foreground"
                            />
                          </div>
                        </TableCell>
                        <TableCell>{getMovementTypeBadge(item.adjustmentType)}</TableCell>
                        <TableCell
                          className={`text-right font-mono font-semibold ${
                            item.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {item.quantity > 0 ? '+' : ''}
                          {item.quantity}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{item.reason || '-'}</TableCell>
                        <TableCell className="text-sm">
                          {item.performedBy}
                          {item.userRole && (
                            <div className="text-xs text-muted-foreground">{item.userRole}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function WarehouseReportsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <WarehouseReportsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
