'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/role-guard';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Edit,
  Archive,
  Ruler,
  PackagePlus,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

function UnitsContent() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active'); // active, archived, all
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    shortCode: '',
    isDefault: false,
  });
  const [unitToArchive, setUnitToArchive] = useState<any>(null);
  const [bulkArchiveUnitIds, setBulkArchiveUnitIds] = useState<string[] | null>(null);
  const [bulkRestoreUnitIds, setBulkRestoreUnitIds] = useState<string[] | null>(null);

  const includeArchived = statusFilter !== 'active';
  const { data, loading, error, refetch } = useQuery(GET_UNITS, {
    variables: { includeArchived },
  });

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

  const [archiveUnit] = useMutation(DELETE_UNIT, {
    onCompleted: () => {
      toast({ title: 'Unit archived', description: 'Unit has been archived successfully' });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Cannot archive unit',
        description: 'This unit is in use by products',
        variant: 'destructive',
      });
    },
  });

  const [archiveUnitQuiet] = useMutation(DELETE_UNIT);

  const units = data?.units || [];

  const filteredUnits = units.filter((unit: any) => {
    const matchesSearch =
      searchTerm === '' ||
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.shortCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && unit.isActive) ||
      (statusFilter === 'archived' && !unit.isActive);

    return matchesSearch && matchesStatus;
  });

  const selectedCount = selectedUnitIds.size;

  const visibleUnitIds = filteredUnits.map((u: any) => u.id).filter(Boolean);
  const visibleSelectedCount = visibleUnitIds.filter((id: string) =>
    selectedUnitIds.has(id),
  ).length;
  const allVisibleSelected =
    visibleUnitIds.length > 0 && visibleSelectedCount === visibleUnitIds.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  const toggleSelected = (id: string, selected: boolean) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAllVisible = (selected: boolean) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleUnitIds) {
        if (selected) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

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

  const handleArchiveUnit = (unit: any) => {
    setUnitToArchive(unit);
  };

  const confirmArchive = async () => {
    if (unitToArchive) {
      await archiveUnit({ variables: { id: unitToArchive.id } });
      setUnitToArchive(null);
    }
  };

  const handleArchiveSelected = () => {
    const selectedActiveIds = Array.from(selectedUnitIds).filter((id) => {
      const unit = units.find((u: any) => u.id === id);
      return unit?.isActive;
    });
    if (selectedActiveIds.length === 0) return;
    setBulkArchiveUnitIds(selectedActiveIds);
  };

  const handleRestoreUnit = async (unit: any) => {
    await updateUnit({
      variables: {
        input: {
          id: unit.id,
          name: unit.name,
          shortCode: unit.shortCode,
          isDefault: unit.isDefault,
          isActive: true,
        },
      },
    });
  };

  const handleRestoreSelected = () => {
    const selectedArchivedIds = Array.from(selectedUnitIds).filter((id) => {
      const unit = units.find((u: any) => u.id === id);
      return unit && unit.isActive === false;
    });
    if (selectedArchivedIds.length === 0) return;
    setBulkRestoreUnitIds(selectedArchivedIds);
  };

  const confirmBulkRestore = async () => {
    const ids = bulkRestoreUnitIds;
    if (!ids || ids.length === 0) return;

    let restored = 0;
    let failed = 0;

    for (const id of ids) {
      const unit = units.find((u: any) => u.id === id);
      if (!unit) {
        failed += 1;
        continue;
      }

      try {
        await updateUnit({
          variables: {
            input: {
              id: unit.id,
              name: unit.name,
              shortCode: unit.shortCode,
              isDefault: unit.isDefault,
              isActive: true,
            },
          },
        });
        restored += 1;
      } catch {
        failed += 1;
      }
    }

    setBulkRestoreUnitIds(null);
    setSelectedUnitIds(new Set());
    await refetch();

    if (restored > 0) {
      toast({
        title: 'Units restored',
        description:
          failed > 0 ? `Restored ${restored}. Failed ${failed}.` : `Restored ${restored} units.`,
      });
    } else {
      toast({
        title: 'Cannot restore units',
        description: 'No units were restored.',
        variant: 'destructive',
      });
    }
  };

  const confirmBulkArchive = async () => {
    const ids = bulkArchiveUnitIds;
    if (!ids || ids.length === 0) return;

    let archived = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await archiveUnitQuiet({ variables: { id } });
        archived += 1;
      } catch {
        failed += 1;
      }
    }

    setBulkArchiveUnitIds(null);
    setSelectedUnitIds(new Set());
    await refetch();

    if (archived > 0) {
      toast({
        title: 'Units archived',
        description:
          failed > 0 ? `Archived ${archived}. Failed ${failed}.` : `Archived ${archived} units.`,
      });
    } else {
      toast({
        title: 'Cannot archive units',
        description: 'No units were archived.',
        variant: 'destructive',
      });
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Units of Measurement
              </h1>
              <p className="text-muted-foreground">Define units used across your products</p>
            </div>
            {!isEmpty && (
              <div className="flex items-center gap-2">
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
              <div className="rounded-full bg-muted p-6">
                <PackagePlus className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">No units defined yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Create measurement units like pieces, kilograms, li ters, etc.
                </p>
              </div>
              <div className="flex items-center gap-2">
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

            {/* Units Table */}
            <Card>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search units..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="archived">Archived Only</SelectItem>
                      <SelectItem value="all">All Units</SelectItem>
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
                          disabled={
                            Array.from(selectedUnitIds).filter((id) => {
                              const unit = units.find((u: any) => u.id === id);
                              return unit?.isActive;
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
                            Array.from(selectedUnitIds).filter((id) => {
                              const unit = units.find((u: any) => u.id === id);
                              return unit && unit.isActive === false;
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

                {filteredUnits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No units match your search
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-44px">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              aria-label="Select all visible units"
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
                        <TableHead>Unit Name</TableHead>
                        <TableHead>Short Code</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUnits.map((unit: any) => (
                        <TableRow key={unit.id}>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              aria-label={`Select ${unit?.name ?? 'unit'}`}
                              checked={!!unit?.id && selectedUnitIds.has(unit.id)}
                              onCheckedChange={(checked) => {
                                if (!unit?.id) return;
                                toggleSelected(unit.id, checked === true);
                              }}
                            />
                          </TableCell>
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
                          <TableCell>
                            <Badge variant={unit.isActive ? 'default' : 'secondary'}>
                              {unit.isActive ? 'Active' : 'Archived'}
                            </Badge>
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
                              {unit.isActive ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleArchiveUnit(unit)}
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => void handleRestoreUnit(unit)}
                                >
                                  <Archive className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
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

      {/* Unit Modal */}
      <Dialog open={isUnitModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                <p className="text-sm text-muted-foreground">Only one unit can be default</p>
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
                {creating || updating ? 'Saving...' : selectedUnit ? 'Update Unit' : 'Create Unit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!unitToArchive} onOpenChange={() => setUnitToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Unit?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive{' '}
              <strong>
                {unitToArchive?.name} ({unitToArchive?.shortCode})
              </strong>
              ? Units in use by products cannot be archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Archive Unit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Archive Confirmation Dialog */}
      <AlertDialog
        open={!!bulkArchiveUnitIds && bulkArchiveUnitIds.length > 0}
        onOpenChange={() => setBulkArchiveUnitIds(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Units?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {bulkArchiveUnitIds?.length ?? 0} selected units?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkArchive}>Archive Units</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Restore Confirmation Dialog */}
      <AlertDialog
        open={!!bulkRestoreUnitIds && bulkRestoreUnitIds.length > 0}
        onOpenChange={() => setBulkRestoreUnitIds(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Units?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore {bulkRestoreUnitIds?.length ?? 0} selected units?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkRestore}>Restore Units</AlertDialogAction>
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
