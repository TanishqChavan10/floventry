'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLoadingContext } from '@/context/loading-context';
import {
  useExportStockSnapshot,
  useExportStockMovements,
  useExportAdjustments,
  useExportExpiryLots,
  useExportInventorySummary,
  useExportCompanyMovements,
  useExportExpiryRisk,
} from '@/hooks/apollo';

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
  const { plan, loading } = require('@/hooks/usePlanTier').usePlanTier();

  const [exportStockSnapshot] = useExportStockSnapshot();
  const [exportStockMovements] = useExportStockMovements();
  const [exportAdjustments] = useExportAdjustments();
  const [exportExpiryLots] = useExportExpiryLots();
  const [exportInventorySummary] = useExportInventorySummary();
  const [exportCompanyMovements] = useExportCompanyMovements();
  const [exportExpiryRisk] = useExportExpiryRisk();

  const exportFns: Record<ExportType, typeof exportStockSnapshot> = {
    stock_snapshot: exportStockSnapshot,
    stock_movements: exportStockMovements,
    adjustments: exportAdjustments,
    expiry_lots: exportExpiryLots,
    inventory_summary: exportInventorySummary,
    company_movements: exportCompanyMovements,
    expiry_risk: exportExpiryRisk,
  };

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

    exportFns[type]({ variables })
      .then(({ data }) => {
        setIsExporting(false);
        _decrement();
        if (!data) return;
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
      })
      .catch((error: any) => {
        setIsExporting(false);
        _decrement();
        toast({
          title: 'Export Failed',
          description: error.message,
          variant: 'destructive',
        });
      });
  };

  // Pro-only export types (company-level)
  const proOnlyTypes: ExportType[] = ['inventory_summary', 'expiry_risk'];
  const requiresPro = proOnlyTypes.includes(type);

  // Standard+ exports allowed for Standard and Pro, Pro-only need Pro
  const exportAllowed = requiresPro ? plan === 'Pro' : plan === 'Standard' || plan === 'Pro';

  const gateMessage = requiresPro
    ? 'This export requires a Pro plan.'
    : 'Export is only available for Standard and Pro plans.';

  return (
    <Button
      onClick={exportAllowed ? handleExport : undefined}
      disabled={disabled || isExporting || !exportAllowed || loading}
      variant={variant}
      size={size}
      className="gap-2"
      title={!exportAllowed ? gateMessage : undefined}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          {!exportAllowed ? (
            <Crown className="h-4 w-4 text-amber-500" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {label || `Export ${getExportLabel(type)}`}
        </>
      )}
    </Button>
  );
}
