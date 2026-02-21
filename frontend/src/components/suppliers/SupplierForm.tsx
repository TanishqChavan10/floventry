'use client';

import React from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useParams } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SupplierFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export default function SupplierForm({ initialData, isEditing = false }: SupplierFormProps) {
  const params = useParams();
  const companySlug = params?.slug as string;
  const router = useRouter();
  const { run, isLoading } = useAsyncAction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await new Promise((res) => setTimeout(res, 1500));
      toast.success(isEditing ? 'Supplier updated successfully' : 'Supplier added successfully');
      router.push(`/${companySlug}/suppliers`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                defaultValue={initialData?.name}
                required
                placeholder="e.g. EcoSupply Pvt Ltd"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                defaultValue={initialData?.contactPerson}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={initialData?.email}
                  placeholder="contact@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue={initialData?.phone} placeholder="+1 234 567 890" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                defaultValue={initialData?.address}
                placeholder="Full address..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gst">GST / Tax ID</Label>
              <Input id="gst" defaultValue={initialData?.gst} placeholder="e.g. 27ABCDE1234F1Z5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select defaultValue={initialData?.paymentTerms || 'net30'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="net15">Net 15</SelectItem>
                    <SelectItem value="net30">Net 30</SelectItem>
                    <SelectItem value="net60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Supplier Type</Label>
                <Select defaultValue={initialData?.type || 'distributor'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="importer">Importer</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                defaultValue={initialData?.creditLimit}
                placeholder="0.00"
              />
            </div>

            {isEditing && (
              <div className="space-y-2 pt-4 border-t">
                <Label>Status</Label>
                <Select defaultValue={initialData?.status || 'Active'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Suspended suppliers cannot receive new purchase orders.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes & Documents */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                defaultValue={initialData?.notes}
                placeholder="Internal notes about this supplier..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Documents</Label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Click to upload documents
                </p>
                <p className="text-xs text-slate-500">
                  PDF, PNG, JPG up to 10MB (Contracts, Licenses, etc.)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Add Supplier'}
        </Button>
      </div>
    </form>
  );
}
