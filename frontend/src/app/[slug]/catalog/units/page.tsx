'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
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
import { Plus, Search, Edit, Trash2, Ruler, PackagePlus, CheckCircle2 } from 'lucide-react';
import { GET_UNITS, CREATE_UNIT, UPDATE_UNIT, DELETE_UNIT } from '@/lib/graphql/catalog';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BulkEntryModal } from '@/components/catalog/BulkEntryModal';

function UnitsContent() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    shortCode: '',
    isDefault: false,
  });
  const [unitToDelete, setUnitToDelete] = useState<any>(null);
  const [isBulkEntryOpen, setIsBulkEntryOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_UNITS);

  const [createUnit, { loading: creating }] = useMutation(CREATE_UNIT, {
    onCompleted: () => {
      toast({ title: 'Unit created', description: 'Unit has been created successfully' });
      handleCloseModal();
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const [updateUnit, { loading: updating }] = useMutation(UPDATE_UNIT, {
    onCompleted: () => {
      toast({ title: 'Unit updated', description: 'Unit has been updated successfully' });
      handleCloseModal();
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const [deleteUnit] = useMutation(DELETE_UNIT, {
    onCompleted: () => {
      toast({ title: 'Unit deleted', description: 'Unit has been deleted successfully' });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Cannot delete unit',
        description: 'This unit is in use by products',
        variant: 'destructive',
      });
    },
  });

  const units = data?.units || [];

  const filteredUnits = units.filter((unit: any) => {
    return (
      searchTerm === '' ||
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAddUnit = () => {
    setSelectedUnit(null);
    setFormData({ name: '', shortCode: '', isDefault: false });
    setIsUnitModalOpen(true);
  };

  const handleEditUnit = (unit: any) => {
    setSelectedUnit(unit);
    setFormData({
      name: unit.name,
      shortCode: unit.shortCode,
      isDefault: unit.isDefault,
    });
    setIsUnitModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsUnitModalOpen(false);
    setSelectedUnit(null);
    setFormData({ name: '', shortCode: '', isDefault: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUnit) {
      await updateUnit({
        variables: {
          input: {
            id: selectedUnit.id,
            name: formData.name,
            shortCode: formData.shortCode,
            isDefault: formData.isDefault,
          },
        },
      });
    } else {
      await createUnit({
        variables: {
          input: {
            name: formData.name,
            shortCode: formData.shortCode,
            isDefault: formData.isDefault,
          },
        },
      });
    }
  };

  const handleDeleteUnit = (unit: any) => {
    setUnitToDelete(unit);
  };

  const confirmDelete = async () => {
    if (unitToDelete) {
      await deleteUnit({ variables: { id: unitToDelete.id } });
      setUnitToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading units...</p>
        </div>
      </div>
    );
  }

  const isEmpty = units.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Units of Measurement
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Define units used across your products
              </p>
            </div>
            {!isEmpty && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setIsBulkEntryOpen(true)}
                >
                  <PackagePlus className="h-4 w-4" />
                  Bulk Add Units
                </Button>
                <Button className="gap-2" onClick={handleAddUnit}>
                  <Plus className="h-4 w-4" />
                  Add Unit
                </Button>
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
                <h3 className="text-lg font-semibold">No units defined yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Create measurement units like pieces, kilograms, liters, etc.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsBulkEntryOpen(true)}
                  className="gap-2"
                >
                  <PackagePlus className="h-4 w-4" />
                  Bulk Add Units
                </Button>
                <Button onClick={handleAddUnit} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add your first unit
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{units.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Default Unit</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {units.find((u: any) => u.isDefault)?.shortCode || 'None'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search units..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Units Table */}
            <Card>
              <CardHeader>
                <CardTitle>Units ({filteredUnits.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredUnits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No units match your search
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit Name</TableHead>
                        <TableHead>Short Code</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUnits.map((unit: any) => (
                        <TableRow key={unit.id}>
                          <TableCell className="font-medium">{unit.name}</TableCell>
                          <TableCell className="font-mono text-sm">{unit.shortCode}</TableCell>
                          <TableCell>
                            {unit.isDefault && (
                              <Badge variant="default">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditUnit(unit)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUnit(unit.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
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

      {/* Bulk Entry Modal */}
      <BulkEntryModal
        open={isBulkEntryOpen}
        onOpenChange={setIsBulkEntryOpen}
        type="units"
        onCompleted={() => refetch()}
      />

      {/* Unit Modal */}
      <Dialog open={isUnitModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
            <DialogDescription>
              {selectedUnit ? 'Update unit information' : 'Create a new measurement unit'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Unit Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Piece, Kilogram, Liter"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortCode">
                Short Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shortCode"
                value={formData.shortCode}
                onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                placeholder="e.g., pcs, kg, L"
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isDefault">Set as default unit</Label>
                <p className="text-sm text-muted-foreground">
                  Only one unit can be default
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={creating || updating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating || updating}>
                {creating || updating
                  ? 'Saving...'
                  : selectedUnit
                  ? 'Update Unit'
                  : 'Create Unit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!unitToDelete} onOpenChange={() => setUnitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{unitToDelete?.name} ({unitToDelete?.shortCode})</strong>? 
              This action cannot be undone. Units in use by products cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Unit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CatalogUnitsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <UnitsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
