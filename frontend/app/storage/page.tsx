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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getAvailableStorage, getMilling, getHarvests, type Storage, type Milling, type Harvest } from '@/lib/api';
import { format } from 'date-fns';
import { Package, TrendingUp, AlertCircle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function StoragePage() {
  return (
    <ProtectedRoute>
      <StorageContent />
    </ProtectedRoute>
  );
}

function StorageContent() {
  const [storage, setStorage] = useState<Storage[]>([]);
  const [milling, setMilling] = useState<Milling[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [storageRes, millingRes, harvestsRes] = await Promise.all([
        getAvailableStorage(),
        getMilling(),
        getHarvests(),
      ]);
      setStorage(storageRes.data.inventory);
      setTotalQuantity(storageRes.data.total_quantity);
      setMilling(millingRes.data);
      setHarvests(harvestsRes.data);
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

  const getMillingDetails = (millingId: number) => {
    return milling.find((m) => m.id === millingId);
  };

  const getHarvestDetails = (harvestId: number) => {
    return harvests.find((h) => h.id === harvestId);
  };

  const handleViewDetails = (item: Storage) => {
    setSelectedStorage(item);
    setDetailsOpen(true);
  };

  const getSellPriority = (item: Storage) => {
    // Priority based on days until expiry
    if (item.is_expired) return { priority: 'URGENT', color: 'text-red-600', message: 'Expired - Cannot sell' };
    if (item.days_until_expiry <= 5) return { priority: 'HIGH', color: 'text-orange-600', message: 'Sell immediately - Expires soon' };
    if (item.days_until_expiry <= 10) return { priority: 'MEDIUM', color: 'text-yellow-600', message: 'Sell soon' };
    return { priority: 'LOW', color: 'text-green-600', message: 'Fresh stock' };
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
                <p className="text-sm text-muted-foreground">~{(totalQuantity / 0.91).toFixed(2)} L</p>
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
                    <th className="px-4 py-2 text-left">Original Qty</th>
                    <th className="px-4 py-2 text-left">Remaining</th>
                    <th className="px-4 py-2 text-left">Storage Date</th>
                    <th className="px-4 py-2 text-left">Expiry Date</th>
                    <th className="px-4 py-2 text-left">Days Left</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {storage.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-2 font-medium">{item.container_id}</td>
                      <td className="px-4 py-2">
                        <div>
                          <p className="text-sm">{item.quantity.toFixed(2)} kg</p>
                          <p className='text-xs text-muted-foreground'>
                            ~{item.quantity_liters.toFixed(2)} L
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div>
                          <p className="font-medium text-primary">{item.remaining_quantity.toFixed(2)} kg</p>
                          <p className='text-xs text-muted-foreground'>
                            ~{item.remaining_quantity_liters.toFixed(2)} L
                          </p>
                          {item.total_sold > 0 && (
                            <p className='text-xs text-amber-600 mt-1'>
                              ({item.total_sold.toFixed(2)} kg sold)
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">{format(new Date(item.storage_date), 'MMM dd, yyyy')}</td>
                      <td className="px-4 py-2">{format(new Date(item.expiry_date), 'MMM dd, yyyy')}</td>
                      <td className="px-4 py-2">{item.days_until_expiry}</td>
                      <td className="px-4 py-2">{getStatusBadge(item)}</td>
                      <td className="px-4 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(item)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Storage Container Details</DialogTitle>
            <DialogDescription>
              Complete traceability and cost information
            </DialogDescription>
          </DialogHeader>
          {selectedStorage && (
            <div className='space-y-6'>
              {/* Container Information */}
              <div>
                <h3 className='font-semibold mb-3 flex items-center gap-2'>
                  <Package className='h-5 w-5 text-primary' />
                  Container Information
                </h3>
                <div className='bg-muted/50 p-4 rounded-lg space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Container ID:</span>
                    <span className='font-bold text-lg text-primary'>
                      {selectedStorage.container_id}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Original Quantity:</span>
                    <div className='text-right'>
                      <p className='font-medium text-sm'>{selectedStorage.quantity.toFixed(2)} kg</p>
                      <p className='text-xs text-muted-foreground'>
                        ~{selectedStorage.quantity_liters.toFixed(2)} L
                      </p>
                    </div>
                  </div>
                  {selectedStorage.total_sold > 0 && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Total Sold:</span>
                      <div className='text-right'>
                        <p className='font-medium text-sm text-amber-600'>
                          {selectedStorage.total_sold.toFixed(2)} kg
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          ~{(selectedStorage.total_sold / 0.91).toFixed(2)} L
                        </p>
                      </div>
                    </div>
                  )}
                  <div className='flex justify-between bg-green-50 dark:bg-green-950 p-2 rounded'>
                    <span className='font-semibold text-green-900 dark:text-green-100'>Remaining:</span>
                    <div className='text-right'>
                      <p className='font-bold text-lg text-green-600'>
                        {selectedStorage.remaining_quantity.toFixed(2)} kg
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        ~{selectedStorage.remaining_quantity_liters.toFixed(2)} L
                      </p>
                    </div>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Storage Date:</span>
                    <span className='font-medium'>
                      {format(new Date(selectedStorage.storage_date), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Expiry Date:</span>
                    <span className='font-medium'>
                      {format(new Date(selectedStorage.expiry_date), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Days Until Expiry:</span>
                    <span className={`font-medium ${
                      selectedStorage.days_until_expiry <= 5 ? 'text-red-600' :
                      selectedStorage.days_until_expiry <= 10 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {selectedStorage.days_until_expiry} days
                    </span>
                  </div>
                  <div className='flex justify-between items-center pt-2 border-t'>
                    <span className='text-muted-foreground'>Status:</span>
                    {getStatusBadge(selectedStorage)}
                  </div>
                </div>
              </div>

              {/* Traceability Chain */}
              <div className='border-t pt-4'>
                <h3 className='font-semibold mb-3'>Traceability Chain</h3>
                {getMillingDetails(selectedStorage.milling_id) && (
                  <div className='space-y-4'>
                    {/* Milling Details */}
                    <div className='bg-blue-50 dark:bg-blue-950 p-4 rounded-lg'>
                      <h4 className='font-medium mb-2 text-sm text-blue-900 dark:text-blue-100'>
                        ↑ Step 2: Milling Operation
                      </h4>
                      <div className='space-y-1 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Milling ID:</span>
                          <span className='font-medium'>#{selectedStorage.milling_id}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Mill Location:</span>
                          <span className='font-medium'>
                            {getMillingDetails(selectedStorage.milling_id)?.mill_location}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Milling Date:</span>
                          <span className='font-medium'>
                            {getMillingDetails(selectedStorage.milling_id)?.milling_date &&
                              format(
                                new Date(getMillingDetails(selectedStorage.milling_id)!.milling_date),
                                'MMM dd, yyyy'
                              )}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Oil Produced:</span>
                          <span className='font-medium'>
                            {getMillingDetails(selectedStorage.milling_id)?.oil_yield.toFixed(2)} kg
                            (~{getMillingDetails(selectedStorage.milling_id)?.oil_yield_liters.toFixed(2)} L)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Harvest Details */}
                    {getMillingDetails(selectedStorage.milling_id)?.harvest_id &&
                      getHarvestDetails(getMillingDetails(selectedStorage.milling_id)!.harvest_id) && (
                      <div className='bg-green-50 dark:bg-green-950 p-4 rounded-lg'>
                        <h4 className='font-medium mb-2 text-sm text-green-900 dark:text-green-100'>
                          ↑ Step 1: Original Harvest
                        </h4>
                        <div className='space-y-1 text-sm'>
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Harvest ID:</span>
                            <span className='font-medium'>
                              #{getMillingDetails(selectedStorage.milling_id)?.harvest_id}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Source Type:</span>
                            <span className='font-medium'>
                              {getHarvestDetails(
                                getMillingDetails(selectedStorage.milling_id)!.harvest_id
                              )?.is_purchased ? (
                                <span className='px-2 py-1 text-xs rounded-full bg-primary/10 text-primary'>
                                  Purchased from {
                                    getHarvestDetails(
                                      getMillingDetails(selectedStorage.milling_id)!.harvest_id
                                    )?.supplier_name
                                  }
                                </span>
                              ) : (
                                <span className='px-2 py-1 text-xs rounded-full bg-green-100 text-green-800'>
                                  Own Harvest
                                </span>
                              )}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Plantation/Location:</span>
                            <span className='font-medium'>
                              {getHarvestDetails(
                                getMillingDetails(selectedStorage.milling_id)!.harvest_id
                              )?.plantation}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>Harvest Date:</span>
                            <span className='font-medium'>
                              {getHarvestDetails(
                                getMillingDetails(selectedStorage.milling_id)!.harvest_id
                              )?.harvest_date &&
                                format(
                                  new Date(
                                    getHarvestDetails(
                                      getMillingDetails(selectedStorage.milling_id)!.harvest_id
                                    )!.harvest_date
                                  ),
                                  'MMM dd, yyyy'
                                )}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground'>FFB Weight:</span>
                            <span className='font-medium'>
                              {getHarvestDetails(
                                getMillingDetails(selectedStorage.milling_id)!.harvest_id
                              )?.total_weight.toFixed(2)} kg
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Production Costs */}
              {getMillingDetails(selectedStorage.milling_id) && (
                <div className='border-t pt-4'>
                  <h3 className='font-semibold mb-3'>Production Cost Analysis</h3>
                  <div className='bg-amber-50 dark:bg-amber-950 p-4 rounded-lg space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>FFB Cost:</span>
                      <span className='font-medium'>
                        ₦{(
                          getMillingDetails(selectedStorage.milling_id)!.total_cost -
                          getMillingDetails(selectedStorage.milling_id)!.milling_cost -
                          getMillingDetails(selectedStorage.milling_id)!.transport_cost
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Milling Cost:</span>
                      <span className='font-medium'>
                        ₦{getMillingDetails(selectedStorage.milling_id)!.milling_cost.toLocaleString()}
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Transport Cost:</span>
                      <span className='font-medium'>
                        ₦{getMillingDetails(selectedStorage.milling_id)!.transport_cost.toLocaleString()}
                      </span>
                    </div>
                    <div className='flex justify-between pt-2 border-t font-semibold'>
                      <span>Total Production Cost:</span>
                      <span className='text-lg'>
                        ₦{getMillingDetails(selectedStorage.milling_id)!.total_cost.toLocaleString()}
                      </span>
                    </div>
                    <div className='flex justify-between bg-primary/10 p-2 rounded mt-2'>
                      <span className='font-semibold'>Cost per kg:</span>
                      <span className='font-bold text-primary'>
                        ₦{getMillingDetails(selectedStorage.milling_id)!.cost_per_kg.toFixed(2)}/kg
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Cost per liter:</span>
                      <span className='font-medium text-primary'>
                        ₦{getMillingDetails(selectedStorage.milling_id)!.cost_per_liter.toFixed(2)}/L
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Selling Recommendation */}
              <div className='border-t pt-4'>
                <h3 className='font-semibold mb-3 flex items-center gap-2'>
                  <TrendingUp className='h-5 w-5 text-green-600' />
                  Selling Recommendation
                </h3>
                {(() => {
                  const priority = getSellPriority(selectedStorage);
                  const millingData = getMillingDetails(selectedStorage.milling_id);
                  const minSellingPrice = millingData ? millingData.cost_per_kg * 1.15 : 0; // 15% markup minimum

                  return (
                    <div className='space-y-3'>
                      <div className={`p-4 rounded-lg border-2 ${
                        priority.priority === 'URGENT' ? 'bg-red-50 dark:bg-red-950 border-red-200' :
                        priority.priority === 'HIGH' ? 'bg-orange-50 dark:bg-orange-950 border-orange-200' :
                        priority.priority === 'MEDIUM' ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200' :
                        'bg-green-50 dark:bg-green-950 border-green-200'
                      }`}>
                        <div className='flex items-center gap-2 mb-2'>
                          <AlertCircle className={`h-5 w-5 ${priority.color}`} />
                          <span className={`font-semibold ${priority.color}`}>
                            {priority.priority} PRIORITY
                          </span>
                        </div>
                        <p className='text-sm'>{priority.message}</p>
                      </div>

                      {millingData && !selectedStorage.is_expired && (
                        <div className='bg-blue-50 dark:bg-blue-950 p-4 rounded-lg'>
                          <p className='text-sm mb-3'>
                            💡 <strong>Profitability Guide:</strong>
                          </p>
                          <div className='space-y-2 text-sm'>
                            <div className='flex justify-between'>
                              <span>Break-even price:</span>
                              <span className='font-medium'>
                                ₦{millingData.cost_per_kg.toFixed(2)}/kg
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span>Recommended minimum (15% profit):</span>
                              <span className='font-bold text-green-600'>
                                ₦{minSellingPrice.toFixed(2)}/kg
                              </span>
                            </div>
                            <div className='pt-2 border-t mt-2'>
                              <p className='text-xs text-muted-foreground'>
                                Potential revenue from remaining stock at ₦{minSellingPrice.toFixed(2)}/kg:{' '}
                                <strong className='text-green-600'>
                                  ₦{(selectedStorage.remaining_quantity * minSellingPrice).toLocaleString()}
                                </strong>
                              </p>
                              <p className='text-xs text-muted-foreground mt-1'>
                                Expected profit: ₦{(
                                  selectedStorage.remaining_quantity * minSellingPrice -
                                  (millingData.total_cost * (selectedStorage.remaining_quantity / selectedStorage.quantity))
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
