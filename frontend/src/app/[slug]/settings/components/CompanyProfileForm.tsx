'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useUpdateCompany } from '@/hooks/apollo';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  legal_name: z.string().optional(),
  company_type: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export interface FormHandle {
  submit: () => void;
  isDirty: boolean;
  loading: boolean;
}

interface CompanyProfileFormProps {
  company: any;
}

export const CompanyProfileForm = forwardRef<FormHandle, CompanyProfileFormProps>(
  function CompanyProfileForm({ company }, ref) {
    const [updateCompany, { loading }] = useUpdateCompany();

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: company.name || '',
        legal_name: company.legal_name || '',
        company_type: company.company_type || '',
        website: company.website || '',
      },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
      try {
        await updateCompany({ variables: { id: company.id, input: values } });
        form.reset(values); // clears dirty state after save
        toast.success('Company profile updated successfully');
      } catch (error: any) {
        toast.error('Failed to update profile: ' + error.message);
      }
    }

    useImperativeHandle(ref, () => ({
      submit: () => form.handleSubmit(onSubmit)(),
      get isDirty() {
        return form.formState.isDirty;
      },
      get loading() {
        return loading;
      },
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>
            Manage your company&apos;s core identity and public information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="legal_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme International Pvt Ltd" {...field} />
                      </FormControl>
                      <FormDescription>
                        The official name used for tax and legal documents.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Wholesale">Wholesale</SelectItem>
                          <SelectItem value="Distributor">Distributor</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://acme.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  },
);
