'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { GenerateBarcodeLabelsButton } from '@/components/barcode/GenerateBarcodeLabelsButton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, Package, Tag, Building2, Ruler, IndianRupee } from 'lucide-react';
import { CopyButton } from '@/components/common/CopyButton';

interface ProductDetailDrawerProps {
  product: any;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export default function ProductDetailDrawer({
  product,
  open,
  onClose,
  onEdit,
}: ProductDetailDrawerProps) {
  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3 pr-10">
            <div className="space-y-1">
              <SheetTitle className="text-2xl">{product.name}</SheetTitle>
              <SheetDescription className="font-mono text-sm">
                <div className="flex items-center gap-1">
                  <span>SKU: {product.sku}</span>
                  <CopyButton
                    value={product.sku}
                    ariaLabel="Copy SKU"
                    successMessage="Copied SKU to clipboard"
                    className="h-7 w-7 text-muted-foreground"
                  />
                </div>
              </SheetDescription>
            </div>
            <Badge className="shrink-0 mt-1" variant={product.is_active ? 'default' : 'secondary'}>
              {product.is_active ? 'Active' : 'Archived'}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Product Image */}
          {product.image_url && (
            <div className="rounded-lg border overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Basic Information</h3>
            <div className="space-y-3">
              {product.barcode && (
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Barcode</p>
                    <p className="text-sm text-muted-foreground font-mono">{product.barcode}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Unit</p>
                  <p className="text-sm text-muted-foreground font-mono">{product.unit}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Category & Supplier */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Classification</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm text-muted-foreground">
                    {product.category?.name || 'Not categorized'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Supplier</p>
                  <p className="text-sm text-muted-foreground">
                    {product.supplier?.name || 'No supplier'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Cost Price</p>
                </div>
                <p className="text-lg font-bold">
                  {product.cost_price ? `₹${parseFloat(product.cost_price).toFixed(2)}` : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Selling Price</p>
                </div>
                <p className="text-lg font-bold">
                  {product.selling_price ? `₹${parseFloat(product.selling_price).toFixed(2)}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Metadata</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <p>Created:</p>
                <p className="font-medium text-foreground">
                  {new Date(product.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p>Updated:</p>
                <p className="font-medium text-foreground">
                  {new Date(product.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-2">
            {product.barcode && (
              <GenerateBarcodeLabelsButton
                productIds={[product.id]}
                filename={`barcode-label_${product.sku || product.id}.pdf`}
                variant="outline"
                size="default"
              />
            )}

            {onEdit && (
              <Button onClick={onEdit} className="w-full gap-2">
                <Edit className="h-4 w-4" />
                Edit Product
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
