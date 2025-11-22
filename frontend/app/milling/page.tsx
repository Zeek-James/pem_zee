"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMilling,
  createMilling,
  getHarvests,
  type Milling,
  type Harvest,
} from "@/lib/api";
import { format } from "date-fns";
import { Plus, Factory } from "lucide-react";

export default function MillingPage() {
  const [milling, setMilling] = useState<Milling[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMilling, setSelectedMilling] = useState<Milling | null>(null);
  const [formData, setFormData] = useState({
    milling_date: format(new Date(), "yyyy-MM-dd"),
    mill_location: "Owerri Mill",
    harvest_id: "",
    milling_cost: "",
    oil_yield: "",
    transport_cost: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [millingRes, harvestsRes] = await Promise.all([
        getMilling(),
        getHarvests(),
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
        transport_cost: parseFloat(formData.transport_cost),
      });
      setOpen(false);
      fetchData();
      setFormData({
        milling_date: format(new Date(), "yyyy-MM-dd"),
        mill_location: "Owerri Mill",
        harvest_id: "",
        milling_cost: "",
        oil_yield: "",
        transport_cost: "",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create milling record. Please try again.");
    }
  };

  // Get available (unmilled) harvests
  const getAvailableHarvests = () => {
    const milledHarvestIds = milling.map((m) => m.harvest_id);
    return harvests.filter((h) => !milledHarvestIds.includes(h.id));
  };

  const availableHarvests = getAvailableHarvests();

  const handleViewDetails = (record: Milling) => {
    setSelectedMilling(record);
    setDetailsOpen(true);
  };

  const getHarvestDetails = (harvestId: number) => {
    return harvests.find((h) => h.id === harvestId);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Milling Operations
          </h1>
          <p className='text-muted-foreground'>
            Track milling and oil production
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              New Milling
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-2xl'>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Record New Milling Operation</DialogTitle>
                <DialogDescription>
                  Add a new milling record to convert FFB to CPO
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='milling_date'>Milling Date</Label>
                  <Input
                    id='milling_date'
                    type='date'
                    value={formData.milling_date}
                    onChange={(e) =>
                      setFormData({ ...formData, milling_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='harvest_id'>Select Harvest to Mill</Label>
                  <Select
                    value={formData.harvest_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, harvest_id: value });
                      // Auto-fill expected yield
                      const selectedHarvest = harvests.find(
                        (h) => h.id === parseInt(value)
                      );
                      if (selectedHarvest) {
                        setFormData((prev) => ({
                          ...prev,
                          harvest_id: value,
                          oil_yield:
                            selectedHarvest.expected_oil_yield.toFixed(2),
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select a harvest' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableHarvests.length === 0 ? (
                        <div className='p-2 text-sm text-muted-foreground'>
                          No available harvests
                        </div>
                      ) : (
                        availableHarvests.map((harvest) => (
                          <SelectItem
                            key={harvest.id}
                            value={harvest.id.toString()}
                          >
                            {format(
                              new Date(harvest.harvest_date),
                              "MMM dd, yyyy"
                            )}{" "}
                            - {harvest.plantation}(
                            {harvest.total_weight.toFixed(0)} kg FFB, Expected:{" "}
                            {harvest.expected_oil_yield.toFixed(0)} kg oil)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.harvest_id && (
                    <p className='text-sm text-muted-foreground'>
                      Expected oil yield:{" "}
                      {harvests
                        .find((h) => h.id === parseInt(formData.harvest_id))
                        ?.expected_oil_yield.toFixed(2)}{" "}
                      kg
                    </p>
                  )}
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='mill_location'>Mill Location</Label>
                  <Select
                    value={formData.mill_location}
                    onValueChange={(value) =>
                      setFormData({ ...formData, mill_location: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Owerri Mill'>Owerri Mill</SelectItem>
                      <SelectItem value='Aba Mill'>Aba Mill</SelectItem>
                      <SelectItem value='Other'>Other Mill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='milling_cost'>Milling Cost (₦)</Label>
                    <Input
                      id='milling_cost'
                      type='number'
                      step='0.01'
                      placeholder='15000'
                      value={formData.milling_cost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          milling_cost: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='transport_cost'>Transport Cost (₦)</Label>
                    <Input
                      id='transport_cost'
                      type='number'
                      step='0.01'
                      placeholder='2000'
                      value={formData.transport_cost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transport_cost: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='oil_yield'>Actual Oil Produced (kg)</Label>
                  <Input
                    id='oil_yield'
                    type='number'
                    step='0.01'
                    placeholder='32'
                    value={formData.oil_yield}
                    onChange={(e) =>
                      setFormData({ ...formData, oil_yield: e.target.value })
                    }
                    required
                  />
                  <p className='text-sm text-muted-foreground'>
                    Enter the actual amount of oil produced from milling
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={!formData.harvest_id}>
                  <Factory className='mr-2 h-4 w-4' />
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
          <CardDescription>
            All milling operations and oil yield data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='text-center py-8 text-muted-foreground'>
              Loading...
            </div>
          ) : milling.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <Factory className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p>No milling records yet</p>
              <p className='text-sm'>
                Click &quot;New Milling&quot; to record your first milling
                operation
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='px-4 py-2 text-left'>Date</th>
                    <th className='px-4 py-2 text-left'>Mill</th>
                    <th className='px-4 py-2 text-left'>Harvest ID</th>
                    <th className='px-4 py-2 text-left'>Oil Yield (kg)</th>
                    <th className='px-4 py-2 text-left'>Total Cost (₦)</th>
                    <th className='px-4 py-2 text-left'>Cost/kg (₦)</th>
                    <th className='px-4 py-2 text-left'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {milling.map((record) => (
                    <tr key={record.id} className='border-b hover:bg-muted/50'>
                      <td className='px-4 py-2'>
                        {format(new Date(record.milling_date), "MMM dd, yyyy")}
                      </td>
                      <td className='px-4 py-2'>{record.mill_location}</td>
                      <td className='px-4 py-2'>#{record.harvest_id}</td>
                      <td className='px-4 py-2 font-medium'>
                        {record.oil_yield.toFixed(2)}
                      </td>
                      <td className='px-4 py-2'>
                        ₦{record.total_cost.toLocaleString()}
                      </td>
                      <td className='px-4 py-2 font-medium text-primary'>
                        ₦{record.cost_per_kg.toFixed(2)}
                      </td>
                      <td className='px-4 py-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleViewDetails(record)}
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
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Milling Operation Details</DialogTitle>
            <DialogDescription>
              Complete information about this milling operation
            </DialogDescription>
          </DialogHeader>
          {selectedMilling && (
            <div className='space-y-6'>
              {/* Basic Info */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-muted-foreground'>Milling Date</Label>
                  <p className='text-lg font-medium'>
                    {format(
                      new Date(selectedMilling.milling_date),
                      "MMMM dd, yyyy"
                    )}
                  </p>
                </div>
                <div>
                  <Label className='text-muted-foreground'>Mill Location</Label>
                  <p className='text-lg font-medium'>
                    {selectedMilling.mill_location}
                  </p>
                </div>
              </div>

              {/* Harvest Details */}
              <div className='border-t pt-4'>
                <h3 className='font-semibold mb-3'>
                  Source Harvest Information
                </h3>
                {getHarvestDetails(selectedMilling.harvest_id) ? (
                  <div className='bg-muted/50 p-4 rounded-lg space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Harvest ID:</span>
                      <span className='font-medium'>
                        #{selectedMilling.harvest_id}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Plantation:</span>
                      <span className='font-medium'>
                        {
                          getHarvestDetails(selectedMilling.harvest_id)
                            ?.plantation
                        }
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Harvest Date:
                      </span>
                      <span className='font-medium'>
                        {getHarvestDetails(selectedMilling.harvest_id)
                          ?.harvest_date &&
                          format(
                            new Date(
                              getHarvestDetails(
                                selectedMilling.harvest_id
                              )!.harvest_date
                            ),
                            "MMM dd, yyyy"
                          )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Total FFB Weight:
                      </span>
                      <span className='font-medium'>
                        {getHarvestDetails(
                          selectedMilling.harvest_id
                        )?.total_weight.toFixed(2)}{" "}
                        kg
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Expected Oil Yield:
                      </span>
                      <span className='font-medium'>
                        {getHarvestDetails(
                          selectedMilling.harvest_id
                        )?.expected_oil_yield.toFixed(2)}{" "}
                        kg
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className='text-muted-foreground'>
                    Harvest details not available
                  </p>
                )}
              </div>

              {/* Production Results */}
              <div className='border-t pt-4'>
                <h3 className='font-semibold mb-3'>Production Results</h3>
                <div className='bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Actual Oil Produced:
                    </span>
                    <span className='text-xl font-bold text-primary'>
                      {selectedMilling.oil_yield.toFixed(2)} kg
                    </span>
                  </div>
                  {getHarvestDetails(selectedMilling.harvest_id) && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        Extraction Efficiency:
                      </span>
                      <span className='font-medium'>
                        {(
                          (selectedMilling.oil_yield /
                            getHarvestDetails(selectedMilling.harvest_id)!
                              .expected_oil_yield) *
                          100
                        ).toFixed(1)}
                        %
                        {selectedMilling.oil_yield >=
                        getHarvestDetails(selectedMilling.harvest_id)!
                          .expected_oil_yield
                          ? " ✅"
                          : " ⚠️"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className='border-t pt-4'>
                <h3 className='font-semibold mb-3'>Cost Breakdown</h3>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>FFB Cost:</span>
                    <span className='font-medium'>
                      ₦
                      {(
                        selectedMilling.total_cost -
                        selectedMilling.milling_cost -
                        selectedMilling.transport_cost
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Milling Cost:</span>
                    <span className='font-medium'>
                      ₦{selectedMilling.milling_cost.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Transport Cost:
                    </span>
                    <span className='font-medium'>
                      ₦{selectedMilling.transport_cost.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between pt-2 border-t'>
                    <span className='font-semibold'>Total Cost:</span>
                    <span className='font-bold text-lg'>
                      ₦{selectedMilling.total_cost.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between bg-primary/10 p-3 rounded-lg mt-3'>
                    <span className='font-semibold'>Cost per kg:</span>
                    <span className='font-bold text-lg text-primary'>
                      ₦{selectedMilling.cost_per_kg.toFixed(2)}/kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Profitability Indicator */}
              <div className='border-t pt-4'>
                <div className='bg-blue-50 dark:bg-blue-950 p-4 rounded-lg'>
                  <p className='text-sm text-muted-foreground mb-2'>
                    💡 Profitability Guide
                  </p>
                  <p className='text-sm'>
                    To profit from this batch, you need to sell at{" "}
                    <strong className='text-primary'>
                      more than ₦{selectedMilling.cost_per_kg.toFixed(2)}/kg
                    </strong>
                  </p>
                  <p className='text-sm mt-2'>
                    Example: Selling at ₦1,000/kg would give you{" "}
                    <strong className='text-green-600'>
                      ₦
                      {(
                        (1000 - selectedMilling.cost_per_kg) *
                        selectedMilling.oil_yield
                      ).toLocaleString()}
                    </strong>{" "}
                    profit
                  </p>
                </div>
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
