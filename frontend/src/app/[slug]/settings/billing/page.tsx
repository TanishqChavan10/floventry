'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check } from 'lucide-react';
import { usePlanTier } from '@/hooks/usePlanTier';
import { formatPlanPrice, pricingPlans } from '@/lib/billing/plans';

export default function BillingSettingsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { plan, isPro, isFree, loading } = usePlanTier();
  const currentTier = plan;
  const [yearly, setYearly] = useState(true);

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
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-muted/30 p-1">
            <button
              onClick={() => setYearly(false)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                !yearly
                  ? 'bg-background text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                yearly
                  ? 'bg-background text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground'
              }`}
            >
              Yearly
              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                Save 33%
              </span>
            </button>
          </div>
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
            {pricingPlans.map((p) => {
              const isCurrent = p.name === currentTier;
              const price = yearly ? p.yearlyPrice : p.monthlyPrice;
              return (
                <Card
                  key={p.id}
                  className={`relative flex h-full flex-col ${p.popular ? 'border-primary/60 shadow-lg' : ''}`}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {p.name}
                      </span>
                      {isCurrent && <Badge variant="secondary">Current Plan</Badge>}
                    </div>
                    <CardTitle className="text-2xl">{p.name}</CardTitle>
                    <CardDescription>{p.tagline}</CardDescription>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-foreground">
                        {formatPlanPrice(price)}
                      </span>
                      <span className="text-muted-foreground ml-2">/mo</span>
                    </div>
                    {price > 0 && yearly && (
                      <p className="mt-1 text-xs text-muted-foreground">Billed yearly</p>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <ul className="mb-6 space-y-3 flex-1">
                      {p.features.map((feature) => {
                        const isSeparator = feature.startsWith('Everything in');
                        if (isSeparator) {
                          return (
                            <li
                              key={feature}
                              className="pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                            >
                              {feature}
                            </li>
                          );
                        }

                        return (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isCurrent ? 'outline' : 'default'}
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'Current Plan' : p.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            All prices shown in INR. No credit card required for free trial.
          </p>
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
