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
  default_user_role: z.string(),
  restrict_manager_catalog: z.boolean(),
  restrict_staff_stock: z.boolean(),
  session_timeout_minutes: z.coerce.number().min(5),
});

interface AccessSecurityFormProps {
  companyId: string;
  settings: any;
}

export function AccessSecurityForm({ companyId, settings }: AccessSecurityFormProps) {
  const [updateSettings, { loading }] = useMutation(UPDATE_COMPANY_SETTINGS);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      default_user_role: (settings?.default_user_role as string) || 'STAFF',
      restrict_manager_catalog: (settings?.restrict_manager_catalog as boolean) ?? false,
      restrict_staff_stock: (settings?.restrict_staff_stock as boolean) ?? true,
      session_timeout_minutes: Number(settings?.session_timeout_minutes ?? 60),
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
      toast.success('Access & security rules updated');
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access & Security</CardTitle>
        <CardDescription>
          Manager permissions and security policies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="default_user_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default User Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="Driver">Driver</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Role assigned to new users by default (updates invited user defaults).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="restrict_manager_catalog"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Restrict Product Creation</FormLabel>
                    <FormDescription>
                      Prevent Managers from creating new products (Admin/Owner only).
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

            <FormField
              control={form.control}
              name="restrict_staff_stock"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Restrict Manual Adjustments</FormLabel>
                    <FormDescription>
                      Prevent Warehouse Staff from manually adjusting stock levels without a reason.
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

            <FormField
              control={form.control}
              name="session_timeout_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Timeout (Minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Automatically log out users after inactivity (Optional implementation).
                  </FormDescription>
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
