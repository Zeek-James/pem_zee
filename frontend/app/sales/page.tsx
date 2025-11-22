'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSales, getAvailableStorage, createSale, updatePaymentStatus, getMilling, getHarvests, type Sale, type Storage, type Milling, type Harvest } from '@/lib/api';
import { format } from 'date-fns';
import { DollarSign, Plus, ShoppingCart, AlertCircle } from 'lucide-react';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [storage, setStorage] = useState<Storage[]>([]);
  const [milling, setMilling] = useState<Milling[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paymentUpdateOpen, setPaymentUpdateOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState({
    sale_date: format(new Date(), 'yyyy-MM-dd'),
    buyer_name: '',
    storage_id: '',
    quantity_sold: '',
    price_per_kg: '',
    payment_status: 'Pending',
    payment_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, storageRes, millingRes, harvestsRes] = await Promise.all([
        getSales(),
        getAvailableStorage(),
        getMilling(),
        getHarvests(),
      ]);
      setSales(salesRes.data);
      setStorage(storageRes.data.inventory);
      setMilling(millingRes.data);
      setHarvests(harvestsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_revenue, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSale({
        sale_date: formData.sale_date,
        buyer_name: formData.buyer_name,
        storage_id: parseInt(formData.storage_id),
        quantity_sold: parseFloat(formData.quantity_sold),
        price_per_kg: parseFloat(formData.price_per_kg),
        payment_status: formData.payment_status,
        payment_date: formData.payment_date || null,
      });
      setOpen(false);
      fetchData();
      setFormData({
        sale_date: format(new Date(), 'yyyy-MM-dd'),
        buyer_name: '',
        storage_id: '',
        quantity_sold: '',
        price_per_kg: '',
        payment_status: 'Pending',
        payment_date: '',
      });
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to create sale. Please try again.');
    }
  };

  const handlePaymentUpdate = async () => {
    if (!selectedSale) return;
    try {
      await updatePaymentStatus(selectedSale.id, {
        payment_status: 'Paid',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
      });
      setPaymentUpdateOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update payment status');
    }
  };

  const getStorageDetails = (storageId: number) => {
    return storage.find((s) => s.id === storageId);
  };

  const getMillingDetails = (millingId: number) => {
    return milling.find((m) => m.id === millingId);
  };

  const getHarvestDetails = (harvestId: number) => {
    return harvests.find((h) => h.id === harvestId);
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setDetailsOpen(true);
  };

  const selectedContainer = formData.storage_id
    ? storage.find((s) => s.id === parseInt(formData.storage_id))
    : null;

  const calculateProfit = (sale: Sale) => {
    const storageRecord = getStorageDetails(sale.storage_id);
    if (!storageRecord) return null;

    const millingRecord = getMillingDetails(storageRecord.milling_id);
    if (!millingRecord) return null;

    const costPerKg = millingRecord.cost_per_kg;
    const revenue = sale.total_revenue;
    const cost = costPerKg * sale.quantity_sold;
    const profit = revenue - cost;

    return { revenue, cost, profit, costPerKg };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Tracker</h1>
          <p className="text-muted-foreground">Monitor sales and payments</p>
        </div>
        <div className="flex items-center gap-4">
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                New Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Record New Sale</DialogTitle>
                  <DialogDescription>
                    Sell CPO from storage to a buyer
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sale_date">Sale Date</Label>
                    <Input
                      id="sale_date"
                      type="date"
                      value={formData.sale_date}
                      onChange={(e) =>
                        setFormData({ ...formData, sale_date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="buyer_name">Buyer Name</Label>
                    <Input
                      id="buyer_name"
                      type="text"
                      placeholder="Enter buyer name"
                      value={formData.buyer_name}
                      onChange={(e) =>
                        setFormData({ ...formData, buyer_name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="storage_id">Select Container to Sell From</Label>
                    <Select
                      value={formData.storage_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, storage_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a storage container" />
                      </SelectTrigger>
                      <SelectContent>
                        {storage.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No storage available
                          </div>
                        ) : (
                          storage.map((container) => (
                            <SelectItem
                              key={container.id}
                              value={container.id.toString()}
                            >
                              {container.container_id} - Available:{' '}
                              {container.remaining_quantity.toFixed(2)} kg (~
                              {container.remaining_quantity_liters.toFixed(2)} L)
                              {container.is_near_expiry && ' ⚠️ Near Expiry'}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {selectedContainer && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm">
                        <p className="font-medium">Container Details:</p>
                        <p className="text-muted-foreground">
                          Available: {selectedContainer.remaining_quantity.toFixed(2)} kg
                        </p>
                        <p className="text-muted-foreground">
                          Expires: {format(new Date(selectedContainer.expiry_date), 'MMM dd, yyyy')}{' '}
                          ({selectedContainer.days_until_expiry} days left)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="quantity_sold">Quantity to Sell (kg)</Label>
                    <Input
                      id="quantity_sold"
                      type="number"
                      step="0.01"
                      placeholder="Enter quantity in kg"
                      value={formData.quantity_sold}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity_sold: e.target.value })
                      }
                      required
                    />
                    {formData.quantity_sold && selectedContainer && (
                      <div className="text-sm">
                        {parseFloat(formData.quantity_sold) > selectedContainer.remaining_quantity ? (
                          <p className="text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            Cannot sell {formData.quantity_sold}kg. Only{' '}
                            {selectedContainer.remaining_quantity.toFixed(2)}kg available
                          </p>
                        ) : (
                          <p className="text-green-600">
                            ✓ Valid quantity (~{(parseFloat(formData.quantity_sold) / 0.91).toFixed(2)} L)
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="price_per_kg">Price per kg (₦)</Label>
                    <Input
                      id="price_per_kg"
                      type="number"
                      step="0.01"
                      placeholder="Enter price per kg"
                      value={formData.price_per_kg}
                      onChange={(e) =>
                        setFormData({ ...formData, price_per_kg: e.target.value })
                      }
                      required
                    />
                    {formData.quantity_sold && formData.price_per_kg && (
                      <p className="text-sm text-muted-foreground">
                        Total revenue: ₦
                        {(
                          parseFloat(formData.quantity_sold) *
                          parseFloat(formData.price_per_kg)
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="payment_status">Payment Status</Label>
                    <Select
                      value={formData.payment_status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, payment_status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.payment_status === 'Paid' && (
                    <div className="grid gap-2">
                      <Label htmlFor="payment_date">Payment Date</Label>
                      <Input
                        id="payment_date"
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) =>
                          setFormData({ ...formData, payment_date: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!formData.storage_id}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Record Sale
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
                    <th className="px-4 py-2 text-left">Container</th>
                    <th className="px-4 py-2 text-left">Quantity</th>
                    <th className="px-4 py-2 text-left">Price/kg</th>
                    <th className="px-4 py-2 text-left">Revenue</th>
                    <th className="px-4 py-2 text-left">Payment</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => {
                    const storageRecord = getStorageDetails(sale.storage_id);
                    const profit = calculateProfit(sale);

                    return (
                      <tr key={sale.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-2">{format(new Date(sale.sale_date), 'MMM dd, yyyy')}</td>
                        <td className="px-4 py-2">{sale.buyer_name}</td>
                        <td className="px-4 py-2">
                          <span className="font-mono text-sm">
                            {storageRecord?.container_id || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div>
                            <p>{sale.quantity_sold.toFixed(2)} kg</p>
                            <p className='text-xs text-muted-foreground'>
                              ~{sale.quantity_sold_liters.toFixed(2)} L
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-2">₦{sale.price_per_kg.toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <div>
                            <p className="font-medium">₦{sale.total_revenue.toLocaleString()}</p>
                            {profit && (
                              <p className={`text-xs ${profit.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Profit: ₦{profit.profit.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            sale.payment_status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {sale.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(sale)}
                            >
                              View
                            </Button>
                            {sale.payment_status === 'Pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSale(sale);
                                  setPaymentUpdateOpen(true);
                                }}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sale Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              Complete information about this sale transaction
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (() => {
            const storageRecord = getStorageDetails(selectedSale.storage_id);
            const millingRecord = storageRecord ? getMillingDetails(storageRecord.milling_id) : null;
            const harvestRecord = millingRecord?.harvest_id ? getHarvestDetails(millingRecord.harvest_id) : null;
            const profit = calculateProfit(selectedSale);

            return (
              <div className='space-y-6'>
                {/* Sale Information */}
                <div>
                  <h3 className='font-semibold mb-3'>Sale Information</h3>
                  <div className='bg-muted/50 p-4 rounded-lg space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Sale Date:</span>
                      <span className='font-medium'>
                        {format(new Date(selectedSale.sale_date), 'MMMM dd, yyyy')}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Buyer:</span>
                      <span className='font-medium'>{selectedSale.buyer_name}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Quantity Sold:</span>
                      <div className='text-right'>
                        <p className='font-medium'>{selectedSale.quantity_sold.toFixed(2)} kg</p>
                        <p className='text-sm text-muted-foreground'>
                          ~{selectedSale.quantity_sold_liters.toFixed(2)} L
                        </p>
                      </div>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Price per kg:</span>
                      <span className='font-medium'>₦{selectedSale.price_per_kg.toLocaleString()}</span>
                    </div>
                    <div className='flex justify-between pt-2 border-t'>
                      <span className='font-semibold'>Total Revenue:</span>
                      <span className='font-bold text-lg text-green-600'>
                        ₦{selectedSale.total_revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className='border-t pt-4'>
                  <h3 className='font-semibold mb-3'>Payment Status</h3>
                  <div className={`p-4 rounded-lg ${
                    selectedSale.payment_status === 'Paid'
                      ? 'bg-green-50 dark:bg-green-950'
                      : 'bg-yellow-50 dark:bg-yellow-950'
                  }`}>
                    <div className='flex justify-between items-center'>
                      <span className='font-medium'>Status:</span>
                      <span className={`px-3 py-1 rounded-full ${
                        selectedSale.payment_status === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedSale.payment_status}
                      </span>
                    </div>
                    {selectedSale.payment_date && (
                      <div className='flex justify-between mt-2'>
                        <span className='text-muted-foreground'>Payment Date:</span>
                        <span className='font-medium'>
                          {format(new Date(selectedSale.payment_date), 'MMMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Source Container */}
                {storageRecord && (
                  <div className='border-t pt-4'>
                    <h3 className='font-semibold mb-3'>Source Container</h3>
                    <div className='bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Container ID:</span>
                        <span className='font-medium font-mono'>{storageRecord.container_id}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Original Quantity:</span>
                        <span className='font-medium'>
                          {storageRecord.quantity.toFixed(2)} kg
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Remaining After Sale:</span>
                        <span className='font-medium'>
                          {storageRecord.remaining_quantity.toFixed(2)} kg
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Plantation Source:</span>
                        <span className='font-medium'>{storageRecord.plantation_source}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profitability Analysis */}
                {profit && (
                  <div className='border-t pt-4'>
                    <h3 className='font-semibold mb-3'>Profitability Analysis</h3>
                    <div className='bg-amber-50 dark:bg-amber-950 p-4 rounded-lg space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Production Cost (₦{profit.costPerKg.toFixed(2)}/kg):</span>
                        <span className='font-medium'>₦{profit.cost.toLocaleString()}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Revenue:</span>
                        <span className='font-medium'>₦{profit.revenue.toLocaleString()}</span>
                      </div>
                      <div className='flex justify-between pt-2 border-t'>
                        <span className='font-semibold'>Net Profit:</span>
                        <span className={`font-bold text-lg ${
                          profit.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ₦{profit.profit.toLocaleString()}
                        </span>
                      </div>
                      <div className='mt-2 text-xs text-muted-foreground'>
                        Profit margin: {((profit.profit / profit.revenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Traceability */}
                {harvestRecord && (
                  <div className='border-t pt-4'>
                    <h3 className='font-semibold mb-3'>Traceability</h3>
                    <div className='bg-green-50 dark:bg-green-950 p-4 rounded-lg text-sm space-y-2'>
                      <p className='font-medium text-green-900 dark:text-green-100 mb-2'>
                        Original Source
                      </p>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Harvest Date:</span>
                        <span className='font-medium'>
                          {format(new Date(harvestRecord.harvest_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Source Type:</span>
                        <span>
                          {harvestRecord.is_purchased ? (
                            <span className='px-2 py-1 text-xs rounded-full bg-primary/10 text-primary'>
                              Purchased from {harvestRecord.supplier_name}
                            </span>
                          ) : (
                            <span className='px-2 py-1 text-xs rounded-full bg-green-100 text-green-800'>
                              Own Harvest
                            </span>
                          )}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>FFB Weight:</span>
                        <span className='font-medium'>{harvestRecord.total_weight.toFixed(2)} kg</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Update Dialog */}
      <Dialog open={paymentUpdateOpen} onOpenChange={setPaymentUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Status</DialogTitle>
            <DialogDescription>
              Mark this sale as paid
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className='space-y-4'>
              <div className='bg-muted p-4 rounded-lg'>
                <p className='text-sm text-muted-foreground'>Sale to:</p>
                <p className='font-medium'>{selectedSale.buyer_name}</p>
                <p className='text-sm text-muted-foreground mt-2'>Amount:</p>
                <p className='font-bold text-lg'>₦{selectedSale.total_revenue.toLocaleString()}</p>
              </div>
              <p className='text-sm text-muted-foreground'>
                This will mark the payment as received and set the payment date to today.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setPaymentUpdateOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePaymentUpdate}>
              Confirm Payment Received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
