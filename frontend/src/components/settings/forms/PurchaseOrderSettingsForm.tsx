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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  po_require_approval: z.boolean(),
  po_approval_threshold: z.coerce.number().min(0),
  po_auto_receive: z.boolean(),
  po_default_payment_terms: z.string().optional(),
});

interface PurchaseOrderSettingsFormProps {
  companyId: string;
  settings: any;
}

export function PurchaseOrderSettingsForm({ companyId, settings }: PurchaseOrderSettingsFormProps) {
  const [updateSettings, { loading }] = useUpdateCompanySettings();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      po_require_approval: (settings?.po_require_approval as boolean) ?? false,
      po_approval_threshold: Number(settings?.po_approval_threshold ?? 10000),
      po_auto_receive: (settings?.po_auto_receive as boolean) ?? false,
      po_default_payment_terms: (settings?.po_default_payment_terms as string) || 'Net 30',
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
      toast.success('Purchase Order settings updated');
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Order Settings</CardTitle>
        <CardDescription>
          Configure approval workflows and default terms for purchases.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="po_require_approval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Require Approval</FormLabel>
                    <FormDescription>
                      Require manager/admin approval for Purchase Orders above a certain amount.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('po_require_approval') && (
              <FormField
                control={form.control}
                name="po_approval_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approval Threshold Amount</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Orders above this amount will require approval.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="po_auto_receive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto-mark Details</FormLabel>
                    <FormDescription>
                      Automatically list items as received when PO is marked as delivered (skips
                      manual count).
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="po_default_payment_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Payment Terms</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Immediate">Immediate</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
