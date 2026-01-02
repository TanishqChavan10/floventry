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
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  value: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  updatedAt: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
  role: string;
  onDelete: (id: string) => void;
}

export default function InventoryTable({ items, role, onDelete }: InventoryTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Out of Stock':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Discontinued':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="rounded-md border bg-white dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No items found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell>{item.value}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`font-normal ${getStatusColor(item.status)}`}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>{item.updatedAt}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/inventory/items/${item.id}/edit`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {(role === 'admin' || role === 'manager') && (
                        <DropdownMenuItem asChild>
                          <Link href={`/inventory/items/${item.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Item
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {role === 'admin' && (
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => onDelete(item.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Item
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
