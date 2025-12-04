'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import { SWITCH_COMPANY } from '@/app/graphql/auth';
import { toast } from 'sonner';

export default function CompanySwitcherPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  const [switchCompany, { loading: switchLoading }] = useMutation(SWITCH_COMPANY);

  const handleCompanySelect = async (companyId: string) => {
    setIsSwitching(companyId);

    try {
      const { data } = await switchCompany({
        variables: { companyId },
      });

      if (data?.switchCompany?.success) {
        toast.success('Switched to company successfully');

        // TODO: Update active company in context
        // TODO: Redirect to dashboard

        router.push(`/dashboard?companyId=${companyId}`);
      }
    } catch (error) {
      toast.error('Failed to switch company');
    } finally {
      setIsSwitching(null);
    }
  };

  if (!user?.companies) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6">
            <Building2 className="h-4 w-4" />
            Select Company
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Choose your workspace
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Select which company you'd like to work on today
          </p>
        </div>

        {/* Company Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
          {user.companies.map((company) => (
            <div
              key={company.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400">
                  {company.role}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {company.name}
              </h3>

              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                {company.isActive ? 'Active workspace' : 'Inactive workspace'}
              </p>

              <Button
                onClick={() => handleCompanySelect(company.id)}
                disabled={isSwitching === company.id || switchLoading || !company.isActive}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSwitching === company.id || switchLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Switching...
                  </>
                ) : (
                  <>
                    Select Company
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          ))}

          {/* Create New Company Card */}
          <Link href="/onboarding/create-company" className="group">
            <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-6 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center justify-center min-h-[200px]">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Create New Company
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm text-center">
                Start a new workspace for another business
              </p>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Need help managing multiple companies?{' '}
          <a
            href="mailto:support@flowventory.com"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}
