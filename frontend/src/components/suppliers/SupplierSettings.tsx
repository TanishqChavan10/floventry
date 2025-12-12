'use client';

import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SUPPLIERS } from '@/lib/graphql/catalog';
import { TOGGLE_SUPPLIER_ACTIVE } from '@/lib/graphql/settings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SupplierSettings() {
  const { data, loading, error } = useQuery(GET_SUPPLIERS);
  const [toggleActive] = useMutation(TOGGLE_SUPPLIER_ACTIVE);

  const handleToggle = async (id: string, currentStatus: boolean, name: string) => {
    try {
      await toggleActive({
        variables: {
          input: { id, isActive: !currentStatus },
        },
      });
      toast.success(`${name} is now ${!currentStatus ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading suppliers</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Suppliers</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.suppliers.map((sup: any) => (
          <div
            key={sup.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-card"
          >
            <div className="space-y-0.5">
              <Label className="text-base">{sup.name}</Label>
              <p className="text-xs text-muted-foreground">
                {sup.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <Switch
              checked={sup.isActive}
              onCheckedChange={() => handleToggle(sup.id, sup.isActive, sup.name)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
