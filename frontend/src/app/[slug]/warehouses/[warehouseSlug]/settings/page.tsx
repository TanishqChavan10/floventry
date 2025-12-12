'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building, MapPin, Users } from 'lucide-react';

function WarehouseSettingsContent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Warehouse Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage warehouse details and configuration
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6 max-w-4xl">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-indigo-600" />
              <CardTitle>Basic Information</CardTitle>
            </div>
            <CardDescription>Update warehouse name and details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Warehouse Name</Label>
              <Input id="name" placeholder="Main Warehouse" defaultValue="Main Warehouse" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Warehouse Code</Label>
              <Input id="code" placeholder="WH-001" defaultValue="WH-001" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <CardTitle>Location</CardTitle>
            </div>
            <CardDescription>Warehouse address and location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Street address"
                defaultValue="123 Industrial Ave"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Mumbai" defaultValue="Mumbai" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" placeholder="400001" defaultValue="400001" />
              </div>
            </div>
            <Button>Update Location</Button>
          </CardContent>
        </Card>

        {/* Staff Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <CardTitle>Staff Assignments</CardTitle>
            </div>
            <CardDescription>Manage warehouse manager and staff</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Warehouse Manager</Label>
              <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                <p className="font-medium text-slate-900 dark:text-white">Rajesh Kumar</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  rajesh.kumar@company.com
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Staff Count</Label>
              <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                <p className="font-medium text-slate-900 dark:text-white">12 Staff Members</p>
              </div>
            </div>
            <Button variant="outline">Manage Staff</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function WarehouseSettingsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['MANAGER']}>
        <WarehouseSettingsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
