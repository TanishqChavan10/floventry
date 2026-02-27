'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import CompanyGuard from '@/components/CompanyGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CopyButton } from '@/components/common/CopyButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Plus,
  Search,
  Edit,
  Archive,
  Package,
  PackagePlus,
  FileDown,
  Printer,
  Copy,
  MoreHorizontal,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { useAuth } from '@/context/auth-context';
import { useRbac } from '@/hooks/use-rbac';
import RoleGuard from '@/components/guards/role-guard';
import {
  GET_PRODUCTS_PAGINATED,
  GET_CATEGORIES,
  GET_SUPPLIERS,
  DELETE_PRODUCT,
  UPDATE_PRODUCT,
} from '@/lib/graphql/catalog';
import ProductModal from '@/components/catalog/ProductModal';
import ProductDetailDrawer from '@/components/catalog/ProductDetailDrawer';
import { BulkEntryModal } from '@/components/catalog/BulkEntryModal';
import { downloadBarcodesCsv } from '@/lib/api/barcodes-export';
import {
  copyThermalLabelsZplToClipboard,
  downloadThermalLabelsZpl,
} from '@/lib/api/thermal-labels';
import { GENERATE_BARCODE_LABELS } from '@/lib/graphql/barcode';

function CatalogProductsContent() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
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
  const [downloadingLabelForId, setDownloadingLabelForId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const pageSize = 50;
  const { toast } = useToast();

  // Debounce search input for server-side search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: productsData, loading, error, refetch } = useQuery(GET_PRODUCTS_PAGINATED, {
    variables: {
      pagination: {
        page: currentPage,
        limit: pageSize,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      },
    },
  });
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

  const [generateBarcodeLabels] = useMutation(GENERATE_BARCODE_LABELS);

  const handleDownloadBarcodeLabelPdf = async (product: any) => {
    if (!product?.id) return;
    if (!product?.barcode) {
      toast({
        title: 'No barcode',
        description: 'This product has no barcode to print',
        variant: 'destructive',
      });
      return;
    }

    setDownloadingLabelForId(product.id);
    try {
      const { data } = await generateBarcodeLabels({
        variables: {
          input: {
            productIds: [product.id],
          },
        },
      });

      const payload = (data as any)?.generateBarcodeLabels;
      const base64Data = payload?.pdfData as string | undefined;
      if (!base64Data) throw new Error('No PDF data returned');

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const filename =
        typeof payload?.filename === 'string' && payload.filename.trim()
          ? payload.filename
          : `barcode-label_${product.sku || product.id}.pdf`;

      saveAs(blob, filename);
      toast({ title: 'Downloaded', description: 'Barcode label PDF downloaded' });
    } catch (e: any) {
      toast({
        title: 'Failed',
        description: e?.message || 'Failed to generate barcode labels',
        variant: 'destructive',
      });
    } finally {
      setDownloadingLabelForId(null);
    }
  };

  const rbac = useRbac();
  const isOwnerOrAdmin = rbac.isAdmin || rbac.isOwner;
  const canEdit = rbac.canEditCatalog; // Owner/Admin/Manager
  const canDelete = rbac.isAdmin || rbac.isOwner;

  const products = productsData?.productsPaginated?.items || [];
  const pageInfo = productsData?.productsPaginated?.pageInfo;
  const totalProducts = pageInfo?.total || 0;
  const categories = categoriesData?.categories || [];
  const suppliers = suppliersData?.suppliers || [];

  const selectedProducts = products.filter(
    (p: any) => p?.id && selectedProductIds.has(p.id as string),
  );
  const selectedCount = selectedProducts.length;

  const selectedIdsWithBarcode = selectedProducts
    .filter((p: any) => typeof p?.barcode === 'string' && p.barcode.trim().length > 0)
    .map((p: any) => p.id as string);

  const selectedIdsAll = selectedProducts.map((p: any) => p.id as string);

  const handleExportSelectedCsv = async () => {
    if (!selectedIdsAll.length) return;
    try {
      await downloadBarcodesCsv({
        productIds: selectedIdsAll,
        filename: 'barcodes-export_selected.csv',
      });
      toast({
        title: 'Export started',
        description: `Downloaded CSV (${selectedIdsAll.length} products)`,
      });
    } catch (e: any) {
      toast({
        title: 'Export failed',
        description: e?.message || 'Failed to export CSV',
        variant: 'destructive',
      });
    }
  };

  const handleCopyThermalSelected = async () => {
    if (!selectedIdsAll.length) return;
    if (!selectedIdsWithBarcode.length) {
      toast({
        title: 'No barcodes',
        description: 'Selected products have no barcode to print',
        variant: 'destructive',
      });
      return;
    }

    try {
      await copyThermalLabelsZplToClipboard({
        productIds: selectedIdsWithBarcode,
        copies: 1,
        labelSize: '4x6',
      });
      const skipped = selectedIdsAll.length - selectedIdsWithBarcode.length;
      toast({
        title: 'Copied',
        description:
          skipped > 0
            ? `Thermal ZPL copied (${selectedIdsWithBarcode.length} with barcodes, ${skipped} skipped)`
            : `Thermal ZPL copied (${selectedIdsWithBarcode.length} products)`,
      });
    } catch (err: any) {
      toast({
        title: 'Failed',
        description: err?.message || 'Failed to copy thermal code',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadThermalSelected = async () => {
    if (!selectedIdsAll.length) return;
    if (!selectedIdsWithBarcode.length) {
      toast({
        title: 'No barcodes',
        description: 'Selected products have no barcode to print',
        variant: 'destructive',
      });
      return;
    }

    try {
      await downloadThermalLabelsZpl({
        productIds: selectedIdsWithBarcode,
        filename: 'thermal-labels_selected.zpl',
        copies: 1,
        labelSize: '4x6',
      });
      const skipped = selectedIdsAll.length - selectedIdsWithBarcode.length;
      toast({
        title: 'Downloaded',
        description:
          skipped > 0
            ? `Thermal ZPL downloaded (${selectedIdsWithBarcode.length} with barcodes, ${skipped} skipped)`
            : `Thermal ZPL downloaded (${selectedIdsWithBarcode.length} products)`,
      });
    } catch (err: any) {
      toast({
        title: 'Failed',
        description: err?.message || 'Failed to download thermal code',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadLabelPdfForSelected = async () => {
    if (!selectedIdsAll.length) return;
    if (!selectedIdsWithBarcode.length) {
      toast({
        title: 'No barcodes',
        description: 'Selected products have no barcode to print',
        variant: 'destructive',
      });
      return;
    }

    setDownloadingLabelForId('__selected__');
    try {
      const { data } = await generateBarcodeLabels({
        variables: {
          input: {
            productIds: selectedIdsWithBarcode,
          },
        },
      });

      const payload = (data as any)?.generateBarcodeLabels;
      const base64Data = payload?.pdfData as string | undefined;
      if (!base64Data) throw new Error('No PDF data returned');

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const filename =
        typeof payload?.filename === 'string' && payload.filename.trim()
          ? payload.filename
          : 'barcode-labels_selected.pdf';

      saveAs(blob, filename);

      const skipped = selectedIdsAll.length - selectedIdsWithBarcode.length;
      toast({
        title: 'Downloaded',
        description:
          skipped > 0
            ? `Label PDF downloaded (${selectedIdsWithBarcode.length} with barcodes, ${skipped} skipped)`
            : `Label PDF downloaded (${selectedIdsWithBarcode.length} products)`,
      });
    } catch (e: any) {
      toast({
        title: 'Failed',
        description: e?.message || 'Failed to generate barcode labels',
        variant: 'destructive',
      });
    } finally {
      setDownloadingLabelForId(null);
    }
  };

  const openedFromUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const productId = searchParams.get('productId');
    if (!productId) return;
    if (openedFromUrlRef.current === productId) return;

    const match = products.find((p: any) => p.id === productId);
    if (!match) return;

    openedFromUrlRef.current = productId;
    setSelectedProduct(match);
    setIsDetailDrawerOpen(true);
  }, [products, searchParams]);

  // Client-side filter on paginated results (category, supplier, status)
  const filteredProducts = products.filter((product: any) => {
    const matchesCategory = categoryFilter === 'all' || product.category?.id === categoryFilter;

    const matchesSupplier = supplierFilter === 'all' || product.supplier?.id === supplierFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'archived' && !product.is_active);

    return matchesCategory && matchesSupplier && matchesStatus;
  });

  const activeProducts = products.filter((p: any) => p.is_active).length;

  const visibleProductIds: string[] = filteredProducts
    .map((p: any) => p?.id)
    .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);

  const visibleSelectedCount = visibleProductIds.filter((id) => selectedProductIds.has(id)).length;
  const allVisibleSelected =
    visibleProductIds.length > 0 && visibleSelectedCount === visibleProductIds.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  const toggleSelected = (productId: string, nextChecked: boolean) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (nextChecked) next.add(productId);
      else next.delete(productId);
      return next;
    });
  };

  const toggleSelectAllVisible = (nextChecked: boolean) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (nextChecked) {
        for (const id of visibleProductIds) next.add(id);
      } else {
        for (const id of visibleProductIds) next.delete(id);
      }
      return next;
    });
  };

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
      try {
        await deleteProduct({ variables: { id: productToArchive.id } });
      } catch {
        // onError handles user-facing messaging
      }
      setProductToArchive(null);
    }
  };

  const handleUnarchiveProduct = async (product: any) => {
    // Backend updateProduct automatically sets is_active=true
    try {
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
    } catch {
      // onError handles user-facing messaging
    }
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Products</h1>
              <p className="text-muted-foreground">
                Manage company-wide product definitions and pricing
              </p>
            </div>
            {!isEmpty && (
              <div className="flex items-center gap-2">
                {isOwnerOrAdmin && (
                  <Button
                    variant="ghost"
                    className="gap-2 hover:bg-transparent"
                    onClick={() => setIsBulkEntryOpen(true)}
                  >
                    <PackagePlus className="h-4 w-4" />
                    Bulk Import
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
                      variant="ghost"
                      onClick={() => setIsBulkEntryOpen(true)}
                      className="gap-2 hover:bg-transparent"
                    >
                      <PackagePlus className="h-4 w-4" />
                      Bulk Import
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
                  <div className="text-2xl font-bold">{totalProducts}</div>
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
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

                  {selectedCount > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 w-full md:w-auto">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            void handleExportSelectedCsv();
                          }}
                        >
                          <FileDown className="h-4 w-4" />
                          Export Barcode CSV
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          disabled={
                            selectedIdsWithBarcode.length === 0 ||
                            downloadingLabelForId === '__selected__'
                          }
                          onSelect={(e) => {
                            e.preventDefault();
                            void handleDownloadLabelPdfForSelected();
                          }}
                        >
                          <FileDown className="h-4 w-4" />
                          {downloadingLabelForId === '__selected__'
                            ? 'Downloading label…'
                            : 'Download Label PDF'}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          disabled={selectedIdsWithBarcode.length === 0}
                          onSelect={(e) => {
                            e.preventDefault();
                            void handleCopyThermalSelected();
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          Copy Thermal Code
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          disabled={selectedIdsWithBarcode.length === 0}
                          onSelect={(e) => {
                            e.preventDefault();
                            void handleDownloadThermalSelected();
                          }}
                        >
                          <Printer className="h-4 w-4" />
                          Download Thermal Code
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No products match your filters
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[44px]">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              aria-label="Select all visible products"
                              checked={
                                allVisibleSelected
                                  ? true
                                  : someVisibleSelected
                                    ? 'indeterminate'
                                    : false
                              }
                              onCheckedChange={(checked) => {
                                const next = checked === true;
                                toggleSelectAllVisible(next);
                              }}
                            />
                          </div>
                        </TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Cost Price</TableHead>
                        <TableHead>Selling Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product: any) => (
                        <TableRow
                          key={product.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewProduct(product)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              aria-label={`Select ${product?.name ?? 'product'}`}
                              checked={!!product?.id && selectedProductIds.has(product.id)}
                              onCheckedChange={(checked) => {
                                if (!product?.id) return;
                                toggleSelected(product.id, checked === true);
                              }}
                            />
                          </TableCell>
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
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Actions"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                {product.barcode ? (
                                  <>
                                    <DropdownMenuItem
                                      disabled={downloadingLabelForId === product.id}
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        void handleDownloadBarcodeLabelPdf(product);
                                      }}
                                    >
                                      <FileDown className="h-4 w-4" />
                                      {downloadingLabelForId === product.id
                                        ? 'Downloading label…'
                                        : 'Download Label PDF'}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        void (async () => {
                                          try {
                                            await downloadThermalLabelsZpl({
                                              productIds: [product.id],
                                              filename: `thermal-label_${product.sku || product.id}.zpl`,
                                              copies: 1,
                                              labelSize: '4x6',
                                            });
                                            toast({
                                              title: 'Downloaded',
                                              description: 'Thermal ZPL downloaded',
                                            });
                                          } catch (err: any) {
                                            toast({
                                              title: 'Failed',
                                              description: err?.message || 'Failed to generate ZPL',
                                              variant: 'destructive',
                                            });
                                          }
                                        })();
                                      }}
                                    >
                                      <Printer className="h-4 w-4" />
                                      Download Thermal ZPL (4×6)
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        void (async () => {
                                          try {
                                            await copyThermalLabelsZplToClipboard({
                                              productIds: [product.id],
                                              copies: 1,
                                              labelSize: '4x6',
                                            });
                                            toast({
                                              title: 'Copied',
                                              description: 'Thermal ZPL copied to clipboard',
                                            });
                                          } catch (err: any) {
                                            toast({
                                              title: 'Failed',
                                              description: err?.message || 'Failed to copy ZPL',
                                              variant: 'destructive',
                                            });
                                          }
                                        })();
                                      }}
                                    >
                                      <Copy className="h-4 w-4" />
                                      Copy Thermal ZPL (4×6)
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem disabled>No barcode to print</DropdownMenuItem>
                                )}

                                {canEdit ? (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        handleEditProduct(product);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>

                                    {canDelete && product.is_active ? (
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          handleArchiveProduct(product);
                                        }}
                                      >
                                        <Archive className="h-4 w-4" />
                                        Archive
                                      </DropdownMenuItem>
                                    ) : null}

                                    {canDelete && !product.is_active ? (
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          handleUnarchiveProduct(product);
                                        }}
                                      >
                                        <Archive className="h-4 w-4" />
                                        Restore
                                      </DropdownMenuItem>
                                    ) : null}
                                  </>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Pagination Controls */}
                {pageInfo && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {((pageInfo.page - 1) * pageInfo.limit) + 1}–{Math.min(pageInfo.page * pageInfo.limit, pageInfo.total)} of {pageInfo.total} products
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pageInfo.hasPreviousPage}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {pageInfo.page} of {Math.ceil(pageInfo.total / pageInfo.limit)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pageInfo.hasNextPage}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
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
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER']}>
        <CatalogProductsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
