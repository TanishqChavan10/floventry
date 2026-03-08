'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useWarehousesByCompany, useStockByWarehouse, useStockMovements } from '@/hooks/apollo';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/common/CopyButton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUpDown, Loader2, AlertCircle, X, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';

// TypeScript types
enum MovementType {
  OPENING = 'OPENING',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

interface StockMovement {
  id: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
  productName: string;
  sku: string;
  performedBy?: string;
  userRole?: string;
}

type WarehouseAccess = {
  warehouseSlug: string;
  warehouseId: string;
  warehouseName: string;
};

type CompanyWarehouse = {
  id: string;
  name: string;
  slug: string;
};

type WarehouseStockItem = {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
};

type StockMovementsFilters = {
  fromDate: Date;
  toDate: Date;
  limit: number;
  offset: number;
  productId?: string;
  types?: string[];
};

// Helper function to get badge variant for movement type
function getMovementDirection(type: MovementType): 'IN' | 'OUT' | 'NEUTRAL' {
  switch (type) {
    case MovementType.OPENING:
    case MovementType.ADJUSTMENT_IN:
    case MovementType.IN:
    case MovementType.TRANSFER_IN:
      return 'IN';
    case MovementType.ADJUSTMENT_OUT:
    case MovementType.OUT:
    case MovementType.TRANSFER_OUT:
      return 'OUT';
    default:
      return 'NEUTRAL';
  }
}

function getDirectionBadgeVariant(
  direction: 'IN' | 'OUT' | 'NEUTRAL',
): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (direction) {
    case 'IN':
      return 'default';
    case 'OUT':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function formatSourceLabel(input?: string): string {
  if (!input) return 'Manual';
  switch (input) {
    case 'SALES_ORDER':
      return 'Sale';
    case 'PURCHASE_ORDER':
      return 'Purchase';
    case 'GRN':
      return 'GRN';
    case 'TRANSFER':
      return 'Transfer';
    case 'ADJUSTMENT':
      return 'Adjustment';
    case 'MANUAL':
      return 'Manual';
    default:
      return input
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

// Helper function to format quantity with sign and color
function QuantityDelta({
  quantity,
  direction,
}: {
  quantity: number;
  direction: 'IN' | 'OUT' | 'NEUTRAL';
}) {
  const absQuantity = Math.abs(quantity);

  const className =
    direction === 'IN'
      ? 'text-green-600 dark:text-green-400'
      : direction === 'OUT'
        ? 'text-red-600 dark:text-red-400'
        : 'text-slate-600 dark:text-slate-400';

  const prefix = direction === 'IN' ? '+' : direction === 'OUT' ? '-' : '';

  return (
    <span className={`font-mono font-semibold ${className}`}>
      {prefix}
      {absQuantity}
    </span>
  );
}

// Helper function to format date and time
function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  };
}

function StockMovementsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const companySlug = params.slug as string;
  const warehouseSlug = params.warehouseSlug as string;

  const productIdParam = searchParams.get('productId');

  // Filter state
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>(productIdParam || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    if (!productIdParam) return;
    setSelectedProduct(productIdParam);
  }, [productIdParam]);

  // Get warehouse ID from context or user data
  const userWarehouses = (user?.warehouses as WarehouseAccess[] | undefined) ?? [];
  const activeWarehouse = userWarehouses.find((w) => w.warehouseSlug === warehouseSlug);

  // Get role from active company
  const activeCompany = user?.companies?.find((c) => c.id === user.activeCompanyId);
  const userRole = activeCompany?.role;

  // For OWNER/ADMIN, fetch all company warehouses as fallback
  const needsCompanyFallback = !activeWarehouse && ['OWNER', 'ADMIN'].includes(userRole || '');
  const { data: companyData } = useWarehousesByCompany(needsCompanyFallback ? companySlug : '');

  // Try to get warehouse from company data if not in user.warehouses
  const companyWarehouses: CompanyWarehouse[] = companyData?.companyBySlug?.warehouses ?? [];
  const warehouseFromCompany = companyWarehouses.find((w) => w.slug === warehouseSlug);

  const warehouseId = activeWarehouse?.warehouseId || warehouseFromCompany?.id;
  const warehouseName = activeWarehouse?.warehouseName || warehouseFromCompany?.name;

  // Fetch stock for product filter
  const { data: stockData } = useStockByWarehouse(warehouseId || '');

  // Calculate default dates once (30 days ago and today)
  const defaultFromDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, []);

  const defaultToDate = useMemo(() => new Date(), []);

  // Build filter object for GraphQL query - memoize to prevent infinite loops
  const filters = useMemo(() => {
    const filterObj: StockMovementsFilters = {
      fromDate: fromDate ? new Date(fromDate) : defaultFromDate,
      toDate: toDate ? new Date(toDate) : defaultToDate,
      limit: 100,
      offset: 0,
    };

    if (selectedProduct !== 'all') {
      filterObj.productId = selectedProduct;
    }

    if (selectedType !== 'all') {
      filterObj.types = [selectedType];
    }

    return filterObj;
  }, [fromDate, toDate, selectedProduct, selectedType, defaultFromDate, defaultToDate]);

  // Fetch stock movements
  const { data, loading, error, refetch } = useStockMovements({
    warehouseId: warehouseId || '',
    filters,
  });

  const movements: StockMovement[] = data?.stockMovements?.items || [];
  const stock: WarehouseStockItem[] = stockData?.stockByWarehouse ?? [];

  // Calculate stats
  const totalMovements = movements.length;
  const stockIn = movements.filter((m) =>
    [
      MovementType.OPENING,
      MovementType.ADJUSTMENT_IN,
      MovementType.IN,
      MovementType.TRANSFER_IN,
    ].includes(m.type),
  ).length;
  const stockOut = movements.filter((m) =>
    [MovementType.ADJUSTMENT_OUT, MovementType.OUT, MovementType.TRANSFER_OUT].includes(m.type),
  ).length;

  // Count active filters
  const activeFilterCount = [
    fromDate,
    toDate,
    selectedProduct !== 'all',
    selectedType !== 'all',
  ].filter(Boolean).length;

  // Clear all filters
  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedProduct('all');
    setSelectedType('all');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground mt-2">
            Track all stock in/out transactions for {warehouseName || 'this warehouse'}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMovements}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeFilterCount > 0 ? 'Filtered results' : 'All time'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stockIn}</div>
              <p className="text-xs text-muted-foreground mt-1">Opening, Adjustments, Receipts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stockOut}</div>
              <p className="text-xs text-muted-foreground mt-1">Adjustments, Transfers</p>
            </CardContent>
          </Card>
        </div>

        {/* Movement Log with Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">{activeFilterCount} active</Badge>
                )}
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Date Range - From */}
              <div className="space-y-2">
                <Label htmlFor="fromDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  From Date
                </Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  max={toDate || undefined}
                />
              </div>

              {/* Date Range - To */}
              <div className="space-y-2">
                <Label htmlFor="toDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  To Date
                </Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  min={fromDate || undefined}
                />
              </div>

              {/* Product Filter */}
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {stock.map((item) => (
                      <SelectItem key={item.product.id} value={item.product.id}>
                        <span className="truncate">
                          {item.product.name} ({item.product.sku})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Movement Type Filter */}
              <div className="space-y-2">
                <Label>Movement Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="OPENING">Opening Stock</SelectItem>
                    <SelectItem value="IN">Stock In (GRN)</SelectItem>
                    <SelectItem value="OUT">Stock Out (Issue)</SelectItem>
                    <SelectItem value="ADJUSTMENT_IN">Adjustment In</SelectItem>
                    <SelectItem value="ADJUSTMENT_OUT">Adjustment Out</SelectItem>
                    <SelectItem value="TRANSFER_IN">Transfer In</SelectItem>
                    <SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table Content */}
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Loading movements...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load stock movements. {error.message}
                  <button onClick={() => refetch()} className="ml-2 underline font-medium">
                    Retry
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {/* Empty State */}
            {!loading && !error && movements.length === 0 && (
              <div className="text-center py-12">
                <ArrowUpDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No movements found</h3>
                <p className="text-muted-foreground">
                  Stock movements will appear here when you post GRNs, transfers, issues, or make
                  adjustments.
                </p>
              </div>
            )}

            {/* Table */}
            {!loading && !error && movements.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity Change</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => {
                      const { date, time } = formatDateTime(movement.createdAt);
                      const userName = movement.performedBy || 'System';
                      const direction = getMovementDirection(movement.type);
                      const sourceLabel = formatSourceLabel(movement.referenceType);

                      return (
                        <TableRow key={movement.id}>
                          <TableCell className="font-mono text-sm">
                            <div>{date}</div>
                            <div className="text-xs text-muted-foreground">{time}</div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>{movement.productName}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="font-mono">{movement.sku}</span>
                              <CopyButton
                                value={movement.sku}
                                ariaLabel="Copy SKU"
                                successMessage="Copied SKU to clipboard"
                                className="h-6 w-6 text-muted-foreground"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant={getDirectionBadgeVariant(direction)}>
                                {direction === 'NEUTRAL'
                                  ? movement.type.replace(/_/g, ' ')
                                  : direction}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{sourceLabel}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <QuantityDelta quantity={movement.quantity} direction={direction} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {userName}
                            {movement.userRole && (
                              <div className="text-xs text-muted-foreground">
                                {movement.userRole}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {movement.reason ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="block w-full text-left truncate text-sm text-muted-foreground hover:underline"
                                    title={movement.reason ?? undefined}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {movement.reason}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-80 max-w-[90vw]"
                                  align="start"
                                  onOpenAutoFocus={(e) => e.preventDefault()}
                                >
                                  <div className="text-sm whitespace-pre-wrap break-words">
                                    {movement.reason}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
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

export default function StockMovementsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <StockMovementsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
