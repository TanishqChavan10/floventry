'use client';

import { useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { API_URL } from '@/config/env';

export function SupplierReports() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const { run, isLoading } = useAsyncAction();

  useEffect(() => {
    void run(async () => {
      const token = await getToken();
      const res = await fetch(`${API_URL}/reports/supplier-performance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      setData(json);
    }).catch((error) => {
      console.error('Failed to fetch supplier report', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Supplier Performance</h3>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Supplier Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Total Shipments</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Avg Delivery Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((supplier: any) => (
                <TableRow key={supplier.supplierName}>
                  <TableCell>{supplier.supplierName}</TableCell>
                  <TableCell>{supplier.totalShipments}</TableCell>
                  <TableCell>${supplier.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>{supplier.averageDeliveryTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
