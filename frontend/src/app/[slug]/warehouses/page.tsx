'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_WAREHOUSES_BY_COMPANY,
  GET_COMPANY_STATS,
  REACTIVATE_WAREHOUSE,
} from '@/lib/graphql/company';
import { Loader2, RefreshCw, Archive } from 'lucide-react';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Users, Plus, Settings, TrendingUp } from 'lucide-react';
import { CreateWarehouseDialog } from '@/components/warehouses/CreateWarehouseDialog';
import { useAuth } from '@/context/auth-context';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

type WarehouseSummary = {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'inactive' | string;
  address?: string | null;
  type?: string | null;
  code?: string | null;
  timezone?: string | null;
};

function WarehousesContent() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.slug as string;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');
  const { user } = useAuth();

  // Check if user is OWNER
  const activeCompany = user?.companies?.find((c) => c.isActive) || user?.companies?.[0];
  const isOwner = activeCompany?.role === 'OWNER';

  const { data, loading, error } = useQuery(GET_WAREHOUSES_BY_COMPANY, {
    variables: { slug: companySlug },
    skip: !companySlug,
  });

  const warehouses = (data?.companyBySlug?.warehouses ?? []) as WarehouseSummary[];
  const companyId = data?.companyBySlug?.id;

  // Filter warehouses by status
  const filteredWarehouses = warehouses.filter((w) => w.status === statusFilter);

  const [reactivateWarehouse, { loading: reactivating }] = useMutation(REACTIVATE_WAREHOUSE, {
    refetchQueries: [{ query: GET_WAREHOUSES_BY_COMPANY, variables: { slug: companySlug } }],
  });

  const handleReactivate = async (id: string, name: string) => {
    try {
      await reactivateWarehouse({ variables: { id } });
      toast.success(`Warehouse "${name}" has been reactivated`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message || 'Failed to reactivate warehouse');
    }
  };

  const { data: statsData, loading: statsLoading } = useQuery(GET_COMPANY_STATS, {
    variables: { companyId },
    skip: !companyId,
  });

  // Auto-redirect STAFF/MANAGER to their assigned warehouse
  useEffect(() => {
    if (!loading && user && warehouses.length > 0) {
      const activeCompany = user.companies?.find((c) => c.isActive) || user.companies?.[0];
      const userRole = activeCompany?.role;

      // Only redirect for STAFF and MANAGER roles
      if (userRole === 'STAFF' || userRole === 'MANAGER') {
        // Until we have explicit "assigned warehouses" data, avoid redirecting users to the wrong place.
        // Redirect only when there is exactly one active warehouse.
        const activeWarehouses = warehouses.filter((w) => w.status === 'active');
        if (activeWarehouses.length === 1) {
          router.push(`/${companySlug}/warehouses/${activeWarehouses[0].slug}`);
        }
      }
    }
  }, [loading, warehouses, user, companySlug, router]);

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
        Error loading warehouses: {error.message}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Warehouse Management
              </h1>
              <p className="text-muted-foreground">
                Manage all warehouse locations across your company
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Tabs
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'active' | 'inactive')}
              >
                <TabsList>
                  <TabsTrigger value="active">
                    Active ({warehouses.filter((w) => w.status === 'active').length})
                  </TabsTrigger>
                  <TabsTrigger value="inactive">
                    <Archive className="h-4 w-4 mr-1" />
                    Archived ({warehouses.filter((w) => w.status === 'inactive').length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Warehouse
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warehouses.length}</div>
              <p className="text-xs text-muted-foreground">
                Showing {filteredWarehouses.length}{' '}
                {statusFilter === 'active' ? 'active' : 'archived'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  (statsData?.companyStats?.totalStaff ?? 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">Across all locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  `₹${(statsData?.companyStats?.totalInventoryValue ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                )}
              </div>
              <p className="text-xs text-muted-foreground">Combined value</p>
            </CardContent>
          </Card>
        </div>

        {/* Warehouses List */}
        {filteredWarehouses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {statusFilter === 'active'
                ? 'No active warehouses found.'
                : 'No archived warehouses found.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredWarehouses.map((warehouse) => (
              <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                      <Badge variant={warehouse.status === 'active' ? 'default' : 'secondary'}>
                        {warehouse.status === 'active' ? 'Active' : 'Archived'}
                      </Badge>
                    </div>
                    <Link href={`/${companySlug}/warehouses/${warehouse.slug}/settings`}>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{warehouse.address || 'No address provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Type: {warehouse.type || 'Standard'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Code</p>
                      <p className="text-lg font-semibold">{warehouse.code || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Timezone</p>
                      <p className="text-sm font-semibold truncate">
                        {warehouse.timezone || 'UTC'}
                      </p>
                    </div>
                  </div>

                  <Link href={`/${companySlug}/warehouses/${warehouse.slug}`}>
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={warehouse.status === 'inactive'}
                    >
                      View Details
                    </Button>
                  </Link>

                  {/* Reactivate button for OWNER and inactive warehouses */}
                  {statusFilter === 'inactive' && isOwner && (
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      onClick={() => handleReactivate(warehouse.id, warehouse.name)}
                      disabled={reactivating}
                    >
                      {reactivating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Reactivate
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <CreateWarehouseDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        companySlug={companySlug}
      />
    </div>
  );
}

export default function WarehousesPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER', 'STAFF']}>
        <WarehousesContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
