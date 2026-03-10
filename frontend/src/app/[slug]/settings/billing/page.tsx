'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Crown, Shield, Zap } from 'lucide-react';
import { usePlanTier } from '@/hooks/usePlanTier';

export default function BillingSettingsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { plan, isPro, isFree, loading } = usePlanTier();

  const plans = [
    {
      name: 'Free',
      tier: 'Free' as const,
      price: '₹0',
      period: 'forever',
      description: 'Everything you need for basic inventory management.',
      features: [
        'Full inventory CRUD & FEFO/FIFO',
        'Stock lots, expiry blocking & GRN',
        'Issue notes & warehouse transfers',
        'Purchase & sales order lifecycle',
        'Dashboard, alerts & low stock view',
        '1 warehouse, 2 members, 100 SKUs',
      ],
      icon: Shield,
    },
    {
      name: 'Standard',
      tier: 'Standard' as const,
      price: '₹1,499',
      period: 'per month',
      description: 'Automation, exports, and moderate intelligence for growing teams.',
      features: [
        'Everything in Free',
        'CSV imports & exports (all types)',
        'Barcode label PDF generation',
        'Point of Sale scanner',
        'Company overview & movements reports',
        'Manual expiry scan trigger',
        'Up to 3 warehouses, 5 members, 500 SKUs',
      ],
      icon: Zap,
      popular: false,
    },
    {
      name: 'Pro',
      tier: 'Pro' as const,
      price: '₹3,499',
      period: 'per month',
      description: 'Advanced analytics, full audit trail, and unlimited scale.',
      features: [
        'Everything in Standard',
        'Unlimited warehouses, members & SKUs',
        'Advanced stock health & adjustment reports',
        'Purchase & sales order analytics',
        'Full audit log & compliance trail',
        'Company-level CSV exports',
        'Custom expiry warning windows',
        'Advanced company settings',
      ],
      icon: Crown,
      popular: true,
    },
  ];

  const currentTier = plan;

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
            <Link href={`/${slug}/settings`} className="inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Go back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription plan and billing information
          </p>
        </div>

        {/* Current Plan Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `You are currently on the ${currentTier} plan`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-2xl font-bold text-foreground">{currentTier}</p>
                  <p className="text-sm text-muted-foreground">
                    {isPro ? 'Renews monthly' : isFree ? 'No payment required' : 'Renews monthly'}
                  </p>
                </div>
              </div>
              {!isPro && (
                <Badge variant="outline" className="text-xs">
                  {isFree ? 'Upgrade for more features' : 'Upgrade to Pro for full access'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Available Plans</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p) => {
              const isCurrent = p.tier === currentTier;
              return (
                <Card
                  key={p.name}
                  className={`relative ${p.popular ? 'border-primary/60 shadow-lg' : ''}`}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge>Best Value</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <p.icon className="w-8 h-8 text-primary" />
                      {isCurrent && <Badge variant="secondary">Current Plan</Badge>}
                    </div>
                    <CardTitle className="text-2xl">{p.name}</CardTitle>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-foreground">{p.price}</span>
                      <span className="text-muted-foreground ml-2">/ {p.period}</span>
                    </div>
                    <CardDescription className="mt-2">{p.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {p.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isCurrent ? 'outline' : 'default'}
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'Current Plan' : `Upgrade to ${p.name}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">No payment method on file</p>
                <p className="text-sm text-muted-foreground">
                  Add a payment method to upgrade your plan
                </p>
              </div>
              <Button variant="outline">Add Payment Method</Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View your past invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No billing history available
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
