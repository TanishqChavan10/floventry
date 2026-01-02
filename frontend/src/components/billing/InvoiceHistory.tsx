'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';

export function InvoiceHistory() {
  // Mock data
  const invoices = [
    { id: 'INV-001', date: '2023-12-15', amount: '$49.00', status: 'Paid' },
    { id: 'INV-002', date: '2023-11-15', amount: '$49.00', status: 'Paid' },
    { id: 'INV-003', date: '2023-10-15', amount: '$49.00', status: 'Paid' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice History</CardTitle>
        <CardDescription>
          View and download your past invoices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                <TableCell>{invoice.amount}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
