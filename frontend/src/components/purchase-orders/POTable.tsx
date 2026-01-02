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
import { MoreHorizontal, Eye, Truck, FileText, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  date: string;
  itemCount: number;
  total: string;
  status: 'Draft' | 'Sent' | 'Partially Delivered' | 'Delivered' | 'Cancelled';
}

interface POTableProps {
  orders: PurchaseOrder[];
  role: string;
}

export default function POTable({ orders, role }: POTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Sent':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Partially Delivered':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Draft':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="rounded-md border bg-white dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO Number</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No purchase orders found.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium font-mono">{order.poNumber}</TableCell>
                <TableCell>{order.supplier}</TableCell>
                <TableCell className="text-slate-500">{order.date}</TableCell>
                <TableCell>{order.itemCount} items</TableCell>
                <TableCell className="font-semibold">{order.total}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`font-normal ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </Badge>
                </TableCell>
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
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {(order.status === 'Sent' || order.status === 'Partially Delivered') && (
                        <DropdownMenuItem asChild>
                          <Link href={`/purchase-orders/${order.id}/delivery`}>
                            <Truck className="mr-2 h-4 w-4" />
                            Receive Delivery
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                      {role === 'admin' && order.status === 'Draft' && (
                        <DropdownMenuItem className="text-red-600 focus:text-red-600">
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel PO
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
