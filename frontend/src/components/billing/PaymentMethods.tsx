'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Trash2, Plus } from 'lucide-react';

export function PaymentMethods() {
  // Mock data
  const cards = [
    { id: '1', brand: 'Visa', last4: '4242', expiry: '12/24', isDefault: true },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage your payment cards.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Add Card
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {cards.map((card) => (
          <div key={card.id} className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-14 rounded bg-muted flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">
                  {card.brand} ending in {card.last4}
                </p>
                <p className="text-sm text-muted-foreground">
                  Expires {card.expiry} {card.isDefault && '(Default)'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
