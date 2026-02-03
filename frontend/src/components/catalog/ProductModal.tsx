'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useToast } from '@/components/ui/use-toast';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  GET_CATEGORIES,
  GET_SUPPLIERS,
  GET_UNITS,
} from '@/lib/graphql/catalog';

interface ProductModalProps {
  product?: any;
  open: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, open, onClose }: ProductModalProps) {
  const isEditing = !!product;
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    supplier_id: '',
    unit: '',
    cost_price: '',
    selling_price: '',
    image_url: '',
    description: '',
  });

  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const { data: suppliersData } = useQuery(GET_SUPPLIERS);
  const { data: unitsData } = useQuery(GET_UNITS);

  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT, {
    onCompleted: () => {
      toast({
        title: 'Product created',
        description: 'Product has been created successfully',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT, {
    onCompleted: () => {
      toast({
        title: 'Product updated',
        description: 'Product has been updated successfully',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category_id: product.category?.id || '',
        supplier_id: product.supplier?.id || '',
        unit: product.unit || '',
        cost_price: product.cost_price?.toString() || '',
        selling_price: product.selling_price?.toString() || '',
        image_url: product.image_url || '',
        description: product.description || '',
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input = {
      name: formData.name,
      sku: formData.sku,
      barcode: formData.barcode || null,
      category_id: formData.category_id || null,
      supplier_id: formData.supplier_id || null,
      unit: formData.unit,
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
      image_url: formData.image_url || null,
      description: formData.description || null,
    };

    if (isEditing) {
      await updateProduct({
        variables: {
          input: {
            id: product.id,
            ...input,
          },
        },
      });
    } else {
      await createProduct({
        variables: { input },
      });
    }
  };

  const loading = creating || updating;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="px-6 pt-6 pr-12">
            <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update product information' : 'Add a new product to your catalog'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
            <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
              {/* Product Name */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Industrial Safety Helmet"
                  required
                />
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g., PRD-001"
                  required
                />
              </div>

              {/* Barcode */}
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id || undefined}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesData?.categories
                      .filter((cat: any) => cat.isActive)
                      .map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier */}
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={formData.supplier_id || undefined}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliersData?.suppliers
                      .filter((sup: any) => sup.isActive)
                      .map((sup: any) => (
                        <SelectItem key={sup.id} value={sup.id}>
                          {sup.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label htmlFor="unit">
                  Unit <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsData?.units.map((unit: any) => (
                      <SelectItem key={unit.id} value={unit.shortCode}>
                        {unit.name} ({unit.shortCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cost Price */}
              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price (₹)</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              {/* Selling Price */}
              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price (₹)</Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description..."
                  rows={4}
                />
              </div>
            </div>

            <div className="sticky bottom-0 -mx-6 mt-6 border-t bg-background/95 px-6 py-4 backdrop-blur">
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
