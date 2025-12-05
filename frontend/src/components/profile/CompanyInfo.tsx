'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users } from 'lucide-react';
import Link from 'next/link';

export function CompanyInfo() {
  // Mock data - in real app, fetch from context/API
  const company = {
    name: 'Acme Corp',
    role: 'Owner',
    members: 12,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Company</CardTitle>
        <CardDescription>
          You are currently viewing data for this organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{company.name}</h3>
            <p className="text-sm text-muted-foreground">Role: {company.role}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{company.members} Team Members</span>
          </div>
          <Link href="/company-switcher">
            <Button variant="outline">Switch Company</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
