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
import { StockMovement, MovementType } from '@/types/stock';
import { format } from 'date-fns';

interface MovementsTableProps {
  movements: StockMovement[];
  type?: MovementType;
}

export default function MovementsTable({ movements, type }: MovementsTableProps) {
  const getMovementIcon = (movementType: MovementType) => {
    switch (movementType) {
      case MovementType.IN:
      case MovementType.TRANSFER_IN:
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case MovementType.OUT:
      case MovementType.TRANSFER_OUT:
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case MovementType.ADJUSTMENT:
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
    }
  };

  const getMovementColor = (movementType: MovementType) => {
    switch (movementType) {
      case MovementType.IN:
      case MovementType.TRANSFER_IN:
        return 'text-green-600';
      case MovementType.OUT:
      case MovementType.TRANSFER_OUT:
        return 'text-red-600';
      case MovementType.ADJUSTMENT:
        return 'text-orange-600';
    }
  };

  const getUserName = (user: StockMovement['user']) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.id;
  };

  return (
    <div className="rounded-md border bg-white dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            {type === MovementType.ADJUSTMENT && <TableHead>Change</TableHead>}
            <TableHead>Reason</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Performed By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={type === MovementType.ADJUSTMENT ? 8 : 7} className="h-24 text-center">
                No movements found.
              </TableCell>
            </TableRow>
          ) : (
            movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="text-slate-500">
                  {format(new Date(movement.created_at), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div>{movement.product.name}</div>
                    <div className="text-xs text-slate-500">{movement.product.sku}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {movement.type.replace('_', ' ').toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getMovementIcon(movement.type)}
                    <span className={`font-bold ${getMovementColor(movement.type)}`}>
                      {movement.quantity > 0 ? '+' : ''}
                      {movement.quantity}
                    </span>
                  </div>
                </TableCell>
                {type === MovementType.ADJUSTMENT && (
                  <TableCell className="text-sm text-slate-500">
                    {movement.previous_quantity} → {movement.new_quantity}
                  </TableCell>
                )}
                <TableCell>
                  {movement.reason ? (
                    <Badge variant="outline" className="capitalize">
                      {movement.reason}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-sm font-mono text-slate-500">
                  {movement.reference_id || '-'}
                </TableCell>
                <TableCell className="text-sm">{getUserName(movement.user)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
