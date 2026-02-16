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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button as IconButton } from '@/components/ui/button';
import { X, Plus, Wand2 } from 'lucide-react';
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
  GENERATE_COMPANY_BARCODE,
} from '@/lib/graphql/catalog';

interface ProductModalProps {
  product?: any;
  open: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, open, onClose }: ProductModalProps) {
  const isEditing = !!product;
  const { toast } = useToast();

  const [barcodeInlineError, setBarcodeInlineError] = useState<string | null>(null);

  const showProductMutationError = (error: any) => {
    const message =
      error?.graphQLErrors?.[0]?.message ||
      error?.networkError?.message ||
      error?.message ||
      'Something went wrong';

    if (/Barcode already assigned to another product/i.test(message)) {
      setBarcodeInlineError(
        'This barcode is already assigned to another product in this company. Please use a different barcode.',
      );
      return;
    }

    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  };

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    alternate_barcodes: [] as string[],
    category_id: '',
    supplier_id: '',
    unit: '',
    cost_price: '',
    selling_price: '',
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
    onError: showProductMutationError,
  });

  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT, {
    onCompleted: () => {
      toast({
        title: 'Product updated',
        description: 'Product has been updated successfully',
      });
      onClose();
    },
    onError: showProductMutationError,
  });

  const [generateCompanyBarcode, { loading: generatingBarcode }] = useMutation(
    GENERATE_COMPANY_BARCODE,
    {
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    },
  );

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        alternate_barcodes: Array.isArray(product.alternate_barcodes)
          ? product.alternate_barcodes.filter((b: any) => typeof b === 'string')
          : [],
        category_id: product.category?.id || '',
        supplier_id: product.supplier?.id || '',
        unit: product.unit || '',
        cost_price: product.cost_price?.toString() || '',
        selling_price: product.selling_price?.toString() || '',
        description: product.description || '',
      });
    }
  }, [product]);

  const normalizeClientBarcode = (raw: string): string => {
    const noControls = raw.replace(/[\x00-\x1F\x7F]/g, '');
    const noWhitespace = noControls.replace(/\s+/g, '').trim();
    if (!noWhitespace) return '';
    if (/^\d{13}$/.test(noWhitespace)) return noWhitespace;
    return noWhitespace.toUpperCase();
  };

  const alternateValidation = (() => {
    const primary = normalizeClientBarcode(formData.barcode || '');
    const normalized = (formData.alternate_barcodes || [])
      .map((b) => normalizeClientBarcode(b || ''))
      .filter(Boolean);

    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const b of normalized) {
      if (seen.has(b)) duplicates.add(b);
      seen.add(b);
    }

    const conflictsPrimary = primary ? normalized.includes(primary) : false;

    return {
      duplicates: Array.from(duplicates),
      conflictsPrimary,
    };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (alternateValidation.duplicates.length) {
      toast({
        title: 'Duplicate alternate barcodes',
        description: 'Remove duplicates before saving',
        variant: 'destructive',
      });
      return;
    }

    if (alternateValidation.conflictsPrimary) {
      toast({
        title: 'Barcode conflict',
        description: 'Primary barcode cannot also appear in alternate barcodes',
        variant: 'destructive',
      });
      return;
    }

    const input = {
      name: formData.name,
      sku: formData.sku,
      barcode: formData.barcode || null,
      ...(isEditing && {
        alternate_barcodes: (formData.alternate_barcodes || [])
          .map((b) => b.trim())
          .filter(Boolean),
      }),
      category_id: formData.category_id || null,
      supplier_id: formData.supplier_id || null,
      unit: formData.unit,
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
      description: formData.description || null,
    };

    if (isEditing) {
      try {
        await updateProduct({
          variables: {
            input: {
              id: product.id,
              ...input,
            },
          },
        });
      } catch {
        // onError handles user-facing messaging
      }
    } else {
      try {
        await createProduct({
          variables: { input },
        });
      } catch {
        // onError handles user-facing messaging
      }
    }
  };

  const loading = creating || updating;
  const disableSave =
    loading || alternateValidation.duplicates.length > 0 || alternateValidation.conflictsPrimary;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setBarcodeInlineError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl p-0">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="px-6 pt-6 pr-12">
            <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update product information' : 'Add a new product to your catalog'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
            {barcodeInlineError ? (
              <div className="mb-4">
                <Alert variant="destructive">
                  <AlertTitle>Barcode already used</AlertTitle>
                  <AlertDescription>{barcodeInlineError}</AlertDescription>
                </Alert>
              </div>
            ) : null}
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
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => {
                      if (barcodeInlineError) setBarcodeInlineError(null);
                      setFormData({ ...formData, barcode: e.target.value });
                    }}
                    placeholder="Auto-generated if left empty"
                  />
                  {!isEditing ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={generatingBarcode || loading}
                      onClick={async () => {
                        const { data } = await generateCompanyBarcode();
                        const next = (data as any)?.generateCompanyBarcode as string | undefined;
                        if (next) {
                          setFormData((prev) => ({ ...prev, barcode: next }));
                          toast({
                            title: 'Generated',
                            description: 'Barcode generated by server',
                          });
                        }
                      }}
                      title="Generate barcode"
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>

              {/* Alternate Barcodes - Only show when editing */}
              {isEditing && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Alternate Barcodes</Label>
                  <div className="space-y-2">
                    {(formData.alternate_barcodes || []).length ? (
                      (formData.alternate_barcodes || []).map((value, idx) => (
                        <div key={`${idx}`} className="flex gap-2 items-center">
                          <Input
                            value={value}
                            onChange={(e) => {
                              const next = [...(formData.alternate_barcodes || [])];
                              next[idx] = e.target.value;
                              setFormData({ ...formData, alternate_barcodes: next });
                            }}
                            placeholder="e.g., supplier barcode"
                          />
                          <IconButton
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const next = [...(formData.alternate_barcodes || [])];
                              next.splice(idx, 1);
                              setFormData({ ...formData, alternate_barcodes: next });
                            }}
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
                          </IconButton>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground">No alternate barcodes</div>
                    )}

                    <IconButton
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          alternate_barcodes: [...(formData.alternate_barcodes || []), ''],
                        })
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Add alternate barcode
                    </IconButton>

                    {alternateValidation.conflictsPrimary ? (
                      <div className="text-xs text-destructive">
                        Primary barcode cannot also appear in alternate barcodes.
                      </div>
                    ) : null}

                    {alternateValidation.duplicates.length ? (
                      <div className="text-xs text-destructive">
                        Duplicate alternate barcodes: {alternateValidation.duplicates.join(', ')}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

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

            <div className=" -mx-6 mt-6 bg-background px-6 py-4">
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={disableSave}>
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
