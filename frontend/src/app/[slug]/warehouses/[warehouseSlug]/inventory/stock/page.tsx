'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import CompanyGuard from '@/components/CompanyGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Search, Package, PackagePlus, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { GET_WAREHOUSE_STOCK } from '@/lib/graphql/inventory';
import { GET_CATEGORIES } from '@/lib/graphql/catalog';
import { GET_WAREHOUSES_BY_COMPANY } from '@/lib/graphql/company';
import OpeningStockModal from '@/components/inventory/OpeningStockModal';
import StockDrawer from '@/components/inventory/StockDrawer';
import { LotBreakdownModal } from '@/components/inventory/LotBreakdownModal';
import { ExpiryStatusBadge } from '@/components/inventory/ExpiryStatusBadge';
import { getNearestExpiryDate, getProductExpiryStatus, getDaysUntilExpiry } from '@/lib/utils/expiry';
import { format } from 'date-fns';
import { GET_WAREHOUSE_STOCK_HEALTH, WarehouseStockHealth } from '@/lib/graphql/stock-health';
import { StockHealthBadge } from '@/components/inventory/stock-health-badge';

function StockPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const companySlug = params.slug as string;
  const warehouseSlug = params.warehouseSlug as string;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isOpeningStockModalOpen, setIsOpeningStockModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lotBreakdownProduct, setLotBreakdownProduct] = useState<any>(null);
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);

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

  const { data: stockData, loading, error, refetch } = useQuery(GET_WAREHOUSE_STOCK, {
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

  const stock = stockData?.stockByWarehouse || [];
  const categories = categoriesData?.categories || [];

  // Create stock health lookup map
  const stockHealthMap = new Map<string, WarehouseStockHealth>();
  if (stockHealthData?.warehouseStockHealth) {
    stockHealthData.warehouseStockHealth.forEach((health: WarehouseStockHealth) => {
      stockHealthMap.set(health.productId, health);
    });
  }

  // Auto-open drawer if stockId is in URL query params
  useEffect(() => {
    const stockIdParam = searchParams.get('stockId');
    if (stockIdParam && stock.length > 0) {
      const stockItem = stock.find((item: any) => item.id === stockIdParam);
      if (stockItem) {
        setSelectedStock(stockItem);
        setIsDrawerOpen(true);
      }
    }
  }, [searchParams, stock]);

  // Filter stock
  const filteredStock = stock.filter((item: any) => {
    const matchesSearch =
      searchTerm === '' ||
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || item.product.category?.id === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalQuantity = stock.reduce((sum: number, item: any) => sum + parseFloat(item.quantity || 0), 0);
  const lowStockCount = stock.filter((item: any) =>
    item.reorder_point && parseFloat(item.quantity) <= parseFloat(item.reorder_point)
  ).length;

  const handleViewStock = (stockItem: any) => {
    setSelectedStock(stockItem);
    setIsDrawerOpen(true);
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
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Stock Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage product quantities in this warehouse
              </p>
            </div>
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
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6">
                <PackagePlus className="h-12 w-12 text-slate-400" />
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
            {/* Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stock.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(totalQuantity)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lowStockCount}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Stock Table */}
            <Card>
              <CardHeader>
                <CardTitle>Stock ({filteredStock.length})</CardTitle>
              </CardHeader>
              <CardContent>
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
                        <TableHead>Nearest Expiry</TableHead>
                        <TableHead>Expiry Status</TableHead>
                        <TableHead>Stock Status</TableHead>
                        <TableHead>Stock Health</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStock.map((item: any) => {
                        const quantity = parseFloat(item.quantity);
                        const isOutOfStock = quantity === 0;
                        const isLowStock = !isOutOfStock && item.reorder_point && quantity <= parseFloat(item.reorder_point);
                        const nearestExpiry = isOutOfStock ? null : getNearestExpiryDate(item.lots || []);
                        const expiryStatus = isOutOfStock ? 'NO_EXPIRY' : getProductExpiryStatus(item.lots || []);
                        const daysRemaining = getDaysUntilExpiry(nearestExpiry);
                        
                        return (
                          <TableRow
                            key={item.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleViewStock(item)}
                          >
                            <TableCell className="font-mono text-sm">{item.product.sku}</TableCell>
                            <TableCell className="font-medium">{item.product.name}</TableCell>
                            <TableCell>{item.product.category?.name || '—'}</TableCell>
                            <TableCell className="font-mono text-sm">{item.product.unit}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {Math.round(quantity)}
                            </TableCell>
                            <TableCell
                              className="text-sm cursor-pointer hover:underline"
                              onClick={(e) => {
                                if (!isOutOfStock) {
                                  e.stopPropagation();
                                  setLotBreakdownProduct(item);
                                  setIsLotModalOpen(true);
                                }
                              }}
                            >
                              {isOutOfStock
                                ? '—'
                                : (nearestExpiry ? format(new Date(nearestExpiry), 'dd MMM yyyy') : '—')}
                            </TableCell>
                            <TableCell>
                              {isOutOfStock ? (
                                <span className="text-muted-foreground text-sm">—</span>
                              ) : (
                                <ExpiryStatusBadge status={expiryStatus} daysRemaining={daysRemaining} />
                              )}
                            </TableCell>
                            <TableCell>
                              {isOutOfStock ? (
                                <Badge variant="secondary">Out of Stock</Badge>
                              ) : isLowStock ? (
                                <Badge variant="destructive">Low Stock</Badge>
                              ) : (
                                <Badge variant="default">In Stock</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const health = stockHealthMap.get(item.product_id);
                                if (!health) return <span className="text-muted-foreground text-sm">—</span>;
                                return <StockHealthBadge state={health.state} recommendation={health.recommendation} />;
                              })()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
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
        />
      )}

      {isLotModalOpen && lotBreakdownProduct && (
        <LotBreakdownModal
          isOpen={isLotModalOpen}
          onClose={() => {
            setIsLotModalOpen(false);
            setLotBreakdownProduct(null);
          }}
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
