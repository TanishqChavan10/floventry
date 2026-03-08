'use client';

import React from 'react';
import { useCategories, useToggleCategoryActive } from '@/hooks/apollo';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function CategorySettings() {
  const { data, loading, error } = useCategories();
  const [toggleActive] = useToggleCategoryActive();

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
  if (error) return <div>Error loading categories</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Categories</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.categories.map((cat: any) => (
          <div
            key={cat.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-card"
          >
            <div className="space-y-0.5">
              <Label className="text-base">{cat.name}</Label>
              <p className="text-xs text-muted-foreground">
                {cat.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <Switch
              checked={cat.isActive}
              onCheckedChange={() => handleToggle(cat.id, cat.isActive, cat.name)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
