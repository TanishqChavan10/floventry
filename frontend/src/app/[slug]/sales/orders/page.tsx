'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSalesOrders } from '@/hooks/apollo';
import { CreateSalesOrderModal } from '@/components/sales/CreateSalesOrderModal';
import { Loader2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/sales/StatusBadge';
import { useAuth } from '@/context/auth-context';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { format } from 'date-fns';

function SalesOrdersContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companySlug = params.slug as string;

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, loading, error, refetch } = useSalesOrders();

  const salesOrders = data?.salesOrders || [];

  // Filter orders
  const filteredOrders = salesOrders.filter((order: any) => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesSearch =
      searchQuery === '' || order.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Check if user can create orders (OWNER, ADMIN, MANAGER)
  const activeCompany = user?.companies?.find((c) => c.isActive) || user?.companies?.[0];
  const userRole = activeCompany?.role;
  const canCreateOrder = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading sales orders: {error.message}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Sales Orders</h1>
              <p className="text-muted-foreground">Manage customer orders and track fulfillment</p>
            </div>
            {canCreateOrder && (
              <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Order
              </Button>
            )}
          </div>
        </div>
        {/* Summary Stats */}
        <div className="container mx-auto px-6 pb-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesOrders.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesOrders.filter((o: any) => o.status === 'DRAFT').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Confirmed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesOrders.filter((o: any) => o.status === 'CONFIRMED').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesOrders.filter((o: any) => o.status === 'CLOSED').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Expected Dispatch</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No sales orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order: any) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm font-semibold">
                        {order.order_number}
                      </TableCell>
                      <TableCell className="font-medium">{order.customer_name}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>{order.items?.length || 0} items</TableCell>
                      <TableCell>
                        {order.expected_dispatch_date
                          ? format(new Date(order.expected_dispatch_date), 'dd MMM yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>{format(new Date(order.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{order.creator?.fullName || 'Unknown'}</TableCell>
                      <TableCell>
                        <Link href={`/${companySlug}/sales/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Create Sales Order Modal */}
      <CreateSalesOrderModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default function SalesOrdersPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <SalesOrdersContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
