'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Shield, Users, Building, Package, AlertTriangle } from 'lucide-react';

const roles = [
  {
    name: 'OWNER',
    description: 'Full system access with complete control over the company',
    icon: Shield,
    permissions: [
      'Full company access',
      'Manage all warehouses',
      'Manage all users',
      'Financial & billing',
      'System settings',
      'Delete company',
    ],
    userCount: 1,
  },
  {
    name: 'ADMIN',
    description: 'Company-wide administrative access',
    icon: Users,
    permissions: [
      'View all warehouses',
      'Manage products & catalog',
      'Approve purchase orders',
      'View all reports',
      'Manage users (except owners)',
      'Audit logs',
    ],
    userCount: 3,
  },
  {
    name: 'MANAGER',
    description: 'Warehouse-level management',
    icon: Building,
    permissions: [
      'Manage assigned warehouse(s)',
      'Stock management',
      'Create purchase orders',
      'Stock transfers',
      'Manage warehouse staff',
      'Warehouse reports',
    ],
    userCount: 8,
  },
  {
    name: 'STAFF',
    description: 'Warehouse operational staff',
    icon: Package,
    permissions: [
      'View assigned warehouse',
      'Update stock levels',
      'View products',
      'Create stock movements',
      'View purchase orders',
      'Limited access',
    ],
    userCount: 24,
  },
];

function RolesContent() {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={`/${slug}/settings`} className="inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Go back
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Role Definitions</h1>
        </div>

        
        {/* Clear Note */}
        <Card className="border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              <CardTitle className="text-amber-900 dark:text-amber-100">Important</CardTitle>
            </div>
            <CardDescription className="text-amber-800/90 dark:text-amber-200/90">
              Custom roles are not currently supported. Roles are designed to keep operations clear
              and auditable.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Role Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {roles.map((role, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <role.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <CardDescription className="mt-1">{role.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Permissions</h4>
                  <ul className="space-y-2">
                    {role.permissions.map((permission, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                        <span className="text-muted-foreground">{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Role Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle>Role Hierarchy</CardTitle>
            <CardDescription>
              Understanding the permission structure in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-32 font-semibold text-sm text-foreground">Company Level</div>
                <div className="flex-1 flex gap-2">
                  <Badge variant="secondary">OWNER</Badge>
                  <Badge variant="secondary">ADMIN</Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 font-semibold text-sm text-foreground">Warehouse Level</div>
                <div className="flex-1 flex gap-2">
                  <Badge variant="outline">MANAGER</Badge>
                  <Badge variant="outline">STAFF</Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> OWNER and ADMIN roles have company-wide access, while MANAGER
                and STAFF roles are scoped to specific warehouses. Users can be assigned to multiple
                warehouses with different roles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RolesPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <RolesContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
