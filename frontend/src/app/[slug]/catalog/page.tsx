'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useRbac } from '@/hooks/use-rbac';
import CompanyGuard from '@/components/CompanyGuard';
import { Package, FolderTree, Building, Ruler, ArrowRight, PackagePlus } from 'lucide-react';
import { useCatalogStats } from '@/hooks/apollo';

function CatalogLandingContent() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const { data, loading, error } = useCatalogStats();

  const rbac = useRbac();
  const isOwnerOrAdmin = rbac.isAdmin || rbac.isOwner;

  // Calculate stats from catalog data
  const totalProducts = data?.products?.length || 0;
  const activeCategories = data?.categories?.filter((c: any) => c.isActive)?.length || 0;
  const activeSuppliers = data?.suppliers?.filter((s: any) => s.isActive)?.length || 0;
  const unitsInUse = data?.units?.length || 0;

  const catalogIsEmpty = totalProducts === 0 && activeCategories === 0 && activeSuppliers === 0;

  // Navigation cards
  const navigationCards = [
    {
      title: 'Products',
      description: 'Manage product catalog and pricing',
      icon: Package,
      href: `/${slug}/catalog/products`,
      count: totalProducts,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      visible: true,
    },
    {
      title: 'Categories',
      description: 'Organize products into categories',
      icon: FolderTree,
      href: `/${slug}/catalog/categories`,
      count: activeCategories,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      visible: true,
    },
    {
      title: 'Suppliers',
      description: 'Manage supplier relationships',
      icon: Building,
      href: `/${slug}/catalog/suppliers`,
      count: activeSuppliers,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      visible: true,
    },
    {
      title: 'Units',
      description: 'Define units of measurement',
      icon: Ruler,
      href: `/${slug}/catalog/units`,
      count: unitsInUse,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      visible: isOwnerOrAdmin, // Only visible to Owner/Admin
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading catalog...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Package className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Failed to load catalog data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Catalog
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage products, categories, suppliers, and units used across your warehouses.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {catalogIsEmpty ? (
          /* Empty State */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6">
                <PackagePlus className="h-12 w-12 text-slate-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Your catalog is empty</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {isOwnerOrAdmin
                    ? 'Add products to start tracking inventory across your warehouses.'
                    : 'Ask an admin to add products to get started.'}
                </p>
              </div>
              {isOwnerOrAdmin && (
                <Button onClick={() => router.push(`/${slug}/catalog/products`)} className="gap-2">
                  <Package className="h-4 w-4" />
                  Add your first product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quick Overview Cards */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Quick Overview</h2>
              <div className="grid gap-6 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalProducts}</div>
                    <p className="text-xs text-muted-foreground mt-1">Company-wide catalog</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
                    <FolderTree className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeCategories}</div>
                    <p className="text-xs text-muted-foreground mt-1">Product classifications</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeSuppliers}</div>
                    <p className="text-xs text-muted-foreground mt-1">Vendor relationships</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Units in Use</CardTitle>
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{unitsInUse}</div>
                    <p className="text-xs text-muted-foreground mt-1">Measurement units</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Navigation Cards */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Manage Catalog</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {navigationCards
                  .filter((card) => card.visible)
                  .map((card) => {
                    const Icon = card.icon;
                    return (
                      <Card
                        key={card.title}
                        className="group cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                        onClick={() => router.push(card.href)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`${card.bgColor} rounded-lg p-3`}>
                              <Icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">{card.title}</h3>
                            <p className="text-sm text-muted-foreground">{card.description}</p>
                          </div>
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Total</span>
                              <span className="text-lg font-bold">{card.count}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function CatalogLandingPage() {
  return (
    <CompanyGuard>
      <CatalogLandingContent />
    </CompanyGuard>
  );
}
