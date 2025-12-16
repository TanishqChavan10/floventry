'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { WarehouseAccessList } from '@/components/warehouse/WarehouseAccessList';
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
  Package,
  Clock,
  Phone,
  ArrowLeftRight,
  CalendarClock,
  Star,
  Loader2
} from 'lucide-react';
import { 
  GET_WAREHOUSE_WITH_SETTINGS, 
  UPDATE_WAREHOUSE, 
  UPDATE_WAREHOUSE_SETTINGS,
  GET_WAREHOUSES_BY_COMPANY 
} from '@/lib/graphql/company';

function WarehouseSettingsContent() {
  const params = useParams();
  const companySlug = params.slug as string;
  const warehouseSlug = params.warehouseSlug as string;

  // Fetch warehouse data
  const { data: warehousesData, loading: loadingWarehouses } = useQuery(GET_WAREHOUSES_BY_COMPANY, {
    variables: { slug: companySlug },
    skip: !companySlug,
  });

  const currentWarehouse = warehousesData?.companyBySlug?.warehouses?.find(
    (w: any) => w.slug === warehouseSlug
  );

  const { data, loading, refetch } = useQuery(GET_WAREHOUSE_WITH_SETTINGS, {
    variables: { id: currentWarehouse?.id },
    skip: !currentWarehouse?.id,
  });

  const warehouse = data?.warehouse;

  // Mutations
  const [updateWarehouse, { loading: updatingWarehouse }] = useMutation(UPDATE_WAREHOUSE);
  const [updateWarehouseSettings, { loading: updatingSettings }] = useMutation(UPDATE_WAREHOUSE_SETTINGS);

  // Form state - Warehouse
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
  const [postal, setPostal] = useState('');
  const [status, setStatus] = useState('active');
  const [isDefault, setIsDefault] = useState(false);

  // Form state - Settings
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [expiryWarningDays, setExpiryWarningDays] = useState(30);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [allowInboundTransfers, setAllowInboundTransfers] = useState(true);
  const [allowOutboundTransfers, setAllowOutboundTransfers] = useState(true);
  const [requireTransferApproval, setRequireTransferApproval] = useState(false);

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

      if (warehouse.settings) {
        setLowStockThreshold(warehouse.settings.low_stock_threshold || 10);
        setExpiryWarningDays(warehouse.settings.expiry_warning_days || 30);
        setAllowNegativeStock(warehouse.settings.allow_negative_stock || false);
        setAllowInboundTransfers(warehouse.settings.allow_inbound_transfers ?? true);
        setAllowOutboundTransfers(warehouse.settings.allow_outbound_transfers ?? true);
        setRequireTransferApproval(warehouse.settings.require_transfer_approval || false);
      }
    }
  }, [warehouse]);

  const handleSave = async () => {
    if (!warehouse) {
      toast.error('Warehouse not loaded');
      return;
    }

    try {
      // Update warehouse
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
          },
        },
      });

      // Update warehouse settings
      await updateWarehouseSettings({
        variables: {
          warehouseId: warehouse.id,
          input: {
            low_stock_threshold: lowStockThreshold,
            expiry_warning_days: expiryWarningDays,
            allow_negative_stock: allowNegativeStock,
            allow_inbound_transfers: allowInboundTransfers,
            allow_outbound_transfers: allowOutboundTransfers,
            require_transfer_approval: requireTransferApproval,
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

  if (loading || loadingWarehouses) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500">Warehouse not found</p>
      </div>
    );
  }

  const isSaving = updatingWarehouse || updatingSettings;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings2 className="h-6 w-6 text-indigo-600" />
              Warehouse Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Configure general preferences, location, and access controls
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
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
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[500px]">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="danger">Danger</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Basic Information</CardTitle>
                </div>
                <CardDescription>
                  Identify this warehouse in your organization
                </CardDescription>
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
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Warehouse Type</Label>
                    <Select value={type} onValueChange={setType}>
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
                    <Select value={timezone} onValueChange={setTimezone}>
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
                    <Switch checked={isDefault} onCheckedChange={setIsDefault} />
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
                  <CardTitle>Address & Location</CardTitle>
                </div>
                <CardDescription>
                  Physical address for shipping and receiving
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input 
                    id="address" 
                    placeholder="123 Industrial Ave" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input 
                      id="state" 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal">Postal Code</Label>
                    <Input 
                      id="postal" 
                      value={postal}
                      onChange={(e) => setPostal(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input 
                      id="country" 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory & Transfer Settings */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-indigo-600" />
                        <CardTitle>Inventory Rules</CardTitle>
                    </div>
                    <CardDescription>Default settings for stock management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Low Stock Threshold</Label>
                            <Input 
                              type="number" 
                              value={lowStockThreshold}
                              onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                            />
                            <p className="text-xs text-muted-foreground">Alert when stock falls below this amount</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Expiry Warning (Days)
                            </Label>
                            <Input 
                              type="number" 
                              value={expiryWarningDays}
                              onChange={(e) => setExpiryWarningDays(parseInt(e.target.value) || 0)}
                            />
                            <p className="text-xs text-muted-foreground">Warn before items expire</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Allow Negative Stock</Label>
                            <p className="text-sm text-muted-foreground">Continue selling when out of stock</p>
                        </div>
                        <Switch 
                          checked={allowNegativeStock} 
                          onCheckedChange={setAllowNegativeStock}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5 text-indigo-600" />
                        <CardTitle>Transfer Rules</CardTitle>
                    </div>
                    <CardDescription>Configure stock transfer permissions for this warehouse</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Allow Inbound Transfers</Label>
                            <p className="text-sm text-muted-foreground">Accept stock from other warehouses</p>
                        </div>
                        <Switch 
                          checked={allowInboundTransfers} 
                          onCheckedChange={setAllowInboundTransfers}
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Allow Outbound Transfers</Label>
                            <p className="text-sm text-muted-foreground">Send stock to other warehouses</p>
                        </div>
                        <Switch 
                          checked={allowOutboundTransfers} 
                          onCheckedChange={setAllowOutboundTransfers}
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <div className="space-y-0.5">
                            <Label className="text-base">Require Transfer Approval</Label>
                            <p className="text-sm text-muted-foreground">Manager approval needed for transfers</p>
                        </div>
                        <Switch 
                          checked={requireTransferApproval} 
                          onCheckedChange={setRequireTransferApproval}
                        />
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Settings */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Staff & Manager</CardTitle>
                </div>
                <CardDescription>
                  View warehouse staff and manager assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {warehouse?.id && (
                  <WarehouseAccessList warehouseId={warehouse.id} companySlug={companySlug} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone */}
          <TabsContent value="danger" className="space-y-6">
            <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
              <CardHeader>
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <ShieldAlert className="h-5 w-5" />
                  <CardTitle>Danger Zone</CardTitle>
                </div>
                <CardDescription className="text-red-600/80 dark:text-red-400/80">
                  Irreversible actions for this warehouse
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="font-medium text-slate-900 dark:text-white">Archive Warehouse</p>
                        <p className="text-sm text-slate-500">Hide from lists but keep data intact.</p>
                    </div>
                    <Button variant="outline">Archive</Button>
                </div>
                <Separator className="bg-red-200 dark:bg-red-800/30" />
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="font-medium text-red-600 dark:text-red-400">Delete Warehouse</p>
                        <p className="text-sm text-red-600/70 dark:text-red-400/70">Permanently remove this warehouse and all associated stock data. This cannot be undone.</p>
                    </div>
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Warehouse
                    </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function WarehouseSettingsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <WarehouseSettingsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
