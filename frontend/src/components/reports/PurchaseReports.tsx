'use client';

import { useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
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

export function PurchaseReports() {
  const { getToken } = useAuth();
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [data, setData] = useState<any>(null);
  const { run, isLoading } = useAsyncAction();

  useEffect(() => {
    if (!date?.from || !date?.to) return;
    void run(async () => {
      const token = await getToken();
      const res = await fetch(
        `${API_URL}/reports/purchase?startDate=${date.from!.toISOString()}&endDate=${date.to!.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const json = await res.json();
      setData(json);
    }).catch((error) => {
      console.error('Failed to fetch purchase report', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Purchase Overview</h3>
        <DatePickerWithRange date={date} setDate={setDate} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.summary.totalSpent.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalShipments}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Recent Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Ref No</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.shipments.map((shipment: any) => (
                <TableRow key={shipment.shipment_id}>
                  <TableCell>{new Date(shipment.received_date).toLocaleDateString()}</TableCell>
                  <TableCell>{shipment.supplier?.name}</TableCell>
                  <TableCell>{shipment.ref_no}</TableCell>
                  <TableCell className="text-right">
                    ${Number(shipment.invoice_amt).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
