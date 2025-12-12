'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Download, Activity, User, Package, FileText, Settings } from 'lucide-react';

const mockAuditLogs = [
  {
    id: '1',
    timestamp: '2024-12-12 14:32:15',
    user: 'admin@company.com',
    action: 'Stock Updated',
    target: 'Industrial Safety Helmet (SKU: PRD-001)',
    warehouse: 'Main Warehouse',
    details: 'Quantity changed from 2400 to 2450',
    type: 'stock',
  },
  {
    id: '2',
    timestamp: '2024-12-12 13:15:42',
    user: 'manager@company.com',
    action: 'PO Approved',
    target: 'PO-2024-001',
    warehouse: 'South Warehouse',
    details: 'Purchase order approved for ₹1,25,000',
    type: 'purchase',
  },
  {
    id: '3',
    timestamp: '2024-12-12 11:48:23',
    user: 'staff@company.com',
    action: 'Product Added',
    target: 'LED Floodlight 200W (SKU: PRD-006)',
    warehouse: 'North Warehouse',
    details: 'New product added to catalog',
    type: 'product',
  },
  {
    id: '4',
    timestamp: '2024-12-12 10:22:11',
    user: 'admin@company.com',
    action: 'User Invited',
    target: 'newuser@company.com',
    warehouse: 'Company Level',
    details: 'User invited with MANAGER role',
    type: 'user',
  },
  {
    id: '5',
    timestamp: '2024-12-12 09:17:55',
    user: 'manager@company.com',
    action: 'Stock Transfer',
    target: 'Transfer #TRF-089',
    warehouse: 'Main Warehouse → South Warehouse',
    details: 'Transferred 150 units of Industrial Gloves',
    type: 'stock',
  },
  {
    id: '6',
    timestamp: '2024-12-11 16:45:30',
    user: 'admin@company.com',
    action: 'Settings Updated',
    target: 'Company Settings',
    warehouse: 'Company Level',
    details: 'Updated company tax configuration',
    type: 'settings',
  },
  {
    id: '7',
    timestamp: '2024-12-11 15:22:18',
    user: 'staff@company.com',
    action: 'Stock Movement',
    target: 'Steel Wire Rope 10mm',
    warehouse: 'Main Warehouse',
    details: 'Stock-out: 50 units for internal use',
    type: 'stock',
  },
  {
    id: '8',
    timestamp: '2024-12-11 14:10:05',
    user: 'manager@company.com',
    action: 'Warehouse Created',
    target: 'East Warehouse',
    warehouse: 'Company Level',
    details: 'New warehouse location added',
    type: 'warehouse',
  },
];

const getActionIcon = (type: string) => {
  const icons: Record<string, any> = {
    stock: Package,
    purchase: FileText,
    product: Package,
    user: User,
    settings: Settings,
    warehouse: Activity,
  };
  const Icon = icons[type] || Activity;
  return <Icon className="h-4 w-4" />;
};

const getActionColor = (type: string) => {
  const colors: Record<string, string> = {
    stock: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    purchase: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
    product: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    user: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
    settings: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    warehouse: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
  };
  return colors[type] || colors.settings;
};

function AuditLogContent() {
  return (
    <div>
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Audit Log
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Complete activity trail for your company
            </p>
          </div>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAuditLogs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Changes</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockAuditLogs.filter((log) => log.type === 'stock').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Actions</CardTitle>
              <User className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockAuditLogs.filter((log) => log.type === 'user').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PO Activities</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockAuditLogs.filter((log) => log.type === 'purchase').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search audit logs..." className="pl-9" />
                </div>
              </div>
              <Button variant="outline">Filter by Type</Button>
              <Button variant="outline">Filter by User</Button>
              <Button variant="outline">Date Range</Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAuditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                    <TableCell className="text-sm">{log.user}</TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {log.target}
                    </TableCell>
                    <TableCell className="text-sm">{log.warehouse}</TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {log.details}
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${getActionColor(log.type)}`}
                      >
                        {getActionIcon(log.type)}
                        <span className="text-xs font-medium capitalize">{log.type}</span>
                      </div>
                    </TableCell>
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

export default function AuditLogPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <AuditLogContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
