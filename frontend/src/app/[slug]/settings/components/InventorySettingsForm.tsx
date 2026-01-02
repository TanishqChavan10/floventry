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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  low_stock_threshold: z.coerce.number().min(0),
  expiry_warning_days: z.coerce.number().min(1),
  enable_expiry_tracking: z.boolean(),
  allow_negative_stock: z.boolean(),
  stock_valuation_method: z.string(),
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
      allow_negative_stock: (settings?.allow_negative_stock as boolean) ?? false,
      stock_valuation_method: (settings?.stock_valuation_method as string) || 'FIFO',
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
          Global rules for tracking stock, expiry, and valuation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
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
              
              <FormField
                control={form.control}
                name="stock_valuation_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Valuation Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FIFO">First In, First Out (FIFO)</SelectItem>
                        <SelectItem value="LIFO">Last In, First Out (LIFO)</SelectItem>
                        <SelectItem value="WeightedAverage">Weighted Average</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

              <FormField
                control={form.control}
                name="allow_negative_stock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Allow Negative Stock</FormLabel>
                      <FormDescription>
                        Allow inventory stock to fall below zero.
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
