'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Edit, Archive, FolderTree, PackagePlus, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { GET_CATEGORIES, DELETE_CATEGORY, UPDATE_CATEGORY } from '@/lib/graphql/catalog';
import { CategoryModal } from '@/components/catalog/CategoryModal';
import { useToast } from '@/components/ui/use-toast';
import { BulkEntryModal } from '@/components/catalog/BulkEntryModal';

function CatalogCategoriesContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active'); // active, archived, all
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBulkEntryOpen, setIsBulkEntryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryToArchive, setCategoryToArchive] = useState<any>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [bulkArchiveCategoryIds, setBulkArchiveCategoryIds] = useState<string[] | null>(null);
  const [bulkRestoreCategoryIds, setBulkRestoreCategoryIds] = useState<string[] | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_CATEGORIES);
  const [deleteCategory] = useMutation(DELETE_CATEGORY, {
    onCompleted: () => {
      toast({
        title: 'Category archived',
        description: 'Category has been archived successfully',
      });
      refetch();
    },
    onError: (error) => {
      // Enhanced error message for categories with products
      const message = error.message.includes('products')
        ? 'Cannot archive category: Products are still assigned to this category. Please reassign or remove products first.'
        : error.message;

      toast({
        title: 'Cannot archive category',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const [archiveCategoryQuiet] = useMutation(DELETE_CATEGORY);

  const [updateCategory] = useMutation(UPDATE_CATEGORY, {
    onCompleted: () => {
      toast({
        title: 'Category unarchived',
        description: 'Category has been restored successfully',
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

  const [restoreCategoryQuiet] = useMutation(UPDATE_CATEGORY);

  // Get role from active company (role is company-specific, not user-level)
  const activeCompany = user?.companies?.find((c) => c.id === user.activeCompanyId);
  const userRole = activeCompany?.role;

  const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN';
  const canEdit = isOwnerOrAdmin;

  const categories = data?.categories || [];

  const selectedCount = selectedCategoryIds.size;

  // Filter categories by search and status
  const filteredCategories = categories.filter((category: any) => {
    const matchesSearch =
      searchTerm === '' ||
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description &&
        category.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && category.isActive) ||
      (statusFilter === 'archived' && !category.isActive);

    return matchesSearch && matchesStatus;
  });

  const visibleCategoryIds = filteredCategories.map((c: any) => c.id).filter(Boolean);
  const visibleSelectedCount = visibleCategoryIds.filter((id: string) =>
    selectedCategoryIds.has(id),
  ).length;
  const allVisibleSelected =
    visibleCategoryIds.length > 0 && visibleSelectedCount === visibleCategoryIds.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  const toggleSelected = (id: string, selected: boolean) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAllVisible = (selected: boolean) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleCategoryIds) {
        if (selected) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const activeCategories = categories.filter((c: any) => c.isActive).length;
  const archivedCategories = categories.length - activeCategories;

  const handleEditCategory = (category: any) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCategoryModalOpen(false);
    setSelectedCategory(null);
    refetch();
  };

  const handleArchiveCategory = (category: any) => {
    setCategoryToArchive(category);
  };

  const confirmArchive = async () => {
    if (categoryToArchive) {
      await deleteCategory({ variables: { id: categoryToArchive.id } });
      setCategoryToArchive(null);
    }
  };

  const handleArchiveSelected = () => {
    const selectedActiveIds = Array.from(selectedCategoryIds).filter((id) => {
      const category = categories.find((c: any) => c.id === id);
      return category?.isActive;
    });

    if (selectedActiveIds.length === 0) return;
    setBulkArchiveCategoryIds(selectedActiveIds);
  };

  const handleRestoreSelected = () => {
    const selectedArchivedIds = Array.from(selectedCategoryIds).filter((id) => {
      const category = categories.find((c: any) => c.id === id);
      return category && category.isActive === false;
    });

    if (selectedArchivedIds.length === 0) return;
    setBulkRestoreCategoryIds(selectedArchivedIds);
  };

  const confirmBulkRestore = async () => {
    const ids = bulkRestoreCategoryIds;
    if (!ids || ids.length === 0) return;

    let restored = 0;
    let failed = 0;

    for (const id of ids) {
      const category = categories.find((c: any) => c.id === id);
      if (!category) {
        failed += 1;
        continue;
      }

      try {
        await restoreCategoryQuiet({
          variables: {
            input: {
              id: category.id,
              name: category.name,
              description: category.description || '',
            },
          },
        });
        restored += 1;
      } catch {
        failed += 1;
      }
    }

    setBulkRestoreCategoryIds(null);
    setSelectedCategoryIds(new Set());
    await refetch();

    if (restored > 0) {
      toast({
        title: 'Categories restored',
        description:
          failed > 0
            ? `Restored ${restored}. Failed ${failed}.`
            : `Restored ${restored} categories.`,
      });
    } else {
      toast({
        title: 'Cannot restore categories',
        description: 'No categories were restored.',
        variant: 'destructive',
      });
    }
  };

  const confirmBulkArchive = async () => {
    const ids = bulkArchiveCategoryIds;
    if (!ids || ids.length === 0) return;

    let archived = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await archiveCategoryQuiet({ variables: { id } });
        archived += 1;
      } catch {
        failed += 1;
      }
    }

    setBulkArchiveCategoryIds(null);
    setSelectedCategoryIds(new Set());
    await refetch();

    if (archived > 0) {
      toast({
        title: 'Categories archived',
        description:
          failed > 0
            ? `Archived ${archived}. Failed ${failed}.`
            : `Archived ${archived} categories.`,
      });
    } else {
      toast({
        title: 'Cannot archive categories',
        description: 'No categories were archived.',
        variant: 'destructive',
      });
    }
  };

  const handleUnarchiveCategory = async (category: any) => {
    // Backend updateCategory automatically sets isActive to true
    await updateCategory({
      variables: {
        input: {
          id: category.id,
          name: category.name,
          description: category.description || '',
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  const isEmpty = categories.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Categories
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Organize products into categories
              </p>
            </div>
            {!isEmpty && (
              <div className="flex items-center gap-2">
                {isOwnerOrAdmin && (
                  <Button className="gap-2" onClick={() => setIsBulkEntryOpen(true)}>
                    <PackagePlus className="h-4 w-4" />
                    Bulk Import
                  </Button>
                )}
                {canEdit && (
                  <Button className="gap-2" onClick={handleAddCategory}>
                    <Plus className="h-4 w-4" />
                    Add Category
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
                <h3 className="text-lg font-semibold">No categories yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {canEdit
                    ? 'Create categories to organize your products.'
                    : 'Categories will appear here once an admin creates them.'}
                </p>
              </div>
              {canEdit && (
                <div className="flex items-center gap-2">
                  {isOwnerOrAdmin && (
                    <Button onClick={() => setIsBulkEntryOpen(true)} className="gap-2">
                      <PackagePlus className="h-4 w-4" />
                      Bulk Import
                    </Button>
                  )}
                  <Button onClick={handleAddCategory} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add your first category
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
                  <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
                  <FolderTree className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categories.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Company-wide</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeCategories}</div>
                  <p className="text-xs text-muted-foreground mt-1">Available for use</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Archived</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{archivedCategories}</div>
                  <p className="text-xs text-muted-foreground mt-1">Hidden from selection</p>
                </CardContent>
              </Card>
            </div>

            {/* Categories Table */}
            <Card>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search categories..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="archived">Archived Only</SelectItem>
                      <SelectItem value="all">All Categories</SelectItem>
                    </SelectContent>
                  </Select>

                  {canEdit && selectedCount > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 w-full md:w-auto">
                          <MoreHorizontal className="h-4 w-4" />
                          Selected Actions ({selectedCount})
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={
                            Array.from(selectedCategoryIds).filter((id) => {
                              const category = categories.find((c: any) => c.id === id);
                              return category?.isActive;
                            }).length === 0
                          }
                          onSelect={(e) => {
                            e.preventDefault();
                            handleArchiveSelected();
                          }}
                        >
                          <Archive className="h-4 w-4" />
                          Archive Selected
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          disabled={
                            Array.from(selectedCategoryIds).filter((id) => {
                              const category = categories.find((c: any) => c.id === id);
                              return category && category.isActive === false;
                            }).length === 0
                          }
                          onSelect={(e) => {
                            e.preventDefault();
                            handleRestoreSelected();
                          }}
                        >
                          <Archive className="h-4 w-4 text-green-600" />
                          Restore Selected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {filteredCategories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {statusFilter === 'archived'
                      ? 'No archived categories'
                      : 'No categories match your search'}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[44px]">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              aria-label="Select all visible categories"
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
                        <TableHead>Category Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Product Count</TableHead>
                        <TableHead>Status</TableHead>
                        {canEdit && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((category: any) => {
                        const productCount = category.products?.length || 0;
                        return (
                          <TableRow key={category.id}>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                aria-label={`Select ${category?.name ?? 'category'}`}
                                checked={!!category?.id && selectedCategoryIds.has(category.id)}
                                onCheckedChange={(checked) => {
                                  if (!category?.id) return;
                                  toggleSelected(category.id, checked === true);
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">
                              {category.description || '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{productCount}</span>
                                <span className="text-xs text-muted-foreground">
                                  {productCount === 1 ? 'product' : 'products'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={category.isActive ? 'default' : 'secondary'}>
                                {category.isActive ? 'Active' : 'Archived'}
                              </Badge>
                            </TableCell>
                            {canEdit && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditCategory(category)}
                                    title="Edit category"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {category.isActive && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleArchiveCategory(category)}
                                      title={
                                        productCount > 0
                                          ? `Archive (${productCount} products)`
                                          : 'Archive category'
                                      }
                                    >
                                      <Archive className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {!category.isActive && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleUnarchiveCategory(category)}
                                      title="Restore category"
                                    >
                                      <Archive className="h-4 w-4 text-green-600" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            )}
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

      {/* Modal */}
      <BulkEntryModal
        open={isBulkEntryOpen}
        onOpenChange={setIsBulkEntryOpen}
        type="categories"
        onCompleted={() => refetch()}
      />

      {isCategoryModalOpen && (
        <CategoryModal
          category={selectedCategory}
          open={isCategoryModalOpen}
          onOpenChange={setIsCategoryModalOpen}
          onSuccess={handleModalClose}
        />
      )}

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!categoryToArchive} onOpenChange={() => setCategoryToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Category?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToArchive && (
                <>
                  Are you sure you want to archive <strong>{categoryToArchive.name}</strong>?
                  {categoryToArchive.products?.length > 0 && (
                    <>
                      <br />
                      <br />
                      <strong>Warning:</strong> This category has{' '}
                      {categoryToArchive.products.length} product(s) assigned. Archiving will not
                      remove the products, but the category will be hidden.
                    </>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>Archive Category</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Archive Confirmation Dialog */}
      <AlertDialog
        open={!!bulkArchiveCategoryIds && bulkArchiveCategoryIds.length > 0}
        onOpenChange={() => setBulkArchiveCategoryIds(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Categories?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {bulkArchiveCategoryIds?.length ?? 0} selected
              categories? Archived categories will be hidden from selection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkArchive}>Archive Categories</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Restore Confirmation Dialog */}
      <AlertDialog
        open={!!bulkRestoreCategoryIds && bulkRestoreCategoryIds.length > 0}
        onOpenChange={() => setBulkRestoreCategoryIds(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Categories?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore {bulkRestoreCategoryIds?.length ?? 0} selected
              categories?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkRestore}>Restore Categories</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CatalogCategoriesPage() {
  return (
    <CompanyGuard>
      <CatalogCategoriesContent />
    </CompanyGuard>
  );
}
