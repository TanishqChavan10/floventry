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
import { Plus, Search, Edit, Archive, Store, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { GET_SUPPLIERS, ARCHIVE_SUPPLIER, UNARCHIVE_SUPPLIER } from '@/lib/graphql/catalog';
import { SupplierModal } from '@/components/catalog/SupplierModal';
import SupplierDetailDrawer from '@/components/catalog/SupplierDetailDrawer';

function CatalogSuppliersContent() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [supplierToArchive, setSupplierToArchive] = useState<any>(null);
  const { toast } = useToast();

  const includeArchived = statusFilter !== 'active';
  const { data: suppliersData, loading, error, refetch } = useQuery(GET_SUPPLIERS, {
    variables: { includeArchived },
  });

  const [archiveSupplier] = useMutation(ARCHIVE_SUPPLIER, {
    onCompleted: () => {
      toast({
        title: 'Supplier archived',
        description: 'Supplier has been archived successfully',
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

  const [unarchiveSupplier] = useMutation(UNARCHIVE_SUPPLIER, {
    onCompleted: () => {
      toast({
        title: 'Supplier restored',
        description: 'Supplier has been restored successfully',
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
  const activeCompany = user?.companies?.find(c => c.id === user.activeCompanyId);
  const userRole = activeCompany?.role;
  
  const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN';
  const canEdit = isOwnerOrAdmin; // Only Owner/Admin can edit/create suppliers
  const canArchive = isOwnerOrAdmin; // Only Owner/Admin can archive suppliers

  const suppliers = suppliersData?.suppliers || [];

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier: any) => {
    const matchesSearch =
      searchTerm === '' ||
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.phone && supplier.phone.includes(searchTerm));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && supplier.isActive) ||
      (statusFilter === 'archived' && !supplier.isActive);

    return matchesSearch && matchesStatus;
  });

  const activeSuppliers = suppliers.filter((s: any) => s.isActive).length;

  const handleEditSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsSupplierModalOpen(true);
  };

  const handleViewSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsDetailDrawerOpen(true);
  };

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setIsSupplierModalOpen(true);
  };

  const handleModalClose = () => {
    setIsSupplierModalOpen(false);
    setSelectedSupplier(null);
    refetch();
  };

  const handleArchiveSupplier = (supplier: any) => {
    setSupplierToArchive(supplier);
  };

  const confirmArchive = async () => {
    if (supplierToArchive) {
      await archiveSupplier({ variables: { id: supplierToArchive.id } });
      setSupplierToArchive(null);
    }
  };

  const handleUnarchiveSupplier = async (supplier: any) => {
    await unarchiveSupplier({ variables: { id: supplier.id } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Store className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Failed to load suppliers</p>
        </div>
      </div>
    );
  }

  const isEmpty = suppliers.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Suppliers
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your company's supplier directory
              </p>
            </div>
            {canEdit && !isEmpty && (
              <Button className="gap-2" onClick={handleAddSupplier}>
                <Plus className="h-4 w-4" />
                Add Supplier
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
                <UserPlus className="h-12 w-12 text-slate-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">No suppliers yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {canEdit
                    ? 'Get started by adding your first supplier to the directory.'
                    : 'Suppliers will appear here once an admin adds them.'}
                </p>
              </div>
              {canEdit && (
                <Button onClick={handleAddSupplier} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add your first supplier
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
                  <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{suppliers.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeSuppliers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Archived</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{suppliers.length - activeSuppliers}</div>
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
                        placeholder="Search by name, email, or phone..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
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

            {/* Suppliers Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Suppliers ({filteredSuppliers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredSuppliers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No suppliers match your filters
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Status</TableHead>
                        {canEdit && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.map((supplier: any) => (
                        <TableRow
                          key={supplier.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewSupplier(supplier)}
                        >
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.email || '—'}</TableCell>
                          <TableCell>{supplier.phone || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {supplier.productsCount || 0} products
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                              {supplier.isActive ? 'Active' : 'Archived'}
                            </Badge>
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditSupplier(supplier)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {canArchive && supplier.isActive && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleArchiveSupplier(supplier)}
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                )}
                                {canArchive && !supplier.isActive && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleUnarchiveSupplier(supplier)}
                                    title="Restore supplier"
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
      {isSupplierModalOpen && (
        <SupplierModal
          supplier={selectedSupplier}
          open={isSupplierModalOpen}
          onOpenChange={setIsSupplierModalOpen}
          onSuccess={refetch}
        />
      )}

      {isDetailDrawerOpen && selectedSupplier && (
        <SupplierDetailDrawer
          supplier={selectedSupplier}
          open={isDetailDrawerOpen}
          onClose={() => {
            setIsDetailDrawerOpen(false);
            setSelectedSupplier(null);
          }}
          onEdit={canEdit ? () => {
            setIsDetailDrawerOpen(false);
            handleEditSupplier(selectedSupplier);
          } : undefined}
        />
      )}

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!supplierToArchive} onOpenChange={() => setSupplierToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive <strong>{supplierToArchive?.name}</strong>? 
              This supplier will be moved to the archived list and won't appear in active lists.
              Products linked to this supplier will remain unchanged.
              You can restore it later by filtering for archived suppliers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>
              Archive Supplier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CatalogSuppliersPage() {
  return (
    <CompanyGuard>
      <CatalogSuppliersContent />
    </CompanyGuard>
  );
}
