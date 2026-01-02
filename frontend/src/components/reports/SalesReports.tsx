'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { useAuth } from '@clerk/nextjs';

export function SalesReports() {
  const { getToken } = useAuth();
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!date?.from || !date?.to) return;
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reports/sales?startDate=${date.from.toISOString()}&endDate=${date.to.toISOString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch sales report', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Sales Overview</h3>
        <DatePickerWithRange date={date} setDate={setDate} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.summary.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.chartData}>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip />
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <Bar dataKey="amount" fill="#adfa1d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {data.topProducts.map((product: any) => (
              <div className="flex items-center" key={product.name}>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {product.name}
                  </p>
                </div>
                <div className="ml-auto font-medium">{product.qty} sold</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
