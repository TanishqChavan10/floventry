'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useParams, useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Eye, FileText, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { GET_PURCHASE_ORDERS } from '@/lib/graphql/purchase-orders';
import Link from 'next/link';

// Status badge helper
const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: any; label: string; icon: any }> = {
    DRAFT: { variant: 'secondary', label: 'Draft', icon: FileText },
    ORDERED: { variant: 'default', label: 'Ordered', icon: Package },
    CLOSED: { variant: 'outline', label: 'Closed', icon: CheckCircle },
    CANCELLED: { variant: 'destructive', label: 'Cancelled', icon: XCircle },
  };
  const item = config[status] || config.DRAFT;
  const Icon = item.icon;
  return (
    <Badge variant={item.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {item.label}
    </Badge>
  );
};

function CompanyPurchaseOrdersContent() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params?.slug as string;

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch purchase orders
  const { data, loading, error } = useQuery(GET_PURCHASE_ORDERS, {
    variables: {
      filters: {
        ...(statusFilter !== 'all' && { status: statusFilter }),
        limit: 100,
        offset: 0,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  const purchaseOrders = data?.purchaseOrders || [];

  // Filter POs by search query (client-side)
  const filteredPOs = purchaseOrders.filter((po: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      po.po_number.toLowerCase().includes(query) ||
      po.supplier?.name?.toLowerCase().includes(query) ||
      po.warehouse?.name?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const totalPOs = purchaseOrders.length;
  const draftCount = purchaseOrders.filter((po: any) => po.status === 'DRAFT').length;
  const orderedCount = purchaseOrders.filter((po: any) => po.status === 'ORDERED').length;
  const closedCount = purchaseOrders.filter((po: any) => po.status === 'CLOSED').length;

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold">Failed to load purchase orders</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{error.message}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Purchase Orders
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage purchase orders across all warehouses
              </p>
            </div>
            <Link href={`/${companySlug}/purchase-orders/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create PO
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total POs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPOs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{draftCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ordered</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{orderedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{closedCount}</div>
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
                  <Input
                    placeholder="Search by PO number, supplier, warehouse..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ORDERED">Ordered</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders ({filteredPOs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPOs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No purchase orders found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first purchase order to get started'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Link href={`/${companySlug}/purchase-orders/new`}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First PO
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.map((po: any) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {po.po_number}
                      </TableCell>
                      <TableCell>{po.warehouse?.name || 'N/A'}</TableCell>
                      <TableCell>{po.supplier?.name || 'N/A'}</TableCell>
                      <TableCell>{po.items?.length || 0} items</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {po.user?.fullName || 'System'}
                      </TableCell>
                      <TableCell>{formatDate(po.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/${companySlug}/purchase-orders/${po.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function CompanyPurchaseOrdersPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <CompanyPurchaseOrdersContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
