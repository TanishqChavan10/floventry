'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client';
import { CREATE_SUPPLIER, UPDATE_SUPPLIER, GET_SUPPLIERS } from '@/lib/graphql/catalog';
import { supplierSchema, type SupplierFormData } from '@/lib/validators/catalog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
  } | null;
  onSuccess?: () => void;
}

export function SupplierModal({ open, onOpenChange, supplier, onSuccess }: SupplierModalProps) {
  const isEditing = !!supplier;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      isActive: true,
    },
  });

  const [createSupplier, { loading: creating }] = useMutation(CREATE_SUPPLIER, {
    refetchQueries: [{ query: GET_SUPPLIERS }],
    onCompleted: () => {
      toast.success('Supplier created successfully');
      onOpenChange(false);
      reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create supplier: ${error.message}`);
    },
  });

  const [updateSupplier, { loading: updating }] = useMutation(UPDATE_SUPPLIER, {
    refetchQueries: [{ query: GET_SUPPLIERS }],
    onCompleted: () => {
      toast.success('Supplier updated successfully');
      onOpenChange(false);
      reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to update supplier: ${error.message}`);
    },
  });

  // Update form when supplier changes
  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        isActive: supplier.isActive ?? true,
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        isActive: true,
      });
    }
  }, [supplier, reset]);

  const onSubmit = (data: SupplierFormData) => {
    if (isEditing) {
      updateSupplier({
        variables: {
          input: {
            id: supplier.id,
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
          },
        },
      });
    } else {
      createSupplier({
        variables: {
          input: {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
          },
        },
      });
    }
  };

  const loading = creating || updating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update supplier information below.'
                : 'Add a new supplier to your catalog.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Supplier Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Acme Corp"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="sales@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  {...register('phone')}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Street address, city, state, zip code"
                {...register('address')}
                className={`resize-none ${errors.address ? 'border-destructive' : ''}`}
                rows={3}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
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
              {isEditing ? 'Update' : 'Create'} Supplier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
