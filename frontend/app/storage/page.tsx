'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAvailableStorage, type Storage } from '@/lib/api';
import { format } from 'date-fns';
import { Package } from 'lucide-react';

export default function StoragePage() {
  const [storage, setStorage] = useState<Storage[]>([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStorage();
  }, []);

  const fetchStorage = async () => {
    try {
      const res = await getAvailableStorage();
      setStorage(res.data.inventory);
      setTotalQuantity(res.data.total_quantity);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (item: Storage) => {
    if (item.is_expired) return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Expired</span>;
    if (item.is_near_expiry) return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Near Expiry</span>;
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Good</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage Management</h1>
          <p className="text-muted-foreground">Monitor CPO inventory and expiry</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Available</p>
                <p className="text-2xl font-bold">{totalQuantity.toFixed(2)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Storage Inventory</CardTitle>
          <CardDescription>Available CPO in storage</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Container</th>
                    <th className="px-4 py-2 text-left">Quantity (kg)</th>
                    <th className="px-4 py-2 text-left">Storage Date</th>
                    <th className="px-4 py-2 text-left">Expiry Date</th>
                    <th className="px-4 py-2 text-left">Days Remaining</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {storage.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-4 py-2 font-medium">{item.container_id}</td>
                      <td className="px-4 py-2">{item.quantity.toFixed(2)}</td>
                      <td className="px-4 py-2">{format(new Date(item.storage_date), 'MMM dd, yyyy')}</td>
                      <td className="px-4 py-2">{format(new Date(item.expiry_date), 'MMM dd, yyyy')}</td>
                      <td className="px-4 py-2">{item.days_until_expiry}</td>
                      <td className="px-4 py-2">{getStatusBadge(item)}</td>
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
