'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client';
import { CREATE_CATEGORY, UPDATE_CATEGORY, GET_CATEGORIES } from '@/lib/graphql/catalog';
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

  const [createCategory, { loading: creating }] = useMutation(CREATE_CATEGORY, {
    refetchQueries: [{ query: GET_CATEGORIES }],
    onCompleted: () => {
      toast.success('Category created successfully');
      onOpenChange(false);
      reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });

  const [updateCategory, { loading: updating }] = useMutation(UPDATE_CATEGORY, {
    refetchQueries: [{ query: GET_CATEGORIES }],
    onCompleted: () => {
      toast.success('Category updated successfully');
      onOpenChange(false);
      reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });

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

  const onSubmit = (data: CategoryFormData) => {
    if (isEditing) {
      updateCategory({
        variables: {
          input: {
            id: category.id,
            name: data.name,
            description: data.description || null,
          },
        },
      });
    } else {
      createCategory({
        variables: {
          input: {
            name: data.name,
            description: data.description || null,
          },
        },
      });
    }
  };

  const loading = creating || updating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update category details below.' : 'Create a new category for organizing products.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Electronics"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description..."
                {...register('description')}
                className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
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
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update' : 'Create'} Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
