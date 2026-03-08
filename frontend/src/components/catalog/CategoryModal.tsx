'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateCategory, useUpdateCategory } from '@/hooks/apollo';
import { categorySchema, type CategoryFormData } from '@/lib/validators/catalog';
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

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: {
    id: string;
    name: string;
    description?: string;
    isActive?: boolean;
  } | null;
  onSuccess?: () => void;
}

export function CategoryModal({ open, onOpenChange, category, onSuccess }: CategoryModalProps) {
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  });

  const [createCategory, { loading: creating }] = useCreateCategory();

  const [updateCategory, { loading: updating }] = useUpdateCategory();

  // Update form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || '',
        isActive: category.isActive ?? true,
      });
    } else {
      reset({
        name: '',
        description: '',
        isActive: true,
      });
    }
  }, [category, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditing) {
        await updateCategory({
          variables: {
            input: {
              id: category.id,
              name: data.name,
              description: data.description || null,
            },
          },
        });
        toast.success('Category updated successfully');
      } else {
        await createCategory({
          variables: {
            input: {
              name: data.name,
              description: data.description || null,
            },
          },
        });
        toast.success('Category created successfully');
      }
      onOpenChange(false);
      reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} category: ${error.message}`);
    }
  };

  const loading = creating || updating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update category details below.'
                : 'Create a new category for organizing products.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Electronics"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description..."
                {...register('description')}
                className={`resize-none ${errors.description ? 'border-destructive' : ''}`}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update' : 'Create'} Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
