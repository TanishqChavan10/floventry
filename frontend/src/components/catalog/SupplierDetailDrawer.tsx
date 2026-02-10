'use client';

import { useQuery } from '@apollo/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, Building2, Mail, Phone, MapPin, Package, Calendar, Loader2 } from 'lucide-react';
import { GET_SUPPLIER } from '@/lib/graphql/catalog';

interface SupplierDetailDrawerProps {
  supplier: any;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export default function SupplierDetailDrawer({
  supplier,
  open,
  onClose,
  onEdit,
}: SupplierDetailDrawerProps) {
  if (!supplier) return null;

  const { data, loading } = useQuery(GET_SUPPLIER, {
    variables: { id: supplier.id },
    skip: !open,
    fetchPolicy: 'cache-and-network',
  });

  const linkedProducts = data?.supplier?.products ?? [];

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3 pr-10">
            <div className="space-y-1">
              <SheetTitle className="text-2xl">{supplier.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Supplier Details
              </SheetDescription>
            </div>
            <Badge className="shrink-0 mt-1" variant={supplier.isActive ? 'default' : 'secondary'}>
              {supplier.isActive ? 'Active' : 'Archived'}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Contact Information</h3>
            <div className="space-y-3">
              {supplier.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a
                      href={`mailto:${supplier.email}`}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      {supplier.email}
                    </a>
                  </div>
                </div>
              )}

              {supplier.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a
                      href={`tel:${supplier.phone}`}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      {supplier.phone}
                    </a>
                  </div>
                </div>
              )}

              {supplier.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {supplier.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Products Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Products</h3>
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Linked Products</p>
                <p className="text-2xl font-bold">{supplier.productsCount || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {supplier.productsCount === 1 ? 'product' : 'products'} using this supplier
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading linked products...
              </div>
            ) : linkedProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No linked products</div>
            ) : (
              <div className="max-h-56 overflow-y-auto">
                <div className="space-y-2">
                  {linkedProducts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{p.name}</div>
                        <div className="truncate text-xs text-muted-foreground font-mono">
                          {p.sku}
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {p.unit}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Metadata</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {new Date(supplier.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Updated</p>
                  <p className="text-sm font-medium">
                    {new Date(supplier.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {onEdit && (
            <>
              <Separator />
              <div className="pt-2">
                <Button onClick={onEdit} className="w-full gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Supplier
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
