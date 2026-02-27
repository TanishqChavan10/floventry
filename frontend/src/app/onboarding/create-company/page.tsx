'use client';

import React from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Loader2, ArrowLeft } from 'lucide-react';
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
import { CREATE_COMPANY } from '@/lib/graphql/company';
import { GET_CURRENT_USER } from '@/lib/graphql/auth';
import { toast } from 'sonner';
import { useApolloClient } from '@apollo/client';

export default function CreateCompanyPage() {
  const router = useRouter();
  const { user } = useUser();
  const apolloClient = useApolloClient();
  const [companyName, setCompanyName] = React.useState('');

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);

  const [createCompany] = useMutation(CREATE_COMPANY, {
    refetchQueries: [{ query: GET_CURRENT_USER }],
  });

  const { run, isLoading } = useAsyncAction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { data } = await createCompany({
        variables: {
          input: {
            name: companyName,
            slug: generateSlug(companyName),
          },
        },
      });

      if (data?.createCompany) {
        toast.success('Company created successfully!');
        await user?.reload();
        await apolloClient.clearStore();
        const createdSlug = data.createCompany.slug || generateSlug(companyName);
        window.location.href = `/${createdSlug}/settings`;
      }
    }).catch((error: any) => {
      console.error('Error creating company:', error);
      toast.error(error.message || 'Failed to create company');
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: '#fafafa' }}
    >
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center">
          <div className="text-3xl font-bold tracking-tight" style={{ color: '#e05252' }}>
            Floventry
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-xl border bg-white p-8 space-y-6"
          style={{ borderColor: '#f0f0f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
        >
          {/* Back + Heading */}
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-4"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Create your company</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Set up your workspace to start managing inventory.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-sm">
                Company name
              </Label>
              <Input
                id="companyName"
                placeholder="e.g. Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              {companyName && (
                <p className="text-xs text-gray-400">
                  URL:{' '}
                  <span className="font-medium text-gray-600">{generateSlug(companyName)}</span>
                </p>
              )}
            </div>

            {/* Industry + Size */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Industry</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Size</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1–10</SelectItem>
                    <SelectItem value="11-50">11–50</SelectItem>
                    <SelectItem value="51-200">51–200</SelectItem>
                    <SelectItem value="201+">201+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#e05252' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create company'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
