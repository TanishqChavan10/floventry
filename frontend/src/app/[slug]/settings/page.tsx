'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  CreditCard,
  Package,
  MapPin,
  Settings,
  Save,
  Loader2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import CompanyGuard from '@/components/CompanyGuard';

function CompanySettingsContent() {
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Company Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage your company details, preferences, and configuration.
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl mb-8">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm py-2.5 rounded-lg"
            >
              <Building2 className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="financial"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm py-2.5 rounded-lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Financial
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm py-2.5 rounded-lg"
            >
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger
              value="address"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm py-2.5 rounded-lg"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Address
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm py-2.5 rounded-lg"
            >
              <Settings className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSave}>
            {/* General Settings */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>
                    Basic details about your company that will appear on documents.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center group cursor-pointer hover:border-indigo-500 transition-colors">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Company Logo</h4>
                      <p className="text-xs text-slate-500">
                        Recommended size: 400x400px. Max size: 2MB.
                      </p>
                      <Button variant="outline" size="sm" type="button" className="mt-2">
                        Upload Logo
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <h4 className="font-medium">Team Management</h4>
                      <p className="text-sm text-slate-500">
                        Manage users, roles, and permissions.
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/${params?.slug}/settings/team`}>Manage Team</Link>
                    </Button>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input id="companyName" defaultValue="Acme Corp" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" placeholder="https://acme.com" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell us a bit about your company..."
                        className="resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Settings */}
            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Configuration</CardTitle>
                  <CardDescription>
                    Set up your currency and tax information for accurate reporting.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Base Currency</Label>
                      <Select defaultValue="usd">
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD ($)</SelectItem>
                          <SelectItem value="eur">EUR (€)</SelectItem>
                          <SelectItem value="gbp">GBP (£)</SelectItem>
                          <SelectItem value="inr">INR (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        This will be the default currency for all your products and reports.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID / GST / VAT Number</Label>
                      <Input id="taxId" placeholder="e.g. US-123456789" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Settings */}
            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Rules</CardTitle>
                  <CardDescription>
                    Configure thresholds and alerts for your stock management.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lowStock">Default Low Stock Threshold</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="lowStock"
                          type="number"
                          defaultValue="10"
                          className="max-w-[150px]"
                        />
                        <span className="text-sm text-slate-500">units</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Products below this quantity will be flagged as "Low Stock". You can
                        override this per product.
                      </p>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-generate POs</Label>
                        <p className="text-xs text-slate-500">
                          Automatically create draft Purchase Orders when stock hits 0.
                        </p>
                      </div>
                      <Select defaultValue="enabled">
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Address Settings */}
            <TabsContent value="address">
              <Card>
                <CardHeader>
                  <CardTitle>Company Address</CardTitle>
                  <CardDescription>
                    This address will be used for shipping and billing on invoices.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input id="street" placeholder="123 Business Ave" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="New York" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input id="state" placeholder="NY" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP / Postal Code</Label>
                      <Input id="zip" placeholder="10001" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select defaultValue="us">
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="in">India</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>System Preferences</CardTitle>
                  <CardDescription>Customize your workspace experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select defaultValue="utc">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utc">UTC (GMT+0)</SelectItem>
                          <SelectItem value="est">EST (GMT-5)</SelectItem>
                          <SelectItem value="pst">PST (GMT-8)</SelectItem>
                          <SelectItem value="ist">IST (GMT+5:30)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date Format</Label>
                      <Select defaultValue="mdy">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="mt-8 flex justify-end">
              <Button
                type="submit"
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Tabs>
      </div>
    </div>
  );
}

export default function CompanySettingsPage() {
  return (
    <CompanyGuard>
      <CompanySettingsContent />
    </CompanyGuard>
  );
}
