'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function UsageSummary() {
  // Mock data
  const usage = [
    { label: 'Inventory Items', used: 450, limit: 1000 },
    { label: 'Warehouses', used: 2, limit: 5 },
    { label: 'Team Members', used: 4, limit: 10 },
    { label: 'API Calls', used: 15420, limit: 50000 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Summary</CardTitle>
        <CardDescription>
          Track your resource usage against your plan limits.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {usage.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">
                {item.used.toLocaleString()} / {item.limit.toLocaleString()}
              </span>
            </div>
            <Progress value={(item.used / item.limit) * 100} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
