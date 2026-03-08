'use client';

import { useState } from 'react';
import { useWarehouseStock, useCategories } from '@/hooks/apollo';
import { useParams } from 'next/navigation';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/common/CopyButton';
import { Search, Package } from 'lucide-react';
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
import { useAuth } from '@/context/auth-context';

function WarehouseProductsContent() {
  const params = useParams();
  const { user } = useAuth();
  const warehouseSlug = params.warehouseSlug as string;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Get warehouse ID from user context
  const activeWarehouse = user?.warehouses?.find((w: any) => w.warehouseSlug === warehouseSlug);
  const warehouseId = activeWarehouse?.warehouseId;

  // Fetch warehouse stock (includes product details via joins)
  const { data: stockData, loading: stockLoading } = useWarehouseStock(warehouseId || '');

  // Fetch categories for filter
  const { data: categoriesData } = useCategories();

  const warehouseStock = stockData?.stockByWarehouse || [];
  const categories = categoriesData?.categories || [];

  // Filter products
  const filteredStock = warehouseStock.filter((stockItem: any) => {
    const product = stockItem.product;
    const matchesSearch =
      searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || product.category?.id === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalProducts = warehouseStock.length;
  const inStockCount = warehouseStock.filter((item: any) => parseFloat(item.quantity) > 0).length;
  const lowStockCount = warehouseStock.filter((item: any) => {
    const qty = parseFloat(item.quantity);
    return item.reorder_point && qty > 0 && qty <= parseFloat(item.reorder_point);
  }).length;

  const getStockStatus = (stockItem: any) => {
    const qty = parseFloat(stockItem.quantity);
    if (qty === 0) return 'out_of_stock';
    if (stockItem.reorder_point && qty <= parseFloat(stockItem.reorder_point)) {
      return 'low_stock';
    }
    return 'in_stock';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="default">In Stock</Badge>;
      case 'low_stock':
        return <Badge variant="destructive">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="outline">Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">—</Badge>;
    }
  };

  if (stockLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Warehouse Products</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Products stocked in this warehouse
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{inStockCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search products by name or SKU..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({filteredStock.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStock.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || categoryFilter !== 'all'
                  ? 'No products match your filters'
                  : 'No products stocked in this warehouse yet'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((stockItem: any) => {
                    const product = stockItem.product;
                    const status = getStockStatus(stockItem);
                    return (
                      <TableRow key={stockItem.id}>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-1">
                            <span>{product.sku}</span>
                            <CopyButton
                              value={product.sku}
                              ariaLabel="Copy SKU"
                              successMessage="Copied SKU to clipboard"
                              className="h-7 w-7 text-muted-foreground"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category?.name || '—'}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {parseFloat(stockItem.quantity).toFixed(2)} {product.unit}
                        </TableCell>
                        <TableCell>{getStatusBadge(status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function WarehouseProductsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <WarehouseProductsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
