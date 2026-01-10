'use client';

import { ImportWizard } from '@/components/import/ImportWizard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type BulkEntryType = 'products' | 'categories' | 'suppliers';

const TITLES: Record<BulkEntryType, { title: string; description: string }> = {
  products: {
    title: 'Bulk Add Products',
    description: 'Create many products at once using CSV upload or paste from Sheets.',
  },
  categories: {
    title: 'Bulk Add Categories',
    description: 'Create many categories at once using CSV upload or paste from Sheets.',
  },
  suppliers: {
    title: 'Bulk Add Suppliers',
    description: 'Create many suppliers at once using CSV upload or paste from Sheets.',
  },
};

export function BulkEntryModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: BulkEntryType;
  onCompleted?: () => void;
}) {
  const { open, onOpenChange, type, onCompleted } = props;
  const meta = TITLES[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl w-[96vw] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <div className="p-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle>{meta.title}</DialogTitle>
            <DialogDescription>{meta.description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-6 pt-2">
            <ImportWizard
              type={type}
              onComplete={() => {
                onOpenChange(false);
                onCompleted?.();
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
