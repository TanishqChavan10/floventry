'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, MapPin, Package, AlertTriangle, Lock, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CompanyProfileForm,
  BusinessInfoForm,
  InventorySettingsForm,
  ExpiryScannerCard,
  AccessSecurityForm,
  DangerZone,
} from '@/components/settings/forms';
import type { FormHandle } from '@/components/settings/forms/CompanyProfileForm';
import type { InventoryFormHandle } from '@/components/settings/forms/InventorySettingsForm';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, UserCog, CreditCard, Shield } from 'lucide-react';

interface CompanySettingsProps {
  company: any;
}

// Tabs that have a managed forwardRef form
type ManagedTab = 'profile' | 'business' | 'inventory' | 'access';

export default function CompanySettingsContent({ company }: CompanySettingsProps) {
  const settings = company?.settings || {};
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [tick, setTick] = useState(0); // forces re-render to re-evaluate isDirty

  // Refs to each form
  const profileRef = useRef<FormHandle>(null);
  const businessRef = useRef<FormHandle>(null);
  const inventoryRef = useRef<InventoryFormHandle>(null);
  const accessRef = useRef<FormHandle>(null);

  const managedRefs: Record<
    ManagedTab,
    React.RefObject<FormHandle | InventoryFormHandle | null>
  > = {
    profile: profileRef,
    business: businessRef,
    inventory: inventoryRef,
    access: accessRef,
  };

  const isManagedTab = (tab: string): tab is ManagedTab => tab in managedRefs;

  const activeRef = isManagedTab(activeTab) ? managedRefs[activeTab].current : null;
  const isDirty = activeRef?.isDirty ?? false;
  const isSaving = activeRef?.loading ?? false;

  // Re-check dirty state periodically so button enables on first keystroke
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 300);
    return () => clearInterval(id);
  }, []);

  const handleSave = () => {
    if (activeRef) activeRef.submit();
  };

  return (
    <div className="space-y-6">
      {/* Page header with Save button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Company Settings</h1>
        {isManagedTab(activeTab) && (
          <Button onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-6" onValueChange={(v) => setActiveTab(v)}>
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
          <TabsTrigger value="access" className="flex-1 min-w-30">
            <Lock className="w-4 h-4 mr-2" /> Access
          </TabsTrigger>
          <TabsTrigger
            value="danger"
            className="flex-1 min-w-30 text-destructive data-[state=active]:text-destructive data-[state=active]:bg-destructive/10"
          >
            <AlertTriangle className="w-4 h-4 mr-2" /> Danger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <CompanyProfileForm ref={profileRef} company={company} />
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <BusinessInfoForm ref={businessRef} company={company} settings={settings} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <InventorySettingsForm
            ref={inventoryRef}
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

        <TabsContent value="access" className="space-y-4">
          <AccessSecurityForm ref={accessRef} companyId={company.id} settings={settings} />
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <DangerZone companyId={company.id} />
        </TabsContent>
      </Tabs>

      {/* Bottom nav cards */}
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
              <CardTitle className="text-base font-semibold">Billing &amp; Plans</CardTitle>
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
