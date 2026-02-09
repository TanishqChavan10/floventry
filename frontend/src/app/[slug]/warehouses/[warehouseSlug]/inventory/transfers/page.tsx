'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import RoleGuard from '@/components/guards/RoleGuard';
import { CreateTransferModal } from '@/components/inventory/CreateTransferModal';
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
import { Plus, Search, Eye, ArrowRightLeft, FileText, CheckCircle, XCircle } from 'lucide-react';
import { GET_WAREHOUSE_TRANSFERS } from '@/lib/graphql/transfers';
import Link from 'next/link';

// Status badge helper
const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: any; label: string; icon: any }> = {
    DRAFT: { variant: 'secondary', label: 'Draft', icon: FileText },
    POSTED: { variant: 'default', label: 'Posted', icon: CheckCircle },
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

function TransferListContent() {
  const params = useParams();
  const { user } = useAuth();
  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;
  const { activeWarehouse } = useWarehouse();

  // Get user role for RBAC
  const activeCompany = user?.companies?.find((c) => c.id === user.activeCompanyId);
  const userRole = activeCompany?.role;
  const canCreateTransfer = userRole ? ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole) : false;

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('all'); // outgoing, incoming, all
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch transfers
  const { data, loading, error } = useQuery(GET_WAREHOUSE_TRANSFERS, {
    variables: {
      filters: {
        // Don't filter by source - we want to see ALL transfers involving this warehouse
        ...(statusFilter !== 'all' && { status: statusFilter }),
        limit: 100,
        offset: 0,
      },
    },
    skip: !activeWarehouse?.id,
    fetchPolicy: 'cache-and-network',
  });

  const allTransfers = data?.warehouseTransfers || [];
  const refetch = () => {
    // Refetch handled by GraphQL cache
  };

  // Filter to show only transfers involving the current warehouse (source OR destination)
  const warehouseTransfers = allTransfers.filter(
    (transfer: any) =>
      transfer.source_warehouse?.id === activeWarehouse?.id ||
      transfer.destination_warehouse?.id === activeWarehouse?.id,
  );

  // Further filter by direction
  const transfers = warehouseTransfers.filter((transfer: any) => {
    if (directionFilter === 'outgoing') {
      return transfer.source_warehouse?.id === activeWarehouse?.id;
    }
    if (directionFilter === 'incoming') {
      return transfer.destination_warehouse?.id === activeWarehouse?.id;
    }
    return true; // 'all'
  });

  // Filter transfers by search query (client-side)
  const filteredTransfers = transfers.filter((transfer: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      transfer.transfer_number.toLowerCase().includes(query) ||
      transfer.source_warehouse?.name?.toLowerCase().includes(query) ||
      transfer.destination_warehouse?.name?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const totalTransfers = transfers.length;
  const draftCount = transfers.filter((t: any) => t.status === 'DRAFT').length;
  const postedCount = transfers.filter((t: any) => t.status === 'POSTED').length;

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
          <p className="text-muted-foreground">Loading transfers...</p>
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
              <h3 className="text-lg font-semibold">Failed to load transfers</h3>
              <p className="text-sm text-muted-foreground">{error.message}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
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
              <h1 className="text-3xl font-bold tracking-tight">Warehouse Transfers</h1>
              <p className="text-muted-foreground">
                Move stock between warehouses within your company
              </p>
            </div>
            {canCreateTransfer && (
              <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Transfer
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransfers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{draftCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posted</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{postedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters + Transfers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transfers ({filteredTransfers.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by transfer number, warehouse..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transfers</SelectItem>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                  <SelectItem value="incoming">Incoming</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="POSTED">Posted</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table Content */}
            {filteredTransfers.length === 0 ? (
              <div className="text-center py-12">
                <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No transfers found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first transfer to move stock between warehouses'}
                </p>
                {!searchQuery && statusFilter === 'all' && canCreateTransfer && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Transfer
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transfer Number</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((transfer: any) => {
                    const isOutgoing = transfer.source_warehouse?.id === activeWarehouse?.id;
                    const isIncoming = transfer.destination_warehouse?.id === activeWarehouse?.id;

                    return (
                      <TableRow key={transfer.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm font-medium">
                          {transfer.transfer_number}
                        </TableCell>
                        <TableCell>
                          {isOutgoing && <Badge variant="outline">OUTGOING</Badge>}
                          {isIncoming && <Badge variant="outline">INCOMING</Badge>}
                        </TableCell>
                        <TableCell className={isOutgoing ? 'font-semibold' : ''}>
                          {transfer.source_warehouse?.name || 'N/A'}
                        </TableCell>
                        <TableCell className={isIncoming ? 'font-semibold' : ''}>
                          {transfer.destination_warehouse?.name || 'N/A'}
                        </TableCell>
                        <TableCell>{transfer.items?.length || 0}</TableCell>
                        <TableCell>{formatDate(transfer.created_at)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {transfer.user?.fullName || transfer.user_role || 'System'}
                        </TableCell>
                        <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/transfers/${transfer.id}`}
                          >
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Transfer Modal */}
      <CreateTransferModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={refetch}
      />
    </div>
  );
}

export default function TransferListPage() {
  return (
    <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
      <TransferListContent />
    </RoleGuard>
  );
}
