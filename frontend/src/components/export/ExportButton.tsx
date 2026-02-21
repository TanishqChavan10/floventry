'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLoadingContext } from '@/context/loading-context';
import {
  EXPORT_STOCK_SNAPSHOT,
  EXPORT_STOCK_MOVEMENTS,
  EXPORT_ADJUSTMENTS,
  EXPORT_EXPIRY_LOTS,
  EXPORT_INVENTORY_SUMMARY,
  EXPORT_COMPANY_MOVEMENTS,
  EXPORT_EXPIRY_RISK,
} from '@/lib/graphql/export';

type ExportType =
  | 'stock_snapshot'
  | 'stock_movements'
  | 'adjustments'
  | 'expiry_lots'
  | 'inventory_summary'
  | 'company_movements'
  | 'expiry_risk';

interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  productIds?: string[];
  warehouseIds?: string[];
}

interface ExportButtonProps {
  type: ExportType;
  warehouseId?: string;
  filters?: ExportFilters;
  disabled?: boolean;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const EXPORT_MUTATIONS = {
  stock_snapshot: EXPORT_STOCK_SNAPSHOT,
  stock_movements: EXPORT_STOCK_MOVEMENTS,
  adjustments: EXPORT_ADJUSTMENTS,
  expiry_lots: EXPORT_EXPIRY_LOTS,
  inventory_summary: EXPORT_INVENTORY_SUMMARY,
  company_movements: EXPORT_COMPANY_MOVEMENTS,
  expiry_risk: EXPORT_EXPIRY_RISK,
};

const getExportLabel = (type: ExportType): string => {
  const labels: Record<ExportType, string> = {
    stock_snapshot: 'Stock Snapshot',
    stock_movements: 'Stock Movements',
    adjustments: 'Adjustments',
    expiry_lots: 'Expiry & Lots',
    inventory_summary: 'Inventory Summary',
    company_movements: 'Company Movements',
    expiry_risk: 'Expiry Risk',
  };
  return labels[type];
};

export function ExportButton({
  type,
  warehouseId,
  filters,
  disabled = false,
  label,
  variant = 'outline',
  size = 'sm',
}: ExportButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const { _increment, _decrement } = useLoadingContext();

  const mutation = EXPORT_MUTATIONS[type];

  const [executeExport] = useMutation(mutation, {
    onCompleted: (data) => {
      setIsExporting(false);
      _decrement();
      const csvContent = Object.values(data)[0] as string;

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${type}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: `${getExportLabel(type)} exported successfully`,
      });
    },
    onError: (error) => {
      setIsExporting(false);
      _decrement();
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleExport = () => {
    setIsExporting(true);
    _increment();

    const variables: any = {};

    if (warehouseId) {
      variables.warehouseId = warehouseId;
    }

    if (filters && Object.keys(filters).length > 0) {
      variables.filters = filters;
    }

    executeExport({ variables });
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting}
      variant={variant}
      size={size}
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          {label || `Export ${getExportLabel(type)}`}
        </>
      )}
    </Button>
  );
}
