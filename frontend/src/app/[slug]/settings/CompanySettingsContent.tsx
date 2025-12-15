'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  MapPin, 
  Package, 
  ShoppingCart, 
  Bell, 
  ShieldCheck, 
  Activity, 
  AlertTriangle 
} from 'lucide-react';
import { 
  CompanyProfileForm, 
  BusinessInfoForm, 
  InventorySettingsForm, 
  PurchaseOrderSettingsForm, 
  NotificationSettingsForm, 
  AccessSecurityForm, 
  AuditActivityForm, 
  DangerZone 
} from './components';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, UserCog, CreditCard } from 'lucide-react';

interface CompanySettingsProps {
  company: any;
}

export default function CompanySettingsContent({ company }: CompanySettingsProps) {
  const settings = company?.settings || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Company Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Manage your organization's preferences and configuration.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <TabsTrigger value="profile" className="flex-1 min-w-[120px]">
            <Building2 className="w-4 h-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="business" className="flex-1 min-w-[120px]">
            <MapPin className="w-4 h-4 mr-2" /> Business Info
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex-1 min-w-[120px]">
            <Package className="w-4 h-4 mr-2" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="purchasing" className="flex-1 min-w-[120px]">
            <ShoppingCart className="w-4 h-4 mr-2" /> Purchasing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 min-w-[120px]">
            <Bell className="w-4 h-4 mr-2" /> Alerts
          </TabsTrigger>
          <TabsTrigger value="access" className="flex-1 min-w-[120px]">
            <ShieldCheck className="w-4 h-4 mr-2" /> Access
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex-1 min-w-[120px]">
            <Activity className="w-4 h-4 mr-2" /> Audit
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex-1 min-w-[120px] text-red-500 data-[state=active]:text-red-600 data-[state=active]:bg-red-50 dark:data-[state=active]:bg-red-950/20">
            <AlertTriangle className="w-4 h-4 mr-2" /> Danger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <CompanyProfileForm company={company} />
        </TabsContent>
        
        <TabsContent value="business" className="space-y-4">
          <BusinessInfoForm company={company} settings={settings} />
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          <InventorySettingsForm companyId={company.id} settings={settings} />
        </TabsContent>
        
        <TabsContent value="purchasing" className="space-y-4">
          <PurchaseOrderSettingsForm companyId={company.id} settings={settings} />
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettingsForm companyId={company.id} settings={settings} />
        </TabsContent>
        
        <TabsContent value="access" className="space-y-4">
          <AccessSecurityForm companyId={company.id} settings={settings} />
        </TabsContent>
        
        <TabsContent value="audit" className="space-y-4">
          <AuditActivityForm companyId={company.id} settings={settings} />
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <DangerZone companyId={company.id} />
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-3 pt-6 border-t border-slate-200 dark:border-slate-800">
        <Link href={`/${company.slug}/settings/team`}>
          <Card className="hover:border-indigo-500 transition-all cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Team Management</CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Invite users, manage members and remove access.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${company.slug}/settings/roles`}>
          <Card className="hover:border-indigo-500 transition-all cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Roles & Permissions</CardTitle>
              <UserCog className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Configure custom roles and granular permissions.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${company.slug}/settings/billing`}>
          <Card className="hover:border-indigo-500 transition-all cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Billing & Plans</CardTitle>
              <CreditCard className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Manage subscription, payment methods and invoices.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
