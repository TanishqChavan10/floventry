'use client';

import React from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

export default function CreateCompanyPage() {
  const router = useRouter();
  const { user } = useUser();
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
        // Force refresh session to ensure middleware sees the new activeCompanyId
        await user?.reload();
        router.push(`/${generateSlug(companyName)}/settings`);
      }
    }).catch((error: any) => {
      console.error('Error creating company:', error);
      toast.error(error.message || 'Failed to create company');
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-6">
            <Link href="/onboarding" className="inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Create your Company</h1>
          </div>
          <p className="text-muted-foreground">
            Set up your workspace to start managing inventory efficiently.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company details</CardTitle>
            <CardDescription>Enter a name for your company workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="create-company-form" onSubmit={handleSubmit} className="space-y-6">
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
                {companyName && (
                  <p className="text-xs text-muted-foreground">
                    Your workspace URL:{' '}
                    <span className="font-medium">{generateSlug(companyName)}</span>
                  </p>
                )}
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
            </form>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              size="lg"
              form="create-company-form"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Company...
                </>
              ) : (
                'Create Company'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
