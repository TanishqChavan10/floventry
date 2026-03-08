'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useUpdateCompany, useUpdateCompanySettings } from '@/hooks/apollo';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FormHandle } from './CompanyProfileForm';

const formSchema = z.object({
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  gst_number: z.string().optional(),
  timezone: z.string().optional(),
});

interface BusinessInfoFormProps {
  company: any;
  settings: any;
}

export const BusinessInfoForm = forwardRef<FormHandle, BusinessInfoFormProps>(
  function BusinessInfoForm({ company, settings }, ref) {
    const [updateCompany, { loading: loadingCompany }] = useUpdateCompany();
    const [updateSettings, { loading: loadingSettings }] = useUpdateCompanySettings();

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        address_line1: company.address_line1 || '',
        address_line2: company.address_line2 || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || '',
        gst_number: company.gst_number || '',
        timezone: settings?.timezone || 'UTC',
      },
    });

    const isLoading = loadingCompany || loadingSettings;

    async function onSubmit(values: z.infer<typeof formSchema>) {
      try {
        const companyInput = {
          address_line1: values.address_line1,
          address_line2: values.address_line2,
          city: values.city,
          state: values.state,
          country: values.country,
          gst_number: values.gst_number,
        };
        const settingsInput = { timezone: values.timezone };

        await Promise.all([
          updateCompany({ variables: { id: company.id, input: companyInput } }),
          updateSettings({ variables: { companyId: company.id, input: settingsInput } }),
        ]);

        form.reset(values);
        toast.success('Business information updated');
      } catch (error: any) {
        toast.error('Failed to update: ' + error.message);
      }
    }

    useImperativeHandle(ref, () => ({
      submit: () => form.handleSubmit(onSubmit)(),
      get isDirty() {
        return form.formState.isDirty;
      },
      get loading() {
        return isLoading;
      },
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle>Business &amp; Legal Information</CardTitle>
          <CardDescription>Address, tax details, and regional settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="gst_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID / GSTIN</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Tax ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Asia/Kolkata">India (IST) - Asia/Kolkata</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">
                            Eastern Time - America/New_York
                          </SelectItem>
                          <SelectItem value="Europe/London">London - Europe/London</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Address</h3>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="address_line1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_line2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Apartment, suite, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  },
);
