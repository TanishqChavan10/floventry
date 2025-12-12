'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Building, Package } from 'lucide-react';

const roles = [
  {
    name: 'OWNER',
    description: 'Full system access with complete control over the company',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
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
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
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
    color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400',
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
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
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
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Roles & Permissions
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage user roles and access control across your organization
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Info Banner */}
        <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Role-Based Access Control (RBAC)
                </h3>
                <p className="text-sm text-indigo-700 dark:text-indigo-200 mt-1">
                  Floventry uses a hierarchical role system to ensure users have appropriate access
                  to company and warehouse resources. Roles cannot be customized but are carefully
                  designed for inventory management workflows.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {roles.map((role, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${role.color}`}>
                      <role.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <CardDescription className="mt-1">{role.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{role.userCount} users</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                    Permissions
                  </h4>
                  <ul className="space-y-2">
                    {role.permissions.map((permission, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 mt-1.5 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-400">{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    View Users with this Role
                  </Button>
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
                <div className="w-32 font-semibold text-sm text-slate-900 dark:text-white">
                  Company Level
                </div>
                <div className="flex-1 flex gap-2">
                  <Badge className="bg-purple-600">OWNER</Badge>
                  <Badge className="bg-blue-600">ADMIN</Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 font-semibold text-sm text-slate-900 dark:text-white">
                  Warehouse Level
                </div>
                <div className="flex-1 flex gap-2">
                  <Badge className="bg-green-600">MANAGER</Badge>
                  <Badge className="bg-orange-600">STAFF</Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Note:</strong> OWNER and ADMIN roles have company-wide access, while
                MANAGER and STAFF roles are scoped to specific warehouses. Users can be assigned to
                multiple warehouses with different roles.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
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
