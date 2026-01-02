'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Loader2, AlertCircle, Filter, X, Calendar } from 'lucide-react';
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
import { GET_STOCK_MOVEMENTS, GET_STOCK_BY_WAREHOUSE } from '@/lib/graphql/stock';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { GET_WAREHOUSES_BY_COMPANY } from '@/lib/graphql/company';

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
  previous_quantity: number;
  new_quantity: number;
  reason?: string;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  warehouse: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    fullName: string;
  };
}

// Helper function to get badge variant for movement type
function getMovementBadgeVariant(type: MovementType): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (type) {
    case MovementType.OPENING:
    case MovementType.ADJUSTMENT_IN:
    case MovementType.IN:
    case MovementType.TRANSFER_IN:
      return 'default'; // Green/Blue for incoming
    case MovementType.ADJUSTMENT_OUT:
    case MovementType.OUT:
    case MovementType.TRANSFER_OUT:
      return 'destructive'; // Red for outgoing
    default:
      return 'secondary';
  }
}

// Helper function to format quantity with sign and color
function QuantityDelta({ quantity }: { quantity: number }) {
  const isPositive = quantity > 0;
  const isNegative = quantity < 0;
  
  return (
    <span className={`font-mono font-semibold ${
      isPositive ? 'text-green-600 dark:text-green-400' : 
      isNegative ? 'text-red-600 dark:text-red-400' : 
      'text-slate-600 dark:text-slate-400'
    }`}>
      {isPositive ? '+' : ''}{quantity}
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
      year: 'numeric'
    }),
    time: date.toLocaleTimeString('en-IN', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    })
  };
}

function StockMovementsContent() {
  const params = useParams();
  const { user } = useAuth();
  const companySlug = params.slug as string;
  const warehouseSlug = params.warehouseSlug as string;

  // Filter state
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Get warehouse ID from context or user data
  const activeWarehouse = user?.warehouses?.find(
    (w: any) => w.warehouseSlug === warehouseSlug
  );
  
  // Get role from active company
  const activeCompany = user?.companies?.find(c => c.id === user.activeCompanyId);
  const userRole = activeCompany?.role;
  
  // For OWNER/ADMIN, fetch all company warehouses as fallback
  const { data: companyData } = useQuery(GET_WAREHOUSES_BY_COMPANY, {
    variables: { slug: companySlug },
    skip: !companySlug || !!activeWarehouse || !['OWNER', 'ADMIN'].includes(userRole || ''),
  });

  // Try to get warehouse from company data if not in user.warehouses
  const warehouseFromCompany = companyData?.companyBySlug?.warehouses?.find(
    (w: any) => w.slug === warehouseSlug
  );
  
  const warehouseId = activeWarehouse?.warehouseId || warehouseFromCompany?.id;
  const warehouseName = activeWarehouse?.warehouseName || warehouseFromCompany?.name;

  // Fetch stock for product filter
  const { data: stockData } = useQuery(GET_STOCK_BY_WAREHOUSE, {
    variables: { warehouseId: warehouseId || '' },
    skip: !warehouseId,
  });

  // Build filter object for GraphQL query
  const filters: any = {
    warehouse_id: warehouseId,
    limit: 100,
    offset: 0,
  };

  if (selectedProduct !== 'all') {
    filters.product_id = selectedProduct;
  }

  if (selectedType !== 'all') {
    filters.type = selectedType;
  }

  if (fromDate) {
    filters.from_date = new Date(fromDate).toISOString();
  }

  if (toDate) {
    // Set to end of day
    const endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);
    filters.to_date = endOfDay.toISOString();
  }

  // Fetch stock movements
  const { data, loading, error, refetch } = useQuery(GET_STOCK_MOVEMENTS, {
    variables: { filters },
    skip: !warehouseId,
  });

  const movements: StockMovement[] = data?.stockMovements || [];
  const stock = stockData?.stockByWarehouse || [];

  // Calculate stats
  const totalMovements = movements.length;
  const stockIn = movements.filter(m => 
    [MovementType.OPENING, MovementType.ADJUSTMENT_IN, MovementType.IN, MovementType.TRANSFER_IN].includes(m.type)
  ).length;
  const stockOut = movements.filter(m => 
    [MovementType.ADJUSTMENT_OUT, MovementType.OUT, MovementType.TRANSFER_OUT].includes(m.type)
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Stock Movements</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filters</CardTitle>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">{activeFilterCount} active</Badge>
                )}
              </div>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
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
                  <SelectTrigger>
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {stock.map((item: any) => (
                      <SelectItem key={item.product.id} value={item.product.id}>
                        {item.product.name} ({item.product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Movement Type Filter */}
              <div className="space-y-2">
                <Label>Movement Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="OPENING">Opening Stock</SelectItem>
                    <SelectItem value="ADJUSTMENT_IN">Adjustment In</SelectItem>
                    <SelectItem value="ADJUSTMENT_OUT">Adjustment Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Movement Log */}
        <Card>
          <CardHeader>
            <CardTitle>Movement Log</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <span className="ml-3 text-slate-600 dark:text-slate-400">Loading movements...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load stock movements. {error.message}
                  <button 
                    onClick={() => refetch()}
                    className="ml-2 underline font-medium"
                  >
                    Retry
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {/* Empty State */}
            {!loading && !error && movements.length === 0 && (
              <div className="text-center py-12">
                <ArrowUpDown className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No movements found
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Stock movements will appear here when you add opening stock or make adjustments.
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
                      const { date, time } = formatDateTime(movement.created_at);
                      const userName = movement.user?.fullName || 'System';

                      return (
                        <TableRow key={movement.id}>
                          <TableCell className="font-mono text-sm">
                            <div>{date}</div>
                            <div className="text-xs text-slate-500">{time}</div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>{movement.product.name}</div>
                            <div className="text-xs text-slate-500">{movement.product.sku}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getMovementBadgeVariant(movement.type)}>
                              {movement.type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <QuantityDelta quantity={movement.quantity} />
                            <div className="text-xs text-slate-500 mt-1">
                              {movement.previous_quantity} → {movement.new_quantity}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            {userName}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={movement.notes || movement.reason}>
                            {movement.notes || movement.reason || '-'}
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
