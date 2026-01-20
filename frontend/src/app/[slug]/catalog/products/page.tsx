'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import CompanyGuard from '@/components/CompanyGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Search, Edit, Archive, Package, PackagePlus, FileDown } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  GET_PRODUCTS,
  GET_CATEGORIES,
  GET_SUPPLIERS,
  DELETE_PRODUCT,
  UPDATE_PRODUCT,
} from '@/lib/graphql/catalog';
import ProductModal from '@/components/catalog/ProductModal';
import ProductDetailDrawer from '@/components/catalog/ProductDetailDrawer';
import { BulkEntryModal } from '@/components/catalog/BulkEntryModal';
import { GenerateBarcodeLabelsButton } from '@/components/barcode/GenerateBarcodeLabelsButton';

function CatalogProductsContent() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBulkEntryOpen, setIsBulkEntryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [productToArchive, setProductToArchive] = useState<any>(null);
  const { toast } = useToast();

  const { data: productsData, loading, error, refetch } = useQuery(GET_PRODUCTS);
  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const { data: suppliersData } = useQuery(GET_SUPPLIERS);

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    onCompleted: () => {
      toast({
        title: 'Product archived',
        description: 'Product has been archived successfully',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [updateProduct] = useMutation(UPDATE_PRODUCT, {
    onCompleted: () => {
      toast({
        title: 'Product unarchived',
        description: 'Product has been restored successfully',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get role from active company (role is company-specific)
  const activeCompany = user?.companies?.find((c) => c.id === user.activeCompanyId);
  const userRole = activeCompany?.role;

  const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN';
  const canEdit = isOwnerOrAdmin || userRole === 'MANAGER'; // TODO: Check restrict_manager_catalog setting
  const canDelete = isOwnerOrAdmin;

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];
  const suppliers = suppliersData?.suppliers || [];

  // Filter products
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch =
      searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || product.category?.id === categoryFilter;

    const matchesSupplier = supplierFilter === 'all' || product.supplier?.id === supplierFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'archived' && !product.is_active);

    return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
  });

  const activeProducts = products.filter((p: any) => p.is_active).length;

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setIsDetailDrawerOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleModalClose = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
    refetch();
  };

  const handleArchiveProduct = (product: any) => {
    setProductToArchive(product);
  };

  const confirmArchive = async () => {
    if (productToArchive) {
      await deleteProduct({ variables: { id: productToArchive.id } });
      setProductToArchive(null);
    }
  };

  const handleUnarchiveProduct = async (product: any) => {
    // Backend updateProduct automatically sets is_active=true
    await updateProduct({
      variables: {
        input: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          unit: product.unit, // Unit is already a string ID in the product object
          cost_price: product.cost_price,
          selling_price: product.selling_price,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Package className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Failed to load products</p>
        </div>
      </div>
    );
  }

  const isEmpty = products.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Products
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage company-wide product definitions and pricing
              </p>
            </div>
            {!isEmpty && (
              <div className="flex items-center gap-2">
                {isOwnerOrAdmin && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setIsBulkEntryOpen(true)}
                  >
                    <PackagePlus className="h-4 w-4" />
                    Bulk Add Products
                  </Button>
                )}
                {canEdit && (
                  <Button className="gap-2" onClick={handleAddProduct}>
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                )}
              </div>
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
                <h3 className="text-lg font-semibold">No products yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {canEdit
                    ? 'Get started by adding your first product to the catalog.'
                    : 'Products will appear here once an admin adds them.'}
                </p>
              </div>
              {canEdit && (
                <div className="flex items-center gap-2">
                  {isOwnerOrAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => setIsBulkEntryOpen(true)}
                      className="gap-2"
                    >
                      <PackagePlus className="h-4 w-4" />
                      Bulk Add Products
                    </Button>
                  )}
                  <Button onClick={handleAddProduct} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add your first product
                  </Button>
                </div>
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
                  <div className="text-2xl font-bold">{products.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeProducts}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Archived</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products.length - activeProducts}</div>
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
                        placeholder="Search by name, SKU, or barcode..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
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
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="All Suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      {suppliers.map((sup: any) => (
                        <SelectItem key={sup.id} value={sup.id}>
                          {sup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Products Table */}
            <Card>
              <CardHeader>
                <CardTitle>Products ({filteredProducts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No products match your filters
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Cost Price</TableHead>
                        <TableHead>Selling Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Label</TableHead>
                        {canEdit && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product: any) => (
                        <TableRow
                          key={product.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewProduct(product)}
                        >
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category?.name || '—'}</TableCell>
                          <TableCell>{product.supplier?.name || '—'}</TableCell>
                          <TableCell className="font-mono text-sm">{product.unit}</TableCell>
                          <TableCell>
                            {product.cost_price
                              ? `₹${parseFloat(product.cost_price).toFixed(2)}`
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {product.selling_price
                              ? `₹${parseFloat(product.selling_price).toFixed(2)}`
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? 'default' : 'secondary'}>
                              {product.is_active ? 'Active' : 'Archived'}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {product.barcode ? (
                              <GenerateBarcodeLabelsButton
                                productIds={[product.id]}
                                filename={`barcode-label_${product.sku || product.id}.pdf`}
                                variant="ghost"
                                size="icon"
                              >
                                <FileDown className="h-4 w-4" />
                              </GenerateBarcodeLabelsButton>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {canDelete && product.is_active && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleArchiveProduct(product)}
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                )}
                                {canDelete && !product.is_active && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleUnarchiveProduct(product)}
                                    title="Restore product"
                                  >
                                    <Archive className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Modals */}
      <BulkEntryModal
        open={isBulkEntryOpen}
        onOpenChange={setIsBulkEntryOpen}
        type="products"
        onCompleted={() => refetch()}
      />

      {isProductModalOpen && (
        <ProductModal
          product={selectedProduct}
          open={isProductModalOpen}
          onClose={handleModalClose}
        />
      )}

      {isDetailDrawerOpen && selectedProduct && (
        <ProductDetailDrawer
          product={selectedProduct}
          open={isDetailDrawerOpen}
          onClose={() => {
            setIsDetailDrawerOpen(false);
            setSelectedProduct(null);
          }}
          onEdit={
            canEdit
              ? () => {
                  setIsDetailDrawerOpen(false);
                  handleEditProduct(selectedProduct);
                }
              : undefined
          }
        />
      )}

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!productToArchive} onOpenChange={() => setProductToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive <strong>{productToArchive?.name}</strong>? This
              product will be moved to the archived list and won't appear in active searches. You
              can restore it later by filtering for archived products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>Archive Product</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CatalogProductsPage() {
  return (
    <CompanyGuard>
      <CatalogProductsContent />
    </CompanyGuard>
  );
}
