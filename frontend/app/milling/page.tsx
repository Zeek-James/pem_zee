'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMilling, createMilling, getHarvests, type Milling, type Harvest } from '@/lib/api';
import { format } from 'date-fns';
import { Plus, Factory } from 'lucide-react';

export default function MillingPage() {
  const [milling, setMilling] = useState<Milling[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    milling_date: format(new Date(), 'yyyy-MM-dd'),
    mill_location: 'Owerri Mill',
    harvest_id: '',
    milling_cost: '',
    oil_yield: '',
    transport_cost: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [millingRes, harvestsRes] = await Promise.all([
        getMilling(),
        getHarvests()
      ]);
      setMilling(millingRes.data);
      setHarvests(harvestsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMilling({
        ...formData,
        harvest_id: parseInt(formData.harvest_id),
        milling_cost: parseFloat(formData.milling_cost),
        oil_yield: parseFloat(formData.oil_yield),
        transport_cost: parseFloat(formData.transport_cost)
      });
      setOpen(false);
      fetchData();
      setFormData({
        milling_date: format(new Date(), 'yyyy-MM-dd'),
        mill_location: 'Owerri Mill',
        harvest_id: '',
        milling_cost: '',
        oil_yield: '',
        transport_cost: ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to create milling record. Please try again.');
    }
  };

  // Get available (unmilled) harvests
  const getAvailableHarvests = () => {
    const milledHarvestIds = milling.map(m => m.harvest_id);
    return harvests.filter(h => !milledHarvestIds.includes(h.id));
  };

  const availableHarvests = getAvailableHarvests();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Milling Operations</h1>
          <p className="text-muted-foreground">Track milling and oil production</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Milling
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Record New Milling Operation</DialogTitle>
                <DialogDescription>Add a new milling record to convert FFB to CPO</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="milling_date">Milling Date</Label>
                  <Input
                    id="milling_date"
                    type="date"
                    value={formData.milling_date}
                    onChange={(e) => setFormData({ ...formData, milling_date: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="harvest_id">Select Harvest to Mill</Label>
                  <Select
                    value={formData.harvest_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, harvest_id: value });
                      // Auto-fill expected yield
                      const selectedHarvest = harvests.find(h => h.id === parseInt(value));
                      if (selectedHarvest) {
                        setFormData(prev => ({
                          ...prev,
                          harvest_id: value,
                          oil_yield: selectedHarvest.expected_oil_yield.toFixed(2)
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a harvest" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableHarvests.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No available harvests</div>
                      ) : (
                        availableHarvests.map((harvest) => (
                          <SelectItem key={harvest.id} value={harvest.id.toString()}>
                            {format(new Date(harvest.harvest_date), 'MMM dd, yyyy')} - {harvest.plantation}
                            ({harvest.total_weight.toFixed(0)} kg FFB, Expected: {harvest.expected_oil_yield.toFixed(0)} kg oil)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.harvest_id && (
                    <p className="text-sm text-muted-foreground">
                      Expected oil yield: {harvests.find(h => h.id === parseInt(formData.harvest_id))?.expected_oil_yield.toFixed(2)} kg
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="mill_location">Mill Location</Label>
                  <Select value={formData.mill_location} onValueChange={(value) => setFormData({ ...formData, mill_location: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Owerri Mill">Owerri Mill</SelectItem>
                      <SelectItem value="Aba Mill">Aba Mill</SelectItem>
                      <SelectItem value="Other">Other Mill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="milling_cost">Milling Cost (₦)</Label>
                    <Input
                      id="milling_cost"
                      type="number"
                      step="0.01"
                      placeholder="15000"
                      value={formData.milling_cost}
                      onChange={(e) => setFormData({ ...formData, milling_cost: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="transport_cost">Transport Cost (₦)</Label>
                    <Input
                      id="transport_cost"
                      type="number"
                      step="0.01"
                      placeholder="2000"
                      value={formData.transport_cost}
                      onChange={(e) => setFormData({ ...formData, transport_cost: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="oil_yield">Actual Oil Produced (kg)</Label>
                  <Input
                    id="oil_yield"
                    type="number"
                    step="0.01"
                    placeholder="32"
                    value={formData.oil_yield}
                    onChange={(e) => setFormData({ ...formData, oil_yield: e.target.value })}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the actual amount of oil produced from milling
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!formData.harvest_id}>
                  <Factory className="mr-2 h-4 w-4" />
                  Save Milling Record
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Milling Records</CardTitle>
          <CardDescription>All milling operations and oil yield data</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : milling.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No milling records yet</p>
              <p className="text-sm">Click "New Milling" to record your first milling operation</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Mill</th>
                    <th className="px-4 py-2 text-left">Harvest ID</th>
                    <th className="px-4 py-2 text-left">Oil Yield (kg)</th>
                    <th className="px-4 py-2 text-left">Total Cost (₦)</th>
                    <th className="px-4 py-2 text-left">Cost/kg (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {milling.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-2">{format(new Date(record.milling_date), 'MMM dd, yyyy')}</td>
                      <td className="px-4 py-2">{record.mill_location}</td>
                      <td className="px-4 py-2">#{record.harvest_id}</td>
                      <td className="px-4 py-2 font-medium">{record.oil_yield.toFixed(2)}</td>
                      <td className="px-4 py-2">₦{record.total_cost.toLocaleString()}</td>
                      <td className="px-4 py-2 font-medium text-primary">₦{record.cost_per_kg.toFixed(2)}</td>
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
