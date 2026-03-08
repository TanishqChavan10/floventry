'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/role-guard';
import { useRbac } from '@/hooks/use-rbac';
import { CreatePurchaseOrderModal } from '@/components/purchase-orders/CreatePurchaseOrderModal';
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
import { usePurchaseOrders } from '@/hooks/apollo';
import Link from 'next/link';

// Status badge helper
const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: any; label: string; icon: any; className?: string }> = {
    DRAFT: { variant: 'secondary', label: 'Draft', icon: FileText },
    ORDERED: { variant: 'default', label: 'Ordered', icon: Package },
    CLOSED: {
      variant: 'outline',
      label: 'Closed',
      icon: CheckCircle,
      className: 'border-primary/30 bg-primary/10 text-primary',
    },
    CANCELLED: { variant: 'destructive', label: 'Cancelled', icon: XCircle },
  };
  const item = config[status] || config.DRAFT;
  const Icon = item.icon;
  return (
    <Badge variant={item.variant} className={['gap-1', item.className].filter(Boolean).join(' ')}>
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const rbac = useRbac();

  // Fetch purchase orders
  const { data, loading, error, refetch } = usePurchaseOrders({
    filters: {
      ...(statusFilter !== 'all' && { status: statusFilter }),
      limit: 100,
      offset: 0,
    },
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-lg font-semibold">Failed to load purchase orders</h3>
              <p className="text-sm text-muted-foreground">{error.message}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Purchase Orders</h1>
            </div>
            {rbac.canEditPurchaseOrders && (
              <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create PO
              </Button>
            )}
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
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{draftCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ordered</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{closedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Orders Table */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by PO number, supplier, warehouse..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
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
            </div>
          </CardHeader>
          <CardContent>
            {filteredPOs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No purchase orders found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first purchase order to get started'}
                </p>
                {!searchQuery && statusFilter === 'all' && rbac.canEditPurchaseOrders && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First PO
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                        <TableCell className="text-muted-foreground">
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
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Purchase Order Modal */}
      <CreatePurchaseOrderModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default function CompanyPurchaseOrdersPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER']}>
        <CompanyPurchaseOrdersContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
