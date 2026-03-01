'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { UPDATE_COMPANY_SETTINGS } from '@/lib/graphql/company';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { FormHandle } from './CompanyProfileForm';

const formSchema = z.object({
  restrict_manager_catalog: z.boolean(),
});

interface AccessSecurityFormProps {
  companyId: string;
  settings: any;
}

export const AccessSecurityForm = forwardRef<FormHandle, AccessSecurityFormProps>(
  function AccessSecurityForm({ companyId, settings }, ref) {
    const [updateSettings, { loading }] = useMutation(UPDATE_COMPANY_SETTINGS);

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema) as any,
      defaultValues: {
        restrict_manager_catalog: (settings?.restrict_manager_catalog as boolean) ?? false,
      },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
      try {
        await updateSettings({ variables: { companyId, input: values } });
        form.reset(values);
        toast.success('Access settings updated');
      } catch (error: any) {
        toast.error('Failed to update: ' + error.message);
      }
    }

    useImperativeHandle(ref, () => ({
      submit: () => form.handleSubmit(onSubmit)(),
      get isDirty() { return form.formState.isDirty; },
      get loading() { return loading; },
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
          <CardDescription>
            Control what actions different team roles can perform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="restrict_manager_catalog"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Restrict Product Creation</FormLabel>
                      <FormDescription>
                        When enabled, only Admins and Owners can create new products. Managers are limited to viewing the catalog.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }
);
