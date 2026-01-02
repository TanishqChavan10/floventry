'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Download, ChevronDown, FileSpreadsheet, FileText, File, Loader2 } from 'lucide-react';
import { useExportData, ExportOptions } from '@/hooks/useExportData';

interface ExportDropdownProps {
  data: any[] | { [sheetName: string]: any[] };
  filename?: string;
  title?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
  customOptions?: ExportOptions;
}

export function ExportDropdown({
  data,
  filename = 'export',
  title = 'Export Data',
  variant = 'outline',
  size = 'default',
  disabled = false,
  className = '',
  customOptions = {},
}: ExportDropdownProps) {
  const { exportData, exportProgress, isExporting } = useExportData();
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsOpen(false);

    const options: ExportOptions = {
      filename,
      title,
      includeTimestamp: true,
      ...customOptions,
    };

    await exportData(data, format, options);
  };

  const isDisabled =
    disabled ||
    isExporting ||
    !data ||
    (Array.isArray(data) && data.length === 0) ||
    (!Array.isArray(data) && Object.keys(data).length === 0);

  return (
    <div className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={isDisabled} className={className}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export Format</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export as Excel
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="cursor-pointer"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Progress indicator overlay */}
      {isExporting && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-background border rounded-md shadow-md z-50 min-w-[250px]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">{exportProgress.message}</span>
            </div>
            <Progress value={exportProgress.progress} className="h-2" />
            <div className="text-xs text-muted-foreground">{exportProgress.progress}% complete</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified export button for single format
interface ExportButtonProps {
  data: any[];
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  title?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  customOptions?: ExportOptions;
}

export function ExportButton({
  data,
  format,
  filename = 'export',
  title = 'Export Data',
  variant = 'outline',
  size = 'default',
  disabled = false,
  className = '',
  children,
  customOptions = {},
}: ExportButtonProps) {
  const { exportData, exportProgress, isExporting } = useExportData();

  const handleExport = async () => {
    const options: ExportOptions = {
      filename,
      title,
      includeTimestamp: true,
      ...customOptions,
    };

    await exportData(data, format, options);
  };

  const isDisabled = disabled || isExporting || !data || data.length === 0;

  const getIcon = () => {
    switch (format) {
      case 'csv':
      case 'excel':
        return FileSpreadsheet;
      case 'pdf':
        return FileText;
      default:
        return File;
    }
  };

  const Icon = getIcon();
  const formatLabel = format.toUpperCase();

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        disabled={isDisabled}
        onClick={handleExport}
        className={className}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Icon className="w-4 h-4 mr-2" />
            {children || `Export ${formatLabel}`}
          </>
        )}
      </Button>

      {/* Progress indicator overlay */}
      {isExporting && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-background border rounded-md shadow-md z-50 min-w-[250px]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">{exportProgress.message}</span>
            </div>
            <Progress value={exportProgress.progress} className="h-2" />
            <div className="text-xs text-muted-foreground">{exportProgress.progress}% complete</div>
          </div>
        </div>
      )}
    </div>
  );
}
