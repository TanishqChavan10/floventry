'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, TrendingUp, Clock, CheckCircle, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockSupplierPerformance = [
  {
    supplier: 'SafeGuard Industries',
    totalOrders: 128,
    totalSpend: '₹56,80,000',
    avgDeliveryTime: '5 days',
    onTimeDelivery: 95,
    rating: 4.8,
  },
  {
    supplier: 'MetalCraft Ltd',
    totalOrders: 89,
    totalSpend: '₹42,30,000',
    avgDeliveryTime: '6 days',
    onTimeDelivery: 88,
    rating: 4.5,
  },
  {
    supplier: 'TechTools Co',
    totalOrders: 156,
    totalSpend: '₹68,90,000',
    avgDeliveryTime: '4 days',
    onTimeDelivery: 98,
    rating: 4.9,
  },
  {
    supplier: 'BrightLight Systems',
    totalOrders: 72,
    totalSpend: '₹38,50,000',
    avgDeliveryTime: '7 days',
    onTimeDelivery: 82,
    rating: 4.6,
  },
];

const monthlyPurchases = [
  { month: 'Aug 2024', orders: 45, amount: '₹18,50,000' },
  { month: 'Sep 2024', orders: 52, amount: '₹21,30,000' },
  { month: 'Oct 2024', orders: 48, amount: '₹19,80,000' },
  { month: 'Nov 2024', orders: 58, amount: '₹24,60,000' },
  { month: 'Dec 2024', orders: 42, amount: '₹22,10,000' },
];

function PurchaseReportsContent() {
  const totalOrders = mockSupplierPerformance.reduce((sum, s) => sum + s.totalOrders, 0);
  const totalSpend = mockSupplierPerformance.reduce((sum, s) => {
    const value = parseInt(s.totalSpend.replace(/[₹,]/g, ''));
    return sum + value;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Purchase Reports
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Purchase order analytics and supplier performance metrics
              </p>
            </div>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +15% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(totalSpend / 100).toFixed(2)}L</div>
              <p className="text-xs text-muted-foreground mt-1">This quarter</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5.5 days</div>
              <p className="text-xs text-green-600 mt-1">-0.5 days improvement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">91%</div>
              <p className="text-xs text-muted-foreground mt-1">Average across suppliers</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Purchase Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyPurchases.map((month, index) => {
                  const prevAmount =
                    index > 0
                      ? parseInt(monthlyPurchases[index - 1].amount.replace(/[₹,]/g, ''))
                      : 0;
                  const currentAmount = parseInt(month.amount.replace(/[₹,]/g, ''));
                  const growth = prevAmount
                    ? (((currentAmount - prevAmount) / prevAmount) * 100).toFixed(1)
                    : '0';

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell>{month.orders}</TableCell>
                      <TableCell className="font-semibold">{month.amount}</TableCell>
                      <TableCell>
                        <span
                          className={
                            parseFloat(growth) >= 0 ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {parseFloat(growth) >= 0 ? '+' : ''}
                          {growth}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Supplier Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead>Avg Delivery</TableHead>
                  <TableHead>On-Time %</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSupplierPerformance
                  .sort((a, b) => b.rating - a.rating)
                  .map((supplier, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{supplier.supplier}</TableCell>
                      <TableCell>{supplier.totalOrders}</TableCell>
                      <TableCell className="font-semibold">{supplier.totalSpend}</TableCell>
                      <TableCell>{supplier.avgDeliveryTime}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              supplier.onTimeDelivery >= 95
                                ? 'text-green-600'
                                : supplier.onTimeDelivery >= 85
                                ? 'text-orange-600'
                                : 'text-red-600'
                            }
                          >
                            {supplier.onTimeDelivery}%
                          </span>
                          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                supplier.onTimeDelivery >= 95
                                  ? 'bg-green-600'
                                  : supplier.onTimeDelivery >= 85
                                  ? 'bg-orange-600'
                                  : 'bg-red-600'
                              }`}
                              style={{ width: `${supplier.onTimeDelivery}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{supplier.rating} ⭐</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function PurchaseReportsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <PurchaseReportsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
