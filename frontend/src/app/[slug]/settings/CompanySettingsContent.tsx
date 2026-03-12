'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, MapPin, Package, Lock, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CompanyProfileForm,
  BusinessInfoForm,
  InventorySettingsForm,
  ExpiryScannerCard,
  AccessSecurityForm,
} from '@/components/settings/forms';
import type { FormHandle } from '@/components/settings/forms/CompanyProfileForm';
import type { InventoryFormHandle } from '@/components/settings/forms/InventorySettingsForm';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, UserCog, CreditCard, Shield } from 'lucide-react';

interface CompanySettingsProps {
  company: any;
}

type ManagedTab = 'profile' | 'business' | 'inventory' | 'access';

export default function CompanySettingsContent({ company }: CompanySettingsProps) {
  const settings = company?.settings || {};
  const [, setTick] = useState(0); // forces re-render to re-evaluate dirty state

  // Refs to each form — all forms stay mounted (forceMount), so refs are always valid
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

  // Poll every 300ms so the Save button / dirty dots react on first keystroke
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 300);
    return () => clearInterval(id);
  }, []);

  const allRefs = Object.values(managedRefs);
  const anyDirty = allRefs.some((r) => r.current?.isDirty);
  const anySaving = allRefs.some((r) => r.current?.loading);

  // Save every tab that has unsaved changes in one click
  const handleSave = () => {
    for (const ref of allRefs) {
      if (ref.current?.isDirty) ref.current.submit();
    }
  };

  const tabDirty = (tab: ManagedTab) => managedRefs[tab].current?.isDirty ?? false;

  return (
    <div className="space-y-6">
      {/* Page header with Save button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Company Settings</h1>
        <Button onClick={handleSave} disabled={!anyDirty || anySaving}>
          {anySaving ? (
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
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto p-1 bg-muted rounded-lg">
          <TabsTrigger value="profile" className="flex-1 min-w-30">
            <Building2 className="w-4 h-4 mr-2" /> Profile
            {tabDirty('profile') && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="business" className="flex-1 min-w-30">
            <MapPin className="w-4 h-4 mr-2" /> Business Info
            {tabDirty('business') && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex-1 min-w-30">
            <Package className="w-4 h-4 mr-2" /> Inventory
            {tabDirty('inventory') && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="access" className="flex-1 min-w-30">
            <Lock className="w-4 h-4 mr-2" /> Access
            {tabDirty('access') && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            )}
          </TabsTrigger>
        </TabsList>

        {/*
          forceMount keeps every form mounted in the DOM even when its tab is
          inactive, so react-hook-form state is never lost on tab switch.
          data-[state=inactive]:hidden hides the panel visually without unmounting.
        */}
        <TabsContent forceMount value="profile" className="space-y-4 data-[state=inactive]:hidden">
          <CompanyProfileForm ref={profileRef} company={company} />
        </TabsContent>

        <TabsContent forceMount value="business" className="space-y-4 data-[state=inactive]:hidden">
          <BusinessInfoForm ref={businessRef} company={company} settings={settings} />
        </TabsContent>

        <TabsContent
          forceMount
          value="inventory"
          className="space-y-4 data-[state=inactive]:hidden"
        >
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

        <TabsContent forceMount value="access" className="space-y-4 data-[state=inactive]:hidden">
          <AccessSecurityForm ref={accessRef} companyId={company.id} settings={settings} />
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
