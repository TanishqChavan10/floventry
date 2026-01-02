'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function PricingTable() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for getting started',
      features: ['Up to 100 Inventory Items', '1 Warehouse', '1 Team Member', 'Basic Reports'],
      current: false,
    },
    {
      name: 'Starter',
      price: '$29',
      description: 'For growing businesses',
      features: ['Up to 1,000 Inventory Items', '3 Warehouses', '5 Team Members', 'Advanced Reports', 'Email Support'],
      current: false,
    },
    {
      name: 'Pro',
      price: '$49',
      description: 'For scaling operations',
      features: ['Unlimited Inventory Items', '10 Warehouses', 'Unlimited Team Members', 'Audit Logs', 'Integrations', 'Priority Support'],
      current: true,
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      features: ['Unlimited Everything', 'Dedicated Account Manager', 'SLA', 'Custom Integrations', 'SSO'],
      current: false,
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
      {plans.map((plan) => (
        <Card key={plan.name} className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{plan.name}</CardTitle>
              {plan.popular && <Badge>Most Popular</Badge>}
            </div>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-3xl font-bold mb-6">
              {plan.price}
              {plan.price !== 'Custom' && <span className="text-sm font-normal text-muted-foreground">/month</span>}
            </div>
            <ul className="space-y-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant={plan.current ? 'outline' : 'default'} disabled={plan.current}>
              {plan.current ? 'Current Plan' : plan.price === 'Custom' ? 'Contact Sales' : 'Upgrade'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
