'use client';

import React, { useState } from 'react';
import {
  Factory,
  Store,
  Wrench,
  Warehouse,
  Plus,
  MapPin,
  Box,
  MoreVertical,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWarehouse, WarehouseType } from '@/context/warehouse-context';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/context/auth-context';

export default function WarehousesPage() {
  const { warehouses, addWarehouse, setActiveWarehouseId } = useWarehouse();
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<WarehouseType>('MAIN');
  const [newAddress, setNewAddress] = useState('');

  // Derive simple role info for the header
  const companyId = user?.activeCompanyId;
  const activeCompany = user?.companies?.find((c) => c.id === companyId);
  const companyName = activeCompany?.name || 'My Company';
  const role = activeCompany?.role || 'viewer';

  const handleCreate = () => {
    if (!newName || !newAddress) {
      toast.error('Please fill in all fields');
      return;
    }

    addWarehouse({
      name: newName,
      type: newType,
      address: newAddress,
    });

    toast.success('Warehouse created successfully');
    setIsAddOpen(false);
    setNewName('');
    setNewAddress('');
    setNewType('MAIN');
  };

  const getIcon = (type: WarehouseType) => {
    switch (type) {
      case 'MAIN':
        return Factory;
      case 'RETAIL':
        return Store;
      case 'SERVICE_CENTER':
        return Wrench;
      case 'KIOSK':
        return Store; // Reusing store icon for Kiosk for now
      default:
        return Warehouse;
    }
  };

  const filteredWarehouses = warehouses.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <DashboardHeader companyName={companyName} role={role} onRoleChange={() => {}} />
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your physical storage locations and distribution centers.
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
              <DialogDescription>
                Create a new location to track inventory separately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Warehouse Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Downtown Retail Store"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Location Type</Label>
                <Select
                  value={newType}
                  onValueChange={(val) => setNewType(val as WarehouseType)}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="e.g. 123 Market St, Pune"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
                Create Warehouse
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search warehouses..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWarehouses.map((warehouse) => {
          const Icon = getIcon(warehouse.type);
          return (
            <Card
              key={warehouse.id}
              className="group hover:border-indigo-500/50 transition-all duration-300 hover:shadow-md cursor-pointer"
              onClick={() => {
                setActiveWarehouseId(warehouse.id);
                toast.info(`Switched to ${warehouse.name}`);
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {warehouse.name}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{warehouse.address}</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="secondary" className="font-normal">
                    {warehouse.type.replace('_', ' ')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      </main>
    </div>
  );
}
