'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ImportType = 'categories' | 'products' | 'suppliers';

interface PreviewRow {
  data: Record<string, string>;
  lineNumber: number;
  isEmpty: boolean;
}

interface ImportPreviewProps {
  type: ImportType;
  rows: PreviewRow[];
  existingKeys?: Set<string>;
}

export function ImportPreview({ type, rows, existingKeys = new Set() }: ImportPreviewProps) {
  if (rows.length === 0) {
    return null;
  }

  const getKeyField = () => {
    switch (type) {
      case 'categories': return 'name';
      case 'products': return 'sku';
      case 'suppliers': return 'name';
      default: return 'name';
    }
  };

  const getDisplayColumns = (): { key: string; label: string }[] => {
    switch (type) {
      case 'categories':
        return [
          { key: 'name', label: 'Category Name' },
          { key: 'description', label: 'Description' },
        ];
      case 'products':
        return [
          { key: 'sku', label: 'SKU' },
          { key: 'name', label: 'Product Name' },
          { key: 'unit', label: 'Unit' },
          { key: 'description', label: 'Description' },
        ];
      case 'suppliers':
        return [
          { key: 'name', label: 'Supplier Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
        ];
      default:
        return [];
    }
  };

  const keyField = getKeyField();
  const columns = getDisplayColumns();

  // Check for duplicates within the list
  const keyCount = new Map<string, number>();
  rows.forEach((row) => {
    const key = row.data[keyField];
    if (key) {
      keyCount.set(key, (keyCount.get(key) || 0) + 1);
    }
  });

  const validCount = rows.filter((r) => {
    const key = r.data[keyField];
    return key && !r.isEmpty && !existingKeys.has(key) && (keyCount.get(key) || 0) === 1;
  }).length;

  const errorCount = rows.length - validCount;

  const entityLabel = type === 'categories' ? 'categories' : type === 'products' ? 'products' : 'suppliers';

  return (
    <div className="space-y-3">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center gap-4 text-sm">
            <span>
              <strong>Preview:</strong> {rows.length} {entityLabel} detected
            </span>
            <span className="text-green-600">✓ {validCount} valid</span>
            {errorCount > 0 && <span className="text-red-600">⚠ {errorCount} issues</span>}
          </div>
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Status</TableHead>
              {columns.map(col => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const key = row.data[keyField];
              const isDuplicate = (keyCount.get(key) || 0) > 1;
              const isExisting = existingKeys.has(key);
              const isEmpty = row.isEmpty || !key;
              const isValid = !isEmpty && !isDuplicate && !isExisting;

              let statusIcon;
              let statusColor = '';
              let statusMessage = '';

              if (isEmpty) {
                statusIcon = <XCircle className="h-4 w-4" />;
                statusColor = 'text-red-600';
                statusMessage = 'Missing required field';
              } else if (isExisting) {
                statusIcon = <AlertCircle className="h-4 w-4" />;
                statusColor = 'text-orange-600';
                statusMessage = 'Already exists';
              } else if (isDuplicate) {
                statusIcon = <AlertCircle className="h-4 w-4" />;
                statusColor = 'text-orange-600';
                statusMessage = 'Duplicate';
              } else {
                statusIcon = <CheckCircle className="h-4 w-4" />;
                statusColor = 'text-green-600';
                statusMessage = 'Valid';
              }

              return (
                <TableRow key={index} className={!isValid ? 'bg-red-50 dark:bg-red-950/10' : ''}>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${statusColor}`} title={statusMessage}>
                      {statusIcon}
                    </div>
                  </TableCell>
                  {columns.map(col => (
                    <TableCell 
                      key={col.key}
                      className={col.key === keyField && isEmpty ? 'text-red-600 font-medium' : col.key === keyField ? 'font-medium' : 'text-muted-foreground'}
                    >
                      {row.data[col.key] || '—'}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Keep the old name for backward compatibility
export { ImportPreview as PlainTextPreview };
