'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@apollo/client';
import { CREATE_WAREHOUSE, GET_WAREHOUSES_BY_COMPANY } from '@/lib/graphql/company';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  type: z.string().optional(),
});

function slugifyWarehouseName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface CreateWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companySlug: string;
}

export function CreateWarehouseDialog({
  open,
  onOpenChange,
  companySlug,
}: CreateWarehouseDialogProps) {
  const [createWarehouse, { loading }] = useMutation(CREATE_WAREHOUSE, {
    refetchQueries: [{ query: GET_WAREHOUSES_BY_COMPANY, variables: { slug: companySlug } }],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'Central',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const slug = slugifyWarehouseName(values.name);
      if (!slug) {
        toast.error('Please enter a warehouse name');
        return;
      }

      await createWarehouse({
        variables: {
          input: {
            name: values.name,
            slug,
            type: values.type || 'Central',
          },
        },
      });

      toast.success('Warehouse created successfully');
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to create warehouse: ' + error.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Warehouse</DialogTitle>
          <DialogDescription>Add a new warehouse location to your company.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mumbai Central Warehouse" {...field} />
                  </FormControl>
                  <FormDescription>Display name used across the UI</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl className="w-full">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select warehouse type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Central">Central</SelectItem>
                      <SelectItem value="Store">Store</SelectItem>
                      <SelectItem value="Distribution">Distribution</SelectItem>
                      <SelectItem value="Cold Storage">Cold Storage</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optional - helps organize your warehouse network
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Warehouse
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
