'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { GET_WAREHOUSES_BY_COMPANY, GET_COMPANY_STATS } from '@/lib/graphql/company';
import { Loader2 } from 'lucide-react';
import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Users, Package, Plus, Settings, TrendingUp } from 'lucide-react';
import { CreateWarehouseDialog } from '@/components/warehouses/CreateWarehouseDialog';
import { useAuth } from '@/context/auth-context';

// Mock data for warehouses
function WarehousesContent() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.slug as string;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false); 
  const { user } = useAuth();

  const { data, loading, error } = useQuery(GET_WAREHOUSES_BY_COMPANY, {
    variables: { slug: companySlug },
    skip: !companySlug,
  });

  const warehouses = data?.companyBySlug?.warehouses || [];
  const companyId = data?.companyBySlug?.id;

  const { data: statsData, loading: statsLoading } = useQuery(GET_COMPANY_STATS, {
    variables: { companyId },
    skip: !companyId,
  });

  console.log('[Warehouses Page] Component rendering - Loading:', loading, 'User:', !!user, 'Warehouses:', warehouses.length);

  // Auto-redirect STAFF/MANAGER to their assigned warehouse
  useEffect(() => {
    console.log('[Warehouses useEffect] Triggered - loading:', loading, 'user:', !!user, 'warehouses:', warehouses.length);
    
    if (!loading && user && warehouses.length > 0) {
      const activeCompany = user.companies?.find(c => c.isActive) || user.companies?.[0];
      const userRole = activeCompany?.role;

      console.log('[Warehouses] User role:', userRole);
      console.log('[Warehouses] Warehouses count:', warehouses.length);

      // Only redirect for STAFF and MANAGER roles
      if (userRole === 'STAFF' || userRole === 'MANAGER') {
        // Redirect to the first warehouse (in future, we can filter by assigned warehouses)
        const firstWarehouse = warehouses[0];
        if (firstWarehouse) {
          console.log('[Warehouses] Redirecting to warehouse:', firstWarehouse.slug);
          router.push(`/${companySlug}/warehouses/${firstWarehouse.slug}`);
        } else {
          console.warn('[Warehouses] No warehouse found to redirect to');
        }
      } else {
        console.log('[Warehouses] Not redirecting - user role is:', userRole);
      }
    } else {
      console.log('[Warehouses] Not redirecting - loading:', loading, 'user:', !!user, 'warehouses.length:', warehouses.length);
    }
  }, [loading, warehouses, user, companySlug, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
     return (
      <div className="p-8 text-center text-red-500">
        Error loading warehouses: {error.message}
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
                Warehouse Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage all warehouse locations across your company
              </p>
            </div>
            <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Warehouse
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warehouses.length}</div>
              <p className="text-xs text-muted-foreground">All locations active</p>
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
                  statsData?.companyStats?.totalStaff ?? 0
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
        {warehouses.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-slate-500">No warehouses found.</p>
            </div>
        ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse: any) => (
            <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                    <Badge variant={'default'}>
                      Active
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
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{warehouse.address || 'No address provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Users className="h-4 w-4" />
                    <span>Type: {warehouse.type || 'Standard'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Code</p>
                    <p className="text-lg font-semibold">{warehouse.code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Timezone</p>
                    <p className="text-lg font-semibold text-sm truncate">{warehouse.timezone || 'UTC'}</p>
                  </div>
                </div>

                <Link href={`/${companySlug}/warehouses/${warehouse.slug}`}>
                  <Button className="w-full" variant="outline">
                    View Details
                  </Button>
                </Link>
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
