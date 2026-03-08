'use client';

import { useState } from 'react';
import { useGRNs } from '@/hooks/apollo';
import { useParams, useRouter } from 'next/navigation';
import RoleGuard from '@/components/guards/RoleGuard';
import { useAuth } from '@/context/auth-context';
import { useWarehouse } from '@/context/warehouse-context';
import { useRbac } from '@/hooks/use-rbac';
import { CreateGRNModal } from '@/components/inventory/CreateGRNModal';
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
import { Plus, Search, Eye, FileText, CheckCircle, XCircle, PackageCheck } from 'lucide-react';
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

function GRNListContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;
  const { activeWarehouse } = useWarehouse();
  const rbac = useRbac();

  // STAFF and above can create GRNs (drafts)
  const canCreateGRN = true;

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch GRNs
  const { data, loading, error, refetch } = useGRNs({
    filters: {
      warehouse_id: activeWarehouse?.id,
      ...(statusFilter !== 'all' && { status: statusFilter }),
      limit: 100,
      offset: 0,
    },
  });

  const grns = data?.grns || [];

  // Filter GRNs by search query (client-side)
  const filteredGRNs = grns.filter((grn: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      grn.grn_number.toLowerCase().includes(query) ||
      grn.purchase_order?.po_number?.toLowerCase().includes(query) ||
      grn.purchase_order?.supplier?.name?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const totalGRNs = grns.length;
  const draftCount = grns.filter((grn: any) => grn.status === 'DRAFT').length;
  const postedCount = grns.filter((grn: any) => grn.status === 'POSTED').length;

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
          <p className="text-slate-600 dark:text-slate-400">Loading GRNs...</p>
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
              <h3 className="text-lg font-semibold">Failed to load GRNs</h3>
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
      <header className="bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Goods Receipt Notes
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Record and manage goods received from purchase orders
              </p>
            </div>
            {canCreateGRN && (
              <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create GRN
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
              <CardTitle className="text-sm font-medium">Total GRNs</CardTitle>
              <PackageCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGRNs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <FileText className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{draftCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{postedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* GRNs Table with Filters */}
        <Card>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by GRN number, PO number, supplier..."
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
                  <SelectItem value="POSTED">Posted</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table Content */}
            {filteredGRNs.length === 0 ? (
              <div className="text-center py-12">
                <PackageCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No GRNs found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first GRN to receive goods from purchase orders'}
                </p>
                {!searchQuery && statusFilter === 'all' && canCreateGRN && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First GRN
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GRN Number</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGRNs.map((grn: any) => (
                    <TableRow key={grn.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {grn.grn_number}
                      </TableCell>
                      <TableCell>{grn.purchase_order?.po_number || 'N/A'}</TableCell>
                      <TableCell>{grn.purchase_order?.supplier?.name || 'N/A'}</TableCell>
                      <TableCell>{formatDate(grn.received_at)}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {grn.user?.fullName || grn.user_role || 'System'}
                      </TableCell>
                      <TableCell>{getStatusBadge(grn.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/grn/${grn.id}`}
                        >
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

      {/* Create GRN Modal */}
      <CreateGRNModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default function GRNListPage() {
  return (
    <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
      <GRNListContent />
    </RoleGuard>
  );
}
