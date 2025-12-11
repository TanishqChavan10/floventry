'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation } from '@apollo/client';
import { CREATE_COMPANY } from '@/app/graphql/company';
import { GET_CURRENT_USER } from '@/app/graphql/auth';
import { toast } from 'sonner';

export default function CreateCompanyPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = React.useState(false);
  const [companyName, setCompanyName] = React.useState('');
  const [slug, setSlug] = React.useState('');

  const [createCompany] = useMutation(CREATE_COMPANY, {
    refetchQueries: [{ query: GET_CURRENT_USER }],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await createCompany({
        variables: {
          input: {
            name: companyName,
            slug: slug,
          },
        },
      });

      if (data?.createCompany) {
        toast.success('Company created successfully!');
        // Force refresh session to ensure middleware sees the new activeCompanyId
        await user?.reload();
        router.push(`/${slug}/settings`);
      }
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast.error(error.message || 'Failed to create company');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <Link
            href="/onboarding"
            className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to options
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Create your Company
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Set up your workspace to start managing inventory efficiently.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-xl shadow-indigo-100/50 dark:shadow-none">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="e.g. Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Custom Company URL</Label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 text-sm">
                  flowventory.com/
                </span>
                <Input 
                  id="slug" 
                  placeholder="acme-corp" 
                  className="rounded-l-none h-11" 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="logistics">Logistics & Warehousing</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Company Size</Label>
                <Select>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201+">201+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Workspace...
                </>
              ) : (
                'Create Workspace'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
