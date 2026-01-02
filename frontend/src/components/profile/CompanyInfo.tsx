'use client';
import { useQuery } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, ShieldCheck, Warehouse, Activity, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GET_MY_COMPANIES } from '@/lib/graphql/company';

export function CompanyInfo() {
  const { data, loading, error } = useQuery(GET_MY_COMPANIES, {
    fetchPolicy: 'cache-and-network',
  });

  const companies = data?.myCompanies || [];

  if (loading && !companies.length) {
    return (
      <Card className="h-full border-border/50 shadow-sm">
        <CardHeader className="pb-4">
           <CardTitle className="text-lg font-semibold flex items-center gap-2">
             <Building2 className="h-5 w-5 text-primary" />
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
    <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Company Membership
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {companies.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>You are not a member of any companies.</p>
          </div>
        ) : (
          companies.map((membership: any) => (
            <div key={membership.membership_id || membership.company.id} className="rounded-xl bg-muted/30 border border-border/50 overflow-hidden">
               <div className="p-4 flex items-center justify-between bg-muted/30 border-b border-border/50">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                        <h3 className="font-bold text-base leading-none">{membership.company.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{membership.company.company_type || 'Enterprise'}</p>
                     </div>
                  </div>
                  <Badge variant={membership.status === 'active' ? 'default' : 'secondary'}>
                     {membership.status || 'Active'}
                  </Badge>
               </div>
               
               <div className="grid grid-cols-2 divide-x divide-border/50">
                  <div className="p-3 flex items-center justify-center flex-col gap-1 text-center">
                     <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Role</span>
                     <span className="font-medium text-sm flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary/70" /> {membership.role}
                     </span>
                  </div>
                  <div className="p-3 flex items-center justify-center flex-col gap-1 text-center">
                     <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Warehouses</span>
                     <span className="font-medium text-sm flex items-center gap-1.5">
                        <Warehouse className="h-3.5 w-3.5 text-primary/70" /> {membership.warehouseCount} Assigned
                     </span>
                  </div>
               </div>
            </div>
          ))
        )}

        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-600 dark:text-blue-400 flex gap-2">
           <Activity className="h-4 w-4 shrink-0" />
           <p>Company memberships are managed by organization administrators. You cannot edit these details here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
