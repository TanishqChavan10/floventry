'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function BillingSettingsPage() {
  const params = useParams();
  const { user } = useAuth();
  const companySlug = params?.slug as string;
  const [currentPlan] = useState('Free');

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: ['1 warehouse', 'Up to 100 products', 'Basic reports', 'Email support'],
      icon: Zap,
      current: currentPlan === 'Free',
    },
    {
      name: 'Pro',
      price: '₹1,999',
      period: 'per month',
      description: 'For growing businesses',
      features: [
        'Unlimited warehouses',
        'Unlimited products',
        'Advanced reports & analytics',
        'Priority support',
        'API access',
        'Custom integrations',
      ],
      icon: Crown,
      current: currentPlan === 'Pro',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For large organizations',
      features: [
        'Everything in Pro',
        'Dedicated account manager',
        'Custom training',
        'SLA guarantee',
        'Advanced security',
        'Custom features',
      ],
      icon: Crown,
      current: currentPlan === 'Enterprise',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Billing & Subscription
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage your subscription plan and billing information
          </p>
        </div>

        {/* Current Plan Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>You are currently on the {currentPlan} plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{currentPlan}</p>
                <p className="text-sm text-slate-500">
                  {currentPlan === 'Free' ? 'No payment required' : 'Renews on Jan 1, 2026'}
                </p>
              </div>
              {currentPlan !== 'Enterprise' && (
                <Button className="bg-indigo-600 hover:bg-indigo-700">Upgrade Plan</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Available Plans
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${
                  plan.popular
                    ? 'border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-indigo-600">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <plan.icon className="w-8 h-8 text-indigo-600" />
                    {plan.current && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Current Plan
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-slate-500 ml-2">/ {plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.current ? 'outline' : 'default'}
                    disabled={plan.current}
                  >
                    {plan.current
                      ? 'Current Plan'
                      : plan.name === 'Enterprise'
                        ? 'Contact Sales'
                        : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
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
                <p className="font-medium text-slate-900 dark:text-white">
                  No payment method on file
                </p>
                <p className="text-sm text-slate-500">Add a payment method to upgrade your plan</p>
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
            <div className="text-center py-8 text-slate-500">No billing history available</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
