'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';

interface MovementSummaryCardsProps {
  stats: {
    in: number;
    out: number;
    adjustments: number;
  };
}

export default function MovementSummaryCards({ stats }: MovementSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Total Stock In (Today)
          </CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">+{stats.in}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Items added to inventory
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Total Stock Out (Today)
          </CardTitle>
          <ArrowUpRight className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">-{stats.out}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Items removed from inventory
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Total Adjustments (Today)
          </CardTitle>
          <RefreshCw className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.adjustments}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manual corrections made
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
