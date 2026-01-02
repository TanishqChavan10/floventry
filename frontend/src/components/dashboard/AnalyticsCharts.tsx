'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnalyticsChartsProps {
  role: string;
}

export default function AnalyticsCharts({ role }: AnalyticsChartsProps) {
  const stockData = [
    { name: 'Electronics', stock: 4000, limit: 2400 },
    { name: 'Furniture', stock: 3000, limit: 1398 },
    { name: 'Clothing', stock: 2000, limit: 9800 },
    { name: 'Food', stock: 2780, limit: 3908 },
    { name: 'Books', stock: 1890, limit: 4800 },
    { name: 'Toys', stock: 2390, limit: 3800 },
  ];

  const flowData = [
    { name: 'Jan', in: 4000, out: 2400 },
    { name: 'Feb', in: 3000, out: 1398 },
    { name: 'Mar', in: 2000, out: 9800 },
    { name: 'Apr', in: 2780, out: 3908 },
    { name: 'May', in: 1890, out: 4800 },
    { name: 'Jun', in: 2390, out: 3800 },
  ];

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Analytics Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stock" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="stock">Inventory Levels</TabsTrigger>
            <TabsTrigger value="flow">Inflow vs Outflow</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stock" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="stock" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Current Stock" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="flow" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={flowData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="in" stroke="#4f46e5" strokeWidth={2} name="Stock In" />
                <Line type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={2} name="Stock Out" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
