'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

const reportCategories = [
  {
    title: 'Inventory Reports',
    description: 'Stock levels, valuation, and inventory analytics',
    icon: Package,
    href: '/reports/inventory',
    color: 'bg-blue-500',
    stats: '12 reports available',
  },
  {
    title: 'Expiry Reports',
    description: 'Track upcoming expirations and expiry alerts',
    icon: AlertTriangle,
    href: '/reports/expiry',
    color: 'bg-orange-500',
    stats: '8 reports available',
  },
  {
    title: 'Purchase Reports',
    description: 'Purchase order analytics and supplier performance',
    icon: ShoppingCart,
    href: '/reports/purchase',
    color: 'bg-green-500',
    stats: '10 reports available',
  },
];

const quickStats = [
  {
    title: 'Total Reports Generated',
    value: '156',
    change: '+12% from last month',
    icon: BarChart3,
  },
  {
    title: 'Scheduled Reports',
    value: '8',
    change: 'Active subscriptions',
    icon: Calendar,
  },
  {
    title: 'Most Viewed',
    value: 'Inventory Valuation',
    change: '45 views this month',
    icon: TrendingUp,
  },
];

function ReportsContent() {
  const params = useParams();
  const companySlug = params.slug as string;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Reports & Analytics
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Comprehensive insights into your inventory, purchases, and operations
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          {quickStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Categories */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Report Categories
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {reportCategories.map((category, index) => (
              <Link key={index} href={`/${companySlug}${category.href}`}>
                <Card className="hover:shadow-lg transition-all hover:border-indigo-500 cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        className={`${category.color} p-3 rounded-lg text-white flex items-center justify-center`}
                      >
                        <category.icon className="h-6 w-6" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-400" />
                    </div>
                    <CardTitle className="mt-4">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                      {category.stats}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Recently Generated
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  {
                    name: 'Monthly Inventory Valuation',
                    type: 'Inventory',
                    date: '2024-12-11',
                    size: '2.4 MB',
                  },
                  {
                    name: 'Expiry Alert Report',
                    type: 'Expiry',
                    date: '2024-12-10',
                    size: '1.1 MB',
                  },
                  {
                    name: 'Supplier Performance Q4',
                    type: 'Purchase',
                    date: '2024-12-09',
                    size: '3.2 MB',
                  },
                ].map((report, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{report.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {report.type} • {report.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600 dark:text-slate-400">{report.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <ReportsContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
