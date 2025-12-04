'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';

interface Movement {
  id: string;
  date: string;
  item: string;
  quantity: number;
  type: 'in' | 'out' | 'adjustment';
  source?: string; // For Stock In
  reason?: string; // For Stock Out / Adjustment
  reference?: string;
  performedBy: string;
  previousQty?: number; // For Adjustment
  newQty?: number; // For Adjustment
}

interface MovementsTableProps {
  movements: Movement[];
  type: 'in' | 'out' | 'adjustment';
}

export default function MovementsTable({ movements, type }: MovementsTableProps) {
  return (
    <div className="rounded-md border bg-white dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>
              {type === 'in'
                ? 'Quantity In'
                : type === 'out'
                ? 'Quantity Out'
                : 'Difference'}
            </TableHead>
            {type === 'adjustment' && <TableHead>Change</TableHead>}
            <TableHead>
              {type === 'in' ? 'Source' : 'Reason'}
            </TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Performed By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={type === 'adjustment' ? 7 : 6} className="h-24 text-center">
                No movements found.
              </TableCell>
            </TableRow>
          ) : (
            movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="text-slate-500">{movement.date}</TableCell>
                <TableCell className="font-medium">{movement.item}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {type === 'in' && <ArrowDownLeft className="h-4 w-4 text-green-600" />}
                    {type === 'out' && <ArrowUpRight className="h-4 w-4 text-red-600" />}
                    {type === 'adjustment' && <RefreshCw className="h-4 w-4 text-orange-600" />}
                    <span
                      className={`font-bold ${
                        type === 'in'
                          ? 'text-green-600'
                          : type === 'out'
                          ? 'text-red-600'
                          : 'text-orange-600'
                      }`}
                    >
                      {type === 'in' ? '+' : type === 'out' ? '-' : ''}
                      {Math.abs(movement.quantity)}
                    </span>
                  </div>
                </TableCell>
                {type === 'adjustment' && (
                  <TableCell className="text-sm text-slate-500">
                    {movement.previousQty} → {movement.newQty}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {type === 'in' ? movement.source : movement.reason}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-mono text-slate-500">
                  {movement.reference || '-'}
                </TableCell>
                <TableCell className="text-sm">{movement.performedBy}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
