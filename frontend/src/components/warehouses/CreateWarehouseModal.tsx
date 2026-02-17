'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useWarehouse } from '@/context/warehouse-context';

const warehouseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  type: z.string().min(1, 'Type is required'),
  // code: z.string().optional(),
  // timezone: z.string().optional(),
  // is_default: z.boolean().default(false),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

interface CreateWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWarehouseModal({ isOpen, onClose }: CreateWarehouseModalProps) {
  const { addWarehouse } = useWarehouse();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      address: '',
      type: 'MAIN',
    },
  });

  const onSubmit = async (data: WarehouseFormValues) => {
    setIsLoading(true);
    try {
      const newWarehouse = await addWarehouse(data as any);
      form.reset();
      onClose();
      // Force reload to trigger the root page check and redirect
      window.location.reload();
    } catch (error) {
      // Error handling done in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Warehouse</DialogTitle>
          <DialogDescription>
            Add a new warehouse location to manage your inventory.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Warehouse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 123 Industrial Way" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MAIN">Main Warehouse</SelectItem>
                      <SelectItem value="RETAIL">Retail Store</SelectItem>
                      <SelectItem value="SERVICE_CENTER">Service Center</SelectItem>
                      <SelectItem value="KIOSK">Kiosk</SelectItem>
                      <SelectItem value="COLD_STORAGE">Cold Storage</SelectItem>
                      <SelectItem value="VIRTUAL">Virtual / FBA</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Warehouse'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
