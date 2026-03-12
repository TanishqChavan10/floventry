'use client';

import React from 'react';
import { useArchiveWarehouse } from '@/hooks/apollo';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ArchiveWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  warehouseName: string;
  companySlug: string;
  onSuccess?: () => void;
}

export function ArchiveWarehouseDialog({
  open,
  onOpenChange,
  warehouseId,
  warehouseName,
  companySlug,
  onSuccess,
}: ArchiveWarehouseDialogProps) {
  const [archiveWarehouse, { loading }] = useArchiveWarehouse();

  async function handleDelete() {
    try {
      await archiveWarehouse({
        variables: {
          id: warehouseId,
        },
      });

      toast.success(`Warehouse "${warehouseName}" has been archived`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      // Parse error message for better UX
      const errorMessage = error.message || 'Failed to archive warehouse';

      // Show detailed error message
      if (errorMessage.includes('active stock')) {
        toast.error('Cannot Archive Warehouse', {
          description: errorMessage,
          duration: 6000,
        });
      } else if (errorMessage.includes('draft GRN')) {
        toast.error('Pending GRNs Block Archiving', {
          description: errorMessage,
          duration: 6000,
        });
      } else if (errorMessage.includes('draft issue')) {
        toast.error('Pending Issues Block Archiving', {
          description: errorMessage,
          duration: 6000,
        });
      } else if (errorMessage.includes('draft transfer')) {
        toast.error('Pending Transfers Block Archiving', {
          description: errorMessage,
          duration: 6000,
        });
      } else if (errorMessage.includes('stock lot')) {
        toast.error('Stock Lots Exist', {
          description: errorMessage,
          duration: 6000,
        });
      } else {
        toast.error('Archive Failed', {
          description: errorMessage,
          duration: 6000,
        });
      }
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Archive Warehouse
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive <strong>{warehouseName}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>This action cannot be undone</AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            <p>Before archiving, ensure:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All stock has been transferred or adjusted out</li>
              <li>No draft GRNs, Issues, or Transfers exist</li>
              <li>All stock lots have been cleared</li>
            </ul>
          </AlertDescription>
        </Alert>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Archive Warehouse
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
