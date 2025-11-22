'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSales, type Sale } from '@/lib/api';
import { format } from 'date-fns';
import { DollarSign } from 'lucide-react';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await getSales();
      setSales(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Tracker</h1>
          <p className="text-muted-foreground">Monitor sales and payments</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <CardDescription>All sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Buyer</th>
                    <th className="px-4 py-2 text-left">Quantity (kg)</th>
                    <th className="px-4 py-2 text-left">Price/kg</th>
                    <th className="px-4 py-2 text-left">Total Revenue</th>
                    <th className="px-4 py-2 text-left">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b">
                      <td className="px-4 py-2">{format(new Date(sale.sale_date), 'MMM dd, yyyy')}</td>
                      <td className="px-4 py-2">{sale.buyer_name}</td>
                      <td className="px-4 py-2">
                        <div>
                          <p>{sale.quantity_sold.toFixed(2)} kg</p>
                          <p className='text-xs text-muted-foreground'>
                            ~{sale.quantity_sold_liters.toFixed(2)} L
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-2">₦{sale.price_per_kg.toLocaleString()}</td>
                      <td className="px-4 py-2">₦{sale.total_revenue.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          sale.payment_status === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sale.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
