'use client';

import React from 'react';
import { AlertTriangle, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AlertsSectionProps {
  role: string;
}

export default function AlertsSection({ role }: AlertsSectionProps) {
  // Mock Alerts
  const alerts = [
    {
      id: 1,
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: 'Wireless Mouse (WM-001) is below reorder level (5 remaining).',
      severity: 'high',
      icon: AlertTriangle,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
    },
    {
      id: 2,
      type: 'expiry',
      title: 'Expiry Warning',
      message: 'Batch #452 of "Printer Ink" expires in 15 days.',
      severity: 'medium',
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      id: 3,
      type: 'approval',
      title: 'Pending Approval',
      message: 'Purchase Order #PO-2024-001 requires manager approval.',
      severity: 'medium',
      icon: AlertCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
    },
  ];

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications & Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium">All systems healthy</h3>
            <p className="text-sm text-slate-500">No pending alerts or warnings.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Action Required</CardTitle>
        <Badge variant="secondary">{alerts.length} New</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-4 p-4 rounded-lg border ${alert.bg} ${alert.border}`}
          >
            <alert.icon className={`h-5 w-5 mt-0.5 ${alert.color}`} />
            <div className="flex-1">
              <h4 className={`text-sm font-semibold ${alert.color}`}>{alert.title}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {alert.message}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="xs" variant="outline" className="bg-white dark:bg-slate-900">
                  View Details
                </Button>
                <Button size="xs" variant="ghost">
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
