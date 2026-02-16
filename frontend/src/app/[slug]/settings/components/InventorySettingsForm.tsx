'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { UPDATE_COMPANY_BARCODE_SETTINGS, UPDATE_COMPANY_SETTINGS } from '@/lib/graphql/company';
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
import { useAuth } from '@/context/auth-context';

const formSchema = z.object({
  low_stock_threshold: z.coerce.number().min(0),
  expiry_warning_days: z.coerce.number().min(1),
  enable_expiry_tracking: z.boolean(),
});

const barcodeFormSchema = z.object({
  barcodePrefix: z
    .string()
    .min(1, 'Prefix is required')
    .max(20, 'Prefix must be at most 20 characters')
    .refine((v) => !/\s/.test(v), 'Prefix cannot contain spaces'),
  barcodePadding: z.coerce
    .number()
    .int('Padding must be an integer')
    .min(3, 'Padding must be between 3 and 10')
    .max(10, 'Padding must be between 3 and 10'),
  barcodeSuffix: z.string().max(20, 'Suffix must be at most 20 characters').optional(),
  barcodeNextNumber: z.coerce
    .number()
    .int('Next number must be an integer')
    .min(1, 'Next number must be >= 1')
    .optional(),
});

interface InventorySettingsFormProps {
  companyId: string;
  settings: any;
  barcodeSettings?: {
    barcodePrefix?: string;
    barcodePadding?: number;
    barcodeNextNumber?: number | null;
    barcodeSuffix?: string;
  };
}

export function InventorySettingsForm({
  companyId,
  settings,
  barcodeSettings,
}: InventorySettingsFormProps) {
  const [updateSettings, { loading }] = useMutation(UPDATE_COMPANY_SETTINGS);
  const [updateBarcodeSettings, { loading: savingBarcode }] = useMutation(
    UPDATE_COMPANY_BARCODE_SETTINGS,
    {
      refetchQueries: ['GetCompanyBySlug'],
    },
  );

  const { user } = useAuth();
  const roleForCompany =
    user?.companies?.find((c) => c.id === companyId)?.role?.toUpperCase() ?? '';
  const isAdmin = roleForCompany === 'ADMIN' || roleForCompany === 'OWNER';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      low_stock_threshold: Number(settings?.low_stock_threshold ?? 10),
      expiry_warning_days: Number(settings?.expiry_warning_days ?? 30),
      enable_expiry_tracking: (settings?.enable_expiry_tracking as boolean) ?? true,
    },
  });

  const barcodeForm = useForm<z.infer<typeof barcodeFormSchema>>({
    resolver: zodResolver(barcodeFormSchema) as any,
    defaultValues: {
      barcodePrefix: (barcodeSettings?.barcodePrefix ?? 'FLO-') as string,
      barcodePadding: Number(barcodeSettings?.barcodePadding ?? 6),
      barcodeSuffix: (barcodeSettings?.barcodeSuffix ?? '') as string,
      barcodeNextNumber:
        typeof barcodeSettings?.barcodeNextNumber === 'number'
          ? barcodeSettings.barcodeNextNumber
          : undefined,
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

  const previewPrefix = barcodeForm.watch('barcodePrefix') || 'FLO-';
  const previewPadding = Number(barcodeForm.watch('barcodePadding') || 6);
  const previewSuffix = barcodeForm.watch('barcodeSuffix') || '';
  const previewNumber = isAdmin ? Number(barcodeForm.watch('barcodeNextNumber') ?? 123) : 123;

  const previewValue = `${previewPrefix}${String(
    Number.isFinite(previewNumber) && previewNumber > 0 ? Math.floor(previewNumber) : 123,
  ).padStart(
    Number.isFinite(previewPadding) && previewPadding > 0 ? Math.floor(previewPadding) : 6,
    '0',
  )}${previewSuffix}`;

  async function onSubmitBarcode(values: z.infer<typeof barcodeFormSchema>) {
    try {
      await updateBarcodeSettings({
        variables: {
          companyId,
          input: {
            barcodePrefix: values.barcodePrefix.trim(),
            barcodePadding: values.barcodePadding,
            barcodeSuffix: (values.barcodeSuffix ?? '').trim(),
            ...(isAdmin && values.barcodeNextNumber !== undefined
              ? { barcodeNextNumber: values.barcodeNextNumber }
              : {}),
          },
        },
      });
      toast.success('Barcode settings updated');
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    }
  }

  return (
    <div className="space-y-4">
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
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
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

      <Card>
        <CardHeader>
          <CardTitle>Barcode Settings</CardTitle>
          <CardDescription>
            Configure the format used for future auto-generated barcodes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground border rounded-lg p-3">
            Changing format only affects future auto-generated barcodes.
          </div>

          <div className="mt-3 text-sm">
            <span className="text-muted-foreground">Preview: </span>
            <span className="font-mono">{previewValue}</span>
          </div>

          <Form {...barcodeForm}>
            <form onSubmit={barcodeForm.handleSubmit(onSubmitBarcode)} className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={barcodeForm.control}
                  name="barcodePrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prefix</FormLabel>
                      <FormControl>
                        <Input placeholder="FLO-" {...field} />
                      </FormControl>
                      <FormDescription>Max 20 chars. No spaces.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={barcodeForm.control}
                  name="barcodePadding"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Padding</FormLabel>
                      <FormControl>
                        <Select
                          value={String(field.value)}
                          onValueChange={(v) => field.onChange(Number(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select padding" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 8 }).map((_, idx) => {
                              const v = idx + 3;
                              return (
                                <SelectItem key={v} value={String(v)}>
                                  {v}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>Number of digits (3–10).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={barcodeForm.control}
                  name="barcodeSuffix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suffix (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormDescription>Max 20 chars.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isAdmin ? (
                  <FormField
                    control={barcodeForm.control}
                    name="barcodeNextNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Number (admin only)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} step={1} {...field} />
                        </FormControl>
                        <FormDescription>
                          Next sequence used for auto-generation (collisions will auto-increment).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    barcodeForm.setValue('barcodePrefix', 'FLO-');
                    barcodeForm.setValue('barcodePadding', 6);
                    barcodeForm.setValue('barcodeSuffix', '');
                    if (isAdmin) barcodeForm.setValue('barcodeNextNumber', 1);
                  }}
                >
                  Reset to default
                </Button>

                <Button type="submit" disabled={savingBarcode}>
                  {savingBarcode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Barcode Settings
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
