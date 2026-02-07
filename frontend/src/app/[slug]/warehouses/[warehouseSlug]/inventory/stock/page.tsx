'use client';

import React from 'react';
import { useQuery } from '@apollo/client';
import { useParams, useSearchParams } from 'next/navigation';
import CompanyGuard from '@/components/CompanyGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/common/CopyButton';
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
import { Plus, Search, Package, PackagePlus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { GET_WAREHOUSE_STOCK } from '@/lib/graphql/inventory';
import { GET_CATEGORIES } from '@/lib/graphql/catalog';
import { GET_WAREHOUSES_BY_COMPANY } from '@/lib/graphql/company';
import OpeningStockModal from '@/components/inventory/OpeningStockModal';
import StockDrawer from '@/components/inventory/StockDrawer';
import { LotBreakdownModal } from '@/components/inventory/LotBreakdownModal';
import { ExpiryStatusBadge } from '@/components/inventory/ExpiryStatusBadge';
import {
  getNearestExpiryDate,
  getProductExpiryStatus,
  getDaysUntilExpiry,
} from '@/lib/utils/expiry';
import type { LotWithExpiry } from '@/lib/utils/expiry';
import { format } from 'date-fns';
import { GET_WAREHOUSE_STOCK_HEALTH, WarehouseStockHealth } from '@/lib/graphql/stock-health';
import { StockHealthBadge } from '@/components/inventory/stock-health-badge';

type Category = { id: string; name: string };

type StockLot = {
  id: string;
  quantity: string | number;
  expiry_date?: string | null;
  received_at?: string | null;
};

type StockItem = {
  id: string;
  quantity: string | number;
  min_stock_level?: number | null;
  max_stock_level?: number | null;
  reorder_point?: string | number | null;
  created_at: string;
  updated_at: string;
  warehouse: {
    id: string;
    name: string;
  };
  lots?: StockLot[] | null;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    category?: Category | null;
  };
};

type StockItemWithConvertedLots = Omit<StockItem, 'lots'> & {
  lots: LotWithExpiry[];
};

function StockPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const companySlug = params.slug as string;
  const warehouseSlug = params.warehouseSlug as string;

  const [searchTerm, setSearchTerm] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [isOpeningStockModalOpen, setIsOpeningStockModalOpen] = React.useState(false);
  const [selectedStock, setSelectedStock] = React.useState<StockItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [lotBreakdownProduct, setLotBreakdownProduct] = React.useState<StockItemWithConvertedLots | null>(null);
  const [isLotModalOpen, setIsLotModalOpen] = React.useState(false);

  // Get warehouse ID from context or user data
  const activeWarehouse = user?.warehouses?.find(
    (w: { warehouseSlug: string; warehouseId: string }) => w.warehouseSlug === warehouseSlug,
  );

  // Get role from active company
  const activeCompany = user?.companies?.find((c) => c.id === user.activeCompanyId);
  const userRole = activeCompany?.role;

  // For OWNER/ADMIN, fetch all company warehouses as fallback
  const { data: companyData } = useQuery(GET_WAREHOUSES_BY_COMPANY, {
    variables: { slug: companySlug },
    skip: !companySlug || !!activeWarehouse || !['OWNER', 'ADMIN'].includes(userRole || ''),
  });

  // Try to get warehouse from company data if not in user.warehouses
  const warehouseFromCompany = companyData?.companyBySlug?.warehouses?.find(
    (w: { id: string; slug: string }) => w.slug === warehouseSlug,
  );

  const warehouseId = activeWarehouse?.warehouseId || warehouseFromCompany?.id;

  const {
    data: stockData,
    loading,
    error,
    refetch,
  } = useQuery(GET_WAREHOUSE_STOCK, {
    variables: { warehouseId: warehouseId || '' },
    skip: !warehouseId,
  });

  const { data: categoriesData } = useQuery(GET_CATEGORIES);

  // Get stock health data
  const { data: stockHealthData } = useQuery(GET_WAREHOUSE_STOCK_HEALTH, {
    variables: { warehouseId: warehouseId || '' },
    skip: !warehouseId,
  });

  const canModifyStock = userRole ? ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole) : false;

  const stock = React.useMemo(() => {
    return (stockData?.stockByWarehouse ?? []) as StockItem[];
  }, [stockData?.stockByWarehouse]);

  const categories = (categoriesData?.categories ?? []) as Category[];

  // Create stock health lookup map
  const stockHealthMap = new Map<string, WarehouseStockHealth>();
  if (stockHealthData?.warehouseStockHealth) {
    stockHealthData.warehouseStockHealth.forEach((health: WarehouseStockHealth) => {
      stockHealthMap.set(health.productId, health);
    });
  }

  // Auto-open drawer if stockId is in URL query params
  React.useEffect(() => {
    const stockIdParam = searchParams.get('stockId');
    if (stockIdParam && stock.length > 0) {
      const stockItem = stock.find((item) => item.id === stockIdParam);
      if (stockItem) {
        setSelectedStock(stockItem);
        setIsDrawerOpen(true);
      }
    }
  }, [searchParams, stock]);

  // Filter stock
  const filteredStock = stock.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || item.product.category?.id === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalQuantity = stock.reduce((sum, item) => {
    const q = Number.parseFloat(String(item.quantity ?? 0));
    return sum + (Number.isFinite(q) ? q : 0);
  }, 0);

  const lowStockCount = stock.filter((item) => {
    if (item.reorder_point == null) return false;
    const reorder = Number.parseFloat(String(item.reorder_point));
    const qty = Number.parseFloat(String(item.quantity ?? 0));
    if (!Number.isFinite(reorder) || !Number.isFinite(qty)) return false;
    return qty <= reorder;
  }).length;

  const handleViewStock = (stockItem: StockItem) => {
    setSelectedStock(stockItem);
    setIsDrawerOpen(true);
  };

  const handleViewLots = (stockItem: StockItem) => {
    // Convert StockLot[] to LotWithExpiry[] for the modal
    const convertedItem: StockItemWithConvertedLots = {
      ...stockItem,
      lots: (stockItem.lots ?? []).map((lot) => ({
        id: lot.id,
        quantity:
          typeof lot.quantity === 'string' ? Number.parseFloat(lot.quantity) : lot.quantity,
        expiry_date: lot.expiry_date ?? null,
        received_at: lot.received_at ?? '',
      })),
    };
    setLotBreakdownProduct(convertedItem);
    setIsLotModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading stock...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Package className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Failed to load stock</p>
        </div>
      </div>
    );
  }

  const isEmpty = stock.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Stock</h1>
            {canModifyStock && !isEmpty && (
              <Button className="gap-2" onClick={() => setIsOpeningStockModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Opening Stock
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {isEmpty ? (
          /* Empty State */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="rounded-full bg-muted p-6">
                <PackagePlus className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">No stock yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {canModifyStock
                    ? 'Get started by adding opening stock for products in this warehouse.'
                    : 'Stock will appear here once a manager adds it.'}
                </p>
              </div>
              {canModifyStock && (
                <Button onClick={() => setIsOpeningStockModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Opening Stock
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stock Table */}
            <Card>
              <CardContent>
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by product name or SKU..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{stock.length} products</span>
                  <span>•</span>
                  <span>{Math.round(totalQuantity)} total units</span>
                  <span>•</span>
                  <span>{lowStockCount} low stock</span>
                </div>

                <div className="mt-6">
                  {filteredStock.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No stock matches your filters
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>Lots</TableHead>
                          <TableHead>Nearest Expiry</TableHead>
                          <TableHead>Expiry Status</TableHead>
                          <TableHead>Stock Status</TableHead>
                          <TableHead>Stock Health</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStock.map((item) => {
                          const quantity = Number.parseFloat(String(item.quantity ?? 0));
                          const isOutOfStock = quantity === 0;
                          const isLowStock =
                            !isOutOfStock &&
                            item.reorder_point != null &&
                            String(item.reorder_point).trim() !== '' &&
                            quantity <= Number.parseFloat(String(item.reorder_point));

                          const lotsForExpiry: LotWithExpiry[] = (item.lots ?? []).map((lot) => ({
                            id: lot.id,
                            quantity:
                              typeof lot.quantity === 'string'
                                ? Number.parseFloat(lot.quantity)
                                : lot.quantity,
                            expiry_date: lot.expiry_date ?? null,
                            received_at: lot.received_at ?? '',
                          }));

                          const nearestExpiry = isOutOfStock
                            ? null
                            : getNearestExpiryDate(lotsForExpiry);
                          const expiryStatus = isOutOfStock
                            ? 'NO_EXPIRY'
                            : getProductExpiryStatus(lotsForExpiry);
                          const daysRemaining = getDaysUntilExpiry(nearestExpiry);

                          return (
                            <TableRow
                              key={item.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleViewStock(item)}
                            >
                              <TableCell className="font-mono text-sm">
                                <div
                                  className="flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{item.product.sku}</span>
                                  <CopyButton
                                    value={item.product.sku}
                                    ariaLabel="Copy SKU"
                                    successMessage="Copied SKU to clipboard"
                                    className="h-7 w-7 text-muted-foreground"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{item.product.name}</TableCell>
                              <TableCell>{item.product.category?.name || '—'}</TableCell>
                              <TableCell className="font-mono text-sm">
                                {item.product.unit}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {Math.round(quantity)}
                              </TableCell>
                              <TableCell>
                                {isOutOfStock ? (
                                  <span className="text-muted-foreground text-sm">—</span>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    disabled={(item.lots?.length ?? 0) === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewLots(item);
                                    }}
                                  >
                                    View ({item.lots?.length ?? 0})
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {isOutOfStock
                                  ? '—'
                                  : nearestExpiry
                                    ? format(new Date(nearestExpiry), 'dd MMM yyyy')
                                    : '—'}
                              </TableCell>
                              <TableCell>
                                {isOutOfStock ? (
                                  <span className="text-muted-foreground text-sm">—</span>
                                ) : (
                                  <ExpiryStatusBadge
                                    status={expiryStatus}
                                    daysRemaining={daysRemaining}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {isOutOfStock ? (
                                  <Badge
                                    variant="outline"
                                    className="border-border/50 bg-muted text-muted-foreground dark:text-foreground/80"
                                  >
                                    Out of Stock
                                  </Badge>
                                ) : isLowStock ? (
                                  <Badge
                                    variant="outline"
                                    className="border-destructive/30 bg-destructive/10 text-destructive dark:text-foreground"
                                  >
                                    Low Stock
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-primary/30 bg-primary/10 text-primary dark:text-foreground"
                                  >
                                    In Stock
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const health = stockHealthMap.get(item.product.id);
                                  if (!health)
                                    return <span className="text-muted-foreground text-sm">—</span>;
                                  return (
                                    <StockHealthBadge
                                      state={health.state}
                                      recommendation={health.recommendation}
                                    />
                                  );
                                })()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Modals */}
      {isOpeningStockModalOpen && warehouseId && (
        <OpeningStockModal
          warehouseId={warehouseId}
          open={isOpeningStockModalOpen}
          onClose={() => {
            setIsOpeningStockModalOpen(false);
            refetch();
          }}
        />
      )}

      {isDrawerOpen && selectedStock && (
        <StockDrawer
          stock={selectedStock}
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedStock(null);
            refetch();
          }}
          canModify={canModifyStock}
          companySlug={companySlug}
          warehouseSlug={warehouseSlug}
        />
      )}

      {isLotModalOpen && lotBreakdownProduct && (
        <LotBreakdownModal
          isOpen={isLotModalOpen}
          onClose={() => {
            setIsLotModalOpen(false);
            setLotBreakdownProduct(null);
          }}
          productId={lotBreakdownProduct.product.id}
          warehouseId={warehouseId}
          companySlug={companySlug}
          warehouseSlug={warehouseSlug}
          productName={lotBreakdownProduct.product.name}
          productSku={lotBreakdownProduct.product.sku}
          lots={lotBreakdownProduct.lots || []}
        />
      )}
    </div>
  );
}

export default function StockPage() {
  return (
    <CompanyGuard>
      <StockPageContent />
    </CompanyGuard>
  );
}
