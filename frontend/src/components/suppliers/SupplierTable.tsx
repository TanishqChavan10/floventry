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
import { MoreHorizontal, Edit, Phone, Mail, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  itemsSupplied: number;
  balance: string;
  status: 'Active' | 'Inactive' | 'Suspended';
}

interface SupplierTableProps {
  suppliers: Supplier[];
  role: string;
}

export default function SupplierTable({ suppliers, role }: SupplierTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Inactive':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'Suspended':
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
            <TableHead>Supplier</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No suppliers found.
              </TableCell>
            </TableRow>
          ) : (
            suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell>
                  <div className="font-medium">{supplier.name}</div>
                  <div className="text-xs text-slate-500">{supplier.email}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{supplier.contactPerson}</div>
                  <div className="text-xs text-slate-500">{supplier.phone}</div>
                </TableCell>
                <TableCell>{supplier.itemsSupplied}</TableCell>
                <TableCell>{supplier.balance}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`font-normal ${getStatusColor(supplier.status)}`}
                  >
                    {supplier.status}
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
                      <DropdownMenuItem asChild>
                        <Link href={`/suppliers/${supplier.id}/edit`}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {(role === 'admin' || role === 'manager') && (
                        <DropdownMenuItem asChild>
                          <Link href={`/suppliers/${supplier.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Supplier
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Email Supplier
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Phone className="mr-2 h-4 w-4" />
                        Call Supplier
                      </DropdownMenuItem>
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
