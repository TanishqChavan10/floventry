'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export function PlanOverview() {
  // Mock data
  const plan = {
    name: 'Pro Plan',
    status: 'Active',
    price: '$49.00',
    interval: 'month',
    renewalDate: '2024-01-15',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the <span className="font-semibold text-foreground">{plan.name}</span>.
          </CardDescription>
        </div>
        <Badge variant={plan.status === 'Active' ? 'default' : 'destructive'}>
          {plan.status}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {plan.price}
            <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Renews on {new Date(plan.renewalDate).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href="/billing/upgrade" className="flex-1">
            <Button className="w-full">Upgrade Plan</Button>
          </Link>
          <Button variant="outline" className="flex-1">
            Cancel Subscription
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
