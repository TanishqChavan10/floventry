'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_COMPANY_BY_SLUG } from '@/lib/graphql/company';
import { Loader2 } from 'lucide-react';
import CompanySettingsContent from './CompanySettingsContent';
import RoleGuard from '@/components/guards/role-guard';

export default function CompanySettingsPage() {
  const params = useParams();
  const companySlug = params?.slug as string;

  const { data, loading, error } = useQuery(GET_COMPANY_BY_SLUG, {
    variables: { slug: companySlug },
    skip: !companySlug,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading company settings: {error.message}
      </div>
    );
  }

  const company = data?.companyBySlug;

  if (!company) {
    return <div className="p-8 text-center">Company not found</div>;
  }

  return (
    <RoleGuard companyLevelOnly>
      <div className="min-h-full bg-background p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <CompanySettingsContent company={company} />
        </div>
      </div>
    </RoleGuard>
  );
}
