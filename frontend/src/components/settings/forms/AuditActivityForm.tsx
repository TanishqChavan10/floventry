'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateCompanySettings } from '@/hooks/apollo';
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
  enable_audit_logs: z.boolean(),
  audit_retention_days: z.coerce.number().min(7),
  track_stock_adjustments: z.boolean(),
});

interface AuditActivityFormProps {
  companyId: string;
  settings: any;
}

export function AuditActivityForm({ companyId, settings }: AuditActivityFormProps) {
  const [updateSettings, { loading }] = useUpdateCompanySettings();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      enable_audit_logs: (settings?.enable_audit_logs as boolean) ?? true,
      audit_retention_days: Number(settings?.audit_retention_days ?? 90),
      track_stock_adjustments: (settings?.track_stock_adjustments as boolean) ?? true,
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
      toast.success('Audit settings updated');
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit & Activity Rules</CardTitle>
        <CardDescription>Configure data retention and activity tracking.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="enable_audit_logs"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Audit Logs</FormLabel>
                    <FormDescription>
                      Track all critical actions performed by users.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('enable_audit_logs') && (
              <FormField
                control={form.control}
                name="audit_retention_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retention Period (Days)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      How long to keep audit logs before auto-deletion.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="track_stock_adjustments"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Track Stock Adjustments</FormLabel>
                    <FormDescription>
                      Log every manual stock change with reason codes.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

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
