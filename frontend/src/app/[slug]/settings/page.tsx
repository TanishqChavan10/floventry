'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, CreditCard, Bell, Shield, Palette, ChevronRight } from 'lucide-react';

export default function CompanySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params?.slug as string;

  const settingsCategories = [
    {
      icon: Building2,
      title: 'Company Profile',
      description: 'Manage your company information, logo, and details',
      action: 'Edit Profile',
      onClick: () => {
        // Handle inline editing or modal
      },
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Invite members, manage roles and permissions',
      action: 'Manage Team',
      onClick: () => router.push(`/${companySlug}/settings/team`),
    },
    {
      icon: CreditCard,
      title: 'Billing & Subscription',
      description: 'View plans, payment methods, and invoices',
      action: 'View Billing',
      onClick: () => router.push(`/${companySlug}/settings/billing`),
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure email and in-app notifications',
      action: 'Configure',
      onClick: () => {
        // Handle notification settings
      },
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Two-factor authentication and security settings',
      action: 'Manage Security',
      onClick: () => {
        // Handle security settings
      },
    },
    {
      icon: Palette,
      title: 'Preferences',
      description: 'Theme, language, and display preferences',
      action: 'Customize',
      onClick: () => {
        // Handle preferences
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Company Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage your company settings and preferences
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {settingsCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                    <category.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription className="mt-1">{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  onClick={category.onClick}
                >
                  {category.action}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
