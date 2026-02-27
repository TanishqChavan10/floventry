'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/role-guard';
import { usePermissions } from '@/hooks/usePermissions';
import { useRbac } from '@/hooks/use-rbac';
import { AlertCircle, Lock } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { WarehouseAccessList } from '@/components/warehouse/WarehouseAccessList';
import { DeleteWarehouseDialog } from '@/components/warehouses/DeleteWarehouseDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  MapPin,
  Users,
  Trash2,
  Save,
  ShieldAlert,
  Settings2,
  Clock,
  Phone,
  Star,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  GET_WAREHOUSE_WITH_SETTINGS,
  UPDATE_WAREHOUSE,
  GET_WAREHOUSES_BY_COMPANY,
  REACTIVATE_WAREHOUSE,
} from '@/lib/graphql/company';

function WarehouseSettingsContent() {
  const params = useParams();
  const companySlug = params.slug as string;
  const warehouseSlug = params.warehouseSlug as string;
  const permissions = usePermissions();
  const rbac = useRbac();
  const isReadOnly = !rbac.canEditWarehouseSettings;

  // Fetch warehouse data
  const { data: warehousesData, loading: loadingWarehouses } = useQuery(GET_WAREHOUSES_BY_COMPANY, {
    variables: { slug: companySlug },
    skip: !companySlug,
  });

  const currentWarehouse = warehousesData?.companyBySlug?.warehouses?.find(
    (w: any) => w.slug === warehouseSlug,
  );

  const { data, loading, refetch } = useQuery(GET_WAREHOUSE_WITH_SETTINGS, {
    variables: { id: currentWarehouse?.id },
    skip: !currentWarehouse?.id,
  });

  const warehouse = data?.warehouse;

  // Mutations
  const [updateWarehouse, { loading: updatingWarehouse }] = useMutation(UPDATE_WAREHOUSE);
  const [reactivateWarehouse, { loading: reactivating }] = useMutation(REACTIVATE_WAREHOUSE);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('MAIN');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [description, setDescription] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('active');
  const [isDefault, setIsDefault] = useState(false);

  // Dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Initialize form when data loads
  useEffect(() => {
    if (warehouse) {
      setName(warehouse.name || '');
      setCode(warehouse.code || '');
      setType(warehouse.type || 'MAIN');
      setTimezone(warehouse.timezone || 'Asia/Kolkata');
      setDescription(warehouse.description || '');
      setContactPerson(warehouse.contact_person || '');
      setContactPhone(warehouse.contact_phone || '');
      setAddress(warehouse.address || '');
      setCity(warehouse.city || '');
      setState(warehouse.state || '');
      setCountry(warehouse.country || '');
      setStatus(warehouse.status || 'active');
      setIsDefault(warehouse.is_default || false);
    }
  }, [warehouse]);

  const handleSave = async () => {
    if (isReadOnly) {
      toast.error('Managers have read-only access to warehouse settings');
      return;
    }
    if (!warehouse) {
      toast.error('Warehouse not loaded');
      return;
    }

    try {
      await updateWarehouse({
        variables: {
          id: warehouse.id,
          input: {
            name,
            description,
            type,
            code,
            timezone,
            address,
            city,
            state,
            country,
            contact_person: contactPerson,
            contact_phone: contactPhone,
            status,
            is_default: isDefault,
          },
        },
      });

      toast.success('Warehouse settings updated successfully');
      refetch();
    } catch (error: any) {
      console.error('Error updating warehouse settings:', error);
      toast.error(error.message || 'Failed to update warehouse settings');
    }
  };

  const handleReactivate = async () => {
    if (!warehouse) return;

    try {
      await reactivateWarehouse({
        variables: { id: warehouse.id },
      });

      toast.success('Warehouse reactivated successfully');
      refetch();
    } catch (error: any) {
      console.error('Error reactivating warehouse:', error);
      toast.error(error.message || 'Failed to reactivate warehouse');
    }
  };

  if (loading || loadingWarehouses) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Warehouse not found</p>
      </div>
    );
  }

  const isSaving = updatingWarehouse;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings2 className="h-6 w-6 text-primary" />
              Warehouse Settings
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure general preferences, location, and team access
            </p>
            {isReadOnly && (
              <p className="text-amber-700 dark:text-amber-300 text-xs mt-2">
                Read-only access: ask an Admin/Owner to make changes.
              </p>
            )}
          </div>
          <Button onClick={handleSave} disabled={isSaving || isReadOnly}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isReadOnly ? (
              <>Read only</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {isReadOnly && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">View Only Access</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              As a Warehouse Manager, you can view these settings but cannot change the warehouse structure.
              Contact an Administrator to update information, manage access, or archive this location.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList
            className={`grid w-full ${isReadOnly ? 'grid-cols-3' : 'grid-cols-4'} lg:w-[400px]`}
          >
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            {!isReadOnly && <TabsTrigger value="danger">Danger</TabsTrigger>}
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Basic Information</CardTitle>
                </div>
                <CardDescription>Identify this warehouse in your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Warehouse Name</Label>
                    <Input
                      id="name"
                      placeholder="E.g. Main Distribution Center"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Warehouse Code</Label>
                    <Input
                      id="code"
                      placeholder="E.g. WH-001"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="font-mono uppercase"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Warehouse Type</Label>
                    <Select value={type} onValueChange={setType} disabled={isReadOnly}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MAIN">Main Warehouse</SelectItem>
                        <SelectItem value="RETAIL">Retail Store</SelectItem>
                        <SelectItem value="SERVICE_CENTER">Service Center</SelectItem>
                        <SelectItem value="KIOSK">Kiosk</SelectItem>
                        <SelectItem value="COLD_STORAGE">Cold Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Timezone
                    </Label>
                    <Select value={timezone} onValueChange={setTimezone} disabled={isReadOnly}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Brief description of this facility..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Active Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable operations for this warehouse
                      </p>
                    </div>
                    <Switch
                      checked={status === 'active'}
                      onCheckedChange={(checked) => setStatus(checked ? 'active' : 'inactive')}
                      disabled={isReadOnly}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-600" />
                        Default Warehouse
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Set as the primary warehouse for new products
                      </p>
                    </div>
                    <Switch
                      checked={isDefault}
                      onCheckedChange={setIsDefault}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Contact Information</CardTitle>
                </div>
                <CardDescription>Primary contact for this warehouse</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      placeholder="John Doe"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Settings */}
          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Address &amp; Location</CardTitle>
                </div>
                <CardDescription>Physical address for shipping and receiving</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Industrial Ave"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Staff &amp; Manager</CardTitle>
                </div>
                <CardDescription>View warehouse staff and manager assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {warehouse?.id && warehousesData?.companyBySlug?.id && (
                  <WarehouseAccessList 
                    warehouseId={warehouse.id} 
                    companySlug={companySlug} 
                    companyId={warehousesData.companyBySlug.id}
                    warehouseName={warehouse.name}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone */}
          {!isReadOnly && (
            <TabsContent value="danger" className="space-y-6">
              <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <div className="flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-5 w-5" />
                    <CardTitle>Danger Zone</CardTitle>
                  </div>
                  <CardDescription className="text-destructive/80">
                    Irreversible actions for this warehouse
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {warehouse.status === 'inactive' && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">Reactivate Warehouse</p>
                          <p className="text-sm text-muted-foreground">
                            Restore this archived warehouse and make it available for operations
                            again.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleReactivate}
                          disabled={reactivating}
                        >
                          {reactivating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Reactivate
                        </Button>
                      </div>
                      <Separator className="bg-border" />
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Archive Warehouse</p>
                      <p className="text-sm text-muted-foreground">
                        Hide from lists but keep data intact.
                      </p>
                    </div>
                    <Button variant="outline">Archive</Button>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-destructive">Delete Warehouse</p>
                      <p className="text-sm text-destructive/80">
                        Permanently remove this warehouse and all associated stock data. This cannot
                        be undone.
                      </p>
                    </div>
                    <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Warehouse
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Delete Warehouse Dialog */}
      {warehouse && (
        <DeleteWarehouseDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          warehouseId={warehouse.id}
          warehouseName={warehouse.name}
          companySlug={companySlug}
          onSuccess={() => {
            window.location.href = `/${companySlug}/warehouses`;
          }}
        />
      )}
    </div>
  );
}

export default function WarehouseSettingsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER']}>
        <WarehouseSettingsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
