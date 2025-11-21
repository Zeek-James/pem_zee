'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMilling, type Milling } from '@/lib/api';
import { format } from 'date-fns';

export default function MillingPage() {
  const [milling, setMilling] = useState<Milling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilling();
  }, []);

  const fetchMilling = async () => {
    try {
      const res = await getMilling();
      setMilling(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Milling Operations</h1>
        <p className="text-muted-foreground">Track milling and oil production</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Milling Records</CardTitle>
          <CardDescription>All milling operations and oil yield data</CardDescription>
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
                    <th className="px-4 py-2 text-left">Mill</th>
                    <th className="px-4 py-2 text-left">Oil Yield (kg)</th>
                    <th className="px-4 py-2 text-left">Cost (₦)</th>
                    <th className="px-4 py-2 text-left">Cost/kg (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {milling.map((record) => (
                    <tr key={record.id} className="border-b">
                      <td className="px-4 py-2">{format(new Date(record.milling_date), 'MMM dd, yyyy')}</td>
                      <td className="px-4 py-2">{record.mill_location}</td>
                      <td className="px-4 py-2">{record.oil_yield.toFixed(2)}</td>
                      <td className="px-4 py-2">₦{record.total_cost.toLocaleString()}</td>
                      <td className="px-4 py-2">₦{record.cost_per_kg.toFixed(2)}</td>
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
