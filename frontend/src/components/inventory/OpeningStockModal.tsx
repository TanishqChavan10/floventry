'use client';

import { useState } from 'react';
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
import { CREATE_OPENING_STOCK} from '@/lib/graphql/inventory';

import { GET_PRODUCTS } from '@/lib/graphql/catalog';

interface OpeningStockModalProps {
  warehouseId: string;
  open: boolean;
  onClose: () => void;
}

export default function OpeningStockModal({ warehouseId, open, onClose }: OpeningStockModalProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    min_stock_level: '',
    max_stock_level: '',
    reorder_point: '',
    note: '',
  });

  const { data: productsData } = useQuery(GET_PRODUCTS);

  const [createOpeningStock, { loading }] = useMutation(CREATE_OPENING_STOCK, {
    onCompleted: () => {
      toast({
        title: 'Opening stock created',
        description: 'Opening stock has been created successfully',
      });
      setFormData({ product_id: '', quantity: '', min_stock_level: '', max_stock_level: '', reorder_point: '', note: '' });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id || !formData.quantity) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!warehouseId) {
      toast({
        title: 'Error',
        description: 'Warehouse ID not found',
        variant: 'destructive',
      });
      return;
    }

    await createOpeningStock({
      variables: {
        input: {
          product_id: formData.product_id,
          warehouse_id: warehouseId,
          quantity: parseFloat(formData.quantity),
          min_stock_level: formData.min_stock_level ? parseFloat(formData.min_stock_level) : undefined,
          max_stock_level: formData.max_stock_level ? parseFloat(formData.max_stock_level) : undefined,
          reorder_point: formData.reorder_point ? parseFloat(formData.reorder_point) : undefined,
          note: formData.note || null,
        },
      },
    });
  };

  const products = productsData?.products?.filter((p: any) => p.is_active) || [];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Opening Stock</DialogTitle>
          <DialogDescription>
            Set the initial stock quantity for a product in this warehouse
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="product">
              Product <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product: any) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Initial Quantity <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          {/* Stock Levels Section */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-medium text-muted-foreground">Stock Levels (Optional)</h4>
            
            {/* Min Stock Level */}
            <div className="space-y-2">
              <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
              <Input
                id="min_stock_level"
                type="number"
                step="0.01"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                placeholder="e.g., 50"
              />
              <p className="text-xs text-muted-foreground">Alert when stock falls below this level</p>
            </div>

            {/* Max Stock Level */}
            <div className="space-y-2">
              <Label htmlFor="max_stock_level">Maximum Stock Level</Label>
              <Input
                id="max_stock_level"
                type="number"
                step="0.01"
                min="0"
                value={formData.max_stock_level}
                onChange={(e) => setFormData({ ...formData, max_stock_level: e.target.value })}
                placeholder="e.g., 500"
              />
              <p className="text-xs text-muted-foreground">Maximum capacity for this warehouse</p>
            </div>

            {/* Reorder Point */}
            <div className="space-y-2">
              <Label htmlFor="reorder_point">Reorder Point</Label>
              <Input
                id="reorder_point"
                type="number"
                step="0.01"
                min="0"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                placeholder="e.g., 100"
              />
              <p className="text-xs text-muted-foreground">Trigger purchase orders at this level</p>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Add a note about this opening stock..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Opening Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
