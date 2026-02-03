'use client';
import { useQuery } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ShieldCheck, Warehouse, Activity, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GET_MY_COMPANIES } from '@/lib/graphql/company';

export function CompanyInfo() {
  const { data, loading, error } = useQuery(GET_MY_COMPANIES, {
    fetchPolicy: 'cache-and-network',
  });

  const companies = data?.myCompanies || [];

  if (loading && !companies.length) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Company Membership
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          Company Membership
        </CardTitle>
        {companies.length > 0 && <Badge variant="outline">{companies.length}</Badge>}
      </CardHeader>
      <CardContent className="space-y-6">
        {error && companies.length === 0 && (
          <div className="rounded-lg border bg-destructive/10 p-3 text-sm text-destructive">
            Failed to load company memberships.
          </div>
        )}

        {companies.length === 0 ? (
          <div className="rounded-lg border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            You are not a member of any companies.
          </div>
        ) : (
          companies.map((membership: any) => (
            <div
              key={membership.membership_id || membership.company.id}
              className="rounded-xl border bg-muted/20 overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between border-b bg-white/60 dark:bg-slate-900/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base leading-none truncate">
                      {membership.company.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {membership.company.company_type || 'Enterprise'}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    String(membership.status).toLowerCase() === 'active' ? 'default' : 'secondary'
                  }
                >
                  {membership.status || 'Active'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 divide-x">
                <div className="p-3 flex items-center justify-center flex-col gap-1 text-center">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Role
                  </span>
                  <span className="font-medium text-sm flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" /> {membership.role}
                  </span>
                </div>
                <div className="p-3 flex items-center justify-center flex-col gap-1 text-center">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Warehouses
                  </span>
                  <span className="font-medium text-sm flex items-center gap-1.5">
                    <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />{' '}
                    {membership.warehouseCount} Assigned
                  </span>
                </div>
              </div>
            </div>
          ))
        )}

        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
          <Activity className="h-4 w-4 shrink-0" />
          <p>
            Company memberships are managed by organization administrators. You cannot edit these
            details here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
