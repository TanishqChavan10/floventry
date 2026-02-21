'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, MapPin, Package, AlertTriangle, Bell } from 'lucide-react';
import {
  CompanyProfileForm,
  BusinessInfoForm,
  InventorySettingsForm,
  ExpiryScannerCard,
  NotificationSettingsForm,
  DangerZone,
} from './components';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, UserCog, CreditCard, Shield } from 'lucide-react';

interface CompanySettingsProps {
  company: any;
}

export default function CompanySettingsContent({ company }: CompanySettingsProps) {
  const settings = company?.settings || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Company Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto p-1 bg-muted rounded-lg">
          <TabsTrigger value="profile" className="flex-1 min-w-30">
            <Building2 className="w-4 h-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="business" className="flex-1 min-w-30">
            <MapPin className="w-4 h-4 mr-2" /> Business Info
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex-1 min-w-30">
            <Package className="w-4 h-4 mr-2" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 min-w-30">
            <Bell className="w-4 h-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger
            value="danger"
            className="flex-1 min-w-30 text-destructive data-[state=active]:text-destructive data-[state=active]:bg-destructive/10"
          >
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
          <InventorySettingsForm
            companyId={company.id}
            settings={settings}
            barcodeSettings={{
              barcodePrefix: company?.barcodePrefix,
              barcodePadding: company?.barcodePadding,
              barcodeNextNumber: company?.barcodeNextNumber,
              barcodeSuffix: company?.barcodeSuffix,
            }}
          />
          <ExpiryScannerCard />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettingsForm companyId={company.id} settings={settings} />
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <DangerZone companyId={company.id} />
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 pt-6 border-t border-border">
        <Link href={`/${company.slug}/settings/team`}>
          <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Team Management</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Invite users, manage members and remove access.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${company.slug}/settings/roles`}>
          <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Role Definitions</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View the fixed permission model for each role.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${company.slug}/settings/billing`}>
          <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Billing & Plans</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage subscription, payment methods and invoices.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${company.slug}/audit-log`}>
          <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Audit Log</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View a read-only history of all actions and changes.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
