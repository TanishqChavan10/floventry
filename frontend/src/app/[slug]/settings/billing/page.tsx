'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Crown, Shield } from 'lucide-react';
import { usePlanTier } from '@/hooks/usePlanTier';

export default function BillingSettingsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { plan, isPro, loading } = usePlanTier();

  const plans = [
    {
      name: 'Standard',
      tier: 'Standard' as const,
      price: '₹0',
      period: 'forever',
      description: 'Basic automated protection to keep your inventory safe.',
      features: [
        'Daily expiry scan (midnight UTC)',
        'Expired & expiring-soon detection',
        'In-app notifications',
        'Dashboard expiry risk indicators',
        'Manual "Trigger Scan" (Owner / Admin)',
        'Fixed 30-day warning window',
      ],
      icon: Shield,
    },
    {
      name: 'Pro',
      tier: 'Pro' as const,
      price: '₹1,999',
      period: 'per month',
      description: 'Proactive monitoring and advanced expiry control for growing operations.',
      features: [
        'Everything in Standard',
        'Custom expiry warning windows (15 / 30 / 60 days)',
        'Email notifications & summaries',
        'Warehouse-specific alert configuration',
        'Expiry risk export (CSV/Excel)',
        'Historical expiry trend reports',
        'Enhanced scan scheduling',
      ],
      icon: Crown,
      popular: true,
    },
  ];

  const currentTier = plan;

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
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
              <div>
                <p className="text-2xl font-bold text-foreground">{currentTier}</p>
                <p className="text-sm text-muted-foreground">
                  {isPro ? 'Renews monthly' : 'No payment required'}
                </p>
              </div>
              {!isPro && <Button>Upgrade to Pro</Button>}
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Available Plans</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((p) => {
              const isCurrent = p.tier === currentTier;
              return (
                <Card
                  key={p.name}
                  className={`relative ${p.popular ? 'border-primary/60 shadow-lg' : ''}`}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge>Recommended</Badge>
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
                      {isCurrent ? 'Current Plan' : 'Upgrade'}
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
