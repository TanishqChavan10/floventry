'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { UPDATE_COMPANY_SETTINGS } from '@/lib/graphql/company';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  low_stock_threshold: z.coerce.number().min(0),
  expiry_warning_days: z.coerce.number().min(1),
  enable_expiry_tracking: z.boolean(),
});

interface InventorySettingsFormProps {
  companyId: string;
  settings: any;
}

export function InventorySettingsForm({ companyId, settings }: InventorySettingsFormProps) {
  const [updateSettings, { loading }] = useMutation(UPDATE_COMPANY_SETTINGS);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      low_stock_threshold: Number(settings?.low_stock_threshold ?? 10),
      expiry_warning_days: Number(settings?.expiry_warning_days ?? 30),
      enable_expiry_tracking: (settings?.enable_expiry_tracking as boolean) ?? true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateSettings({
        variables: {
          companyId,
          input: values,
        },
      });
      toast.success('Inventory settings updated');
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Configuration</CardTitle>
        <CardDescription>
          Configure low stock alerts and expiry tracking settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="low_stock_threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Low Stock Threshold</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Default unit count to trigger low stock alerts.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="enable_expiry_tracking"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Expiry Tracking</FormLabel>
                      <FormDescription>
                        Track batch expiration dates for perishable items.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('enable_expiry_tracking') && (
                 <FormField
                 control={form.control}
                 name="expiry_warning_days"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Expiry Warning Days</FormLabel>
                     <FormControl>
                       <Input type="number" {...field} />
                     </FormControl>
                     <FormDescription>
                       Days before expiration to trigger an alert.
                     </FormDescription>
                     <FormMessage />
                   </FormItem>
                 )}
               />
              )}

            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
