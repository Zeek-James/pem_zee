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
import { getHarvests, createHarvest, type Harvest } from "@/lib/api";
import { Plus, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function HarvestPage() {
  return (
    <ProtectedRoute>
      <HarvestContent />
    </ProtectedRoute>
  );
}

function HarvestContent() {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    harvest_date: format(new Date(), "yyyy-MM-dd"),
    plantation: "Owerri",
    num_bunches: "",
    weight_per_bunch: "",
    ripeness: "Ripe",
    is_purchased: false,
    supplier_name: "",
    purchase_price: "",
  });

  useEffect(() => {
    fetchHarvests();
  }, []);

  const fetchHarvests = async () => {
    try {
      const res = await getHarvests();
      setHarvests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        harvest_date: formData.harvest_date,
        plantation: formData.plantation,
        num_bunches: parseInt(formData.num_bunches),
        weight_per_bunch: parseFloat(formData.weight_per_bunch),
        ripeness: formData.ripeness,
        is_purchased: formData.is_purchased,
      };

      if (formData.is_purchased) {
        payload.supplier_name = formData.supplier_name;
        payload.purchase_price = parseFloat(formData.purchase_price);
      }

      await createHarvest(payload);
      setOpen(false);
      fetchHarvests();
      setFormData({
        harvest_date: format(new Date(), "yyyy-MM-dd"),
        plantation: "Owerri",
        num_bunches: "",
        weight_per_bunch: "",
        ripeness: "Ripe",
        is_purchased: false,
        supplier_name: "",
        purchase_price: "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Harvest Tracker</h1>
          <p className='text-muted-foreground'>
            Record and manage FFB(s) harvests
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              New Harvest
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Record New FFB</DialogTitle>
                <DialogDescription>
                  Add purchased or harvested FFB
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                {/* FFB Type Selection */}
                <div className='grid gap-2'>
                  <Label>FFB Source</Label>
                  <div className='flex gap-4'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='radio'
                        checked={!formData.is_purchased}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            is_purchased: false,
                            supplier_name: "",
                            purchase_price: "",
                          })
                        }
                        className='w-4 h-4'
                      />
                      <span>Own Harvest</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='radio'
                        checked={formData.is_purchased}
                        onChange={() =>
                          setFormData({ ...formData, is_purchased: true })
                        }
                        className='w-4 h-4'
                      />
                      <span className='font-medium text-primary'>
                        Purchase from Supplier
                      </span>
                    </label>
                  </div>
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='harvest_date'>
                    {formData.is_purchased ? "Purchase Date" : "Harvest Date"}
                  </Label>
                  <Input
                    id='harvest_date'
                    type='date'
                    value={formData.harvest_date}
                    onChange={(e) =>
                      setFormData({ ...formData, harvest_date: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Purchase-specific fields */}
                {formData.is_purchased && (
                  <>
                    <div className='grid gap-2 bg-primary/5 p-4 rounded-lg border-2 border-primary/20'>
                      <div className='grid gap-2'>
                        <Label htmlFor='supplier_name'>Supplier Name</Label>
                        <Input
                          id='supplier_name'
                          type='text'
                          placeholder='Enter supplier name'
                          value={formData.supplier_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              supplier_name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className='grid gap-2'>
                  <Label htmlFor='plantation'>
                    {formData.is_purchased ? "Supplier Location" : "Plantation"}
                  </Label>
                  <Select
                    value={formData.plantation}
                    onValueChange={(value) =>
                      setFormData({ ...formData, plantation: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Owerri'>Owerri</SelectItem>
                      <SelectItem value='Aba'>Aba</SelectItem>
                      <SelectItem value='Other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='num_bunches'>Number of Bunches</Label>
                  <Input
                    id='num_bunches'
                    type='number'
                    value={formData.num_bunches}
                    onChange={(e) =>
                      setFormData({ ...formData, num_bunches: e.target.value })
                    }
                    required
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='weight_per_bunch'>
                    Weight per Bunch (kg)
                  </Label>
                  <Input
                    id='weight_per_bunch'
                    type='number'
                    step='0.01'
                    value={formData.weight_per_bunch}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight_per_bunch: e.target.value,
                      })
                    }
                    required
                  />
                  {formData.num_bunches && formData.weight_per_bunch && (
                    <p className='text-sm text-muted-foreground'>
                      Total weight:{" "}
                      {(
                        parseFloat(formData.num_bunches) *
                        parseFloat(formData.weight_per_bunch)
                      ).toFixed(2)}{" "}
                      kg
                    </p>
                  )}
                </div>

                {/* Purchase Price - only show for purchases */}
                {formData.is_purchased && (
                  <div className='grid gap-2 bg-primary/5 p-4 rounded-lg border-2 border-primary/20'>
                    <Label htmlFor='purchase_price'>
                      Total Purchase Price (₦)
                    </Label>
                    <Input
                      id='purchase_price'
                      type='number'
                      step='0.01'
                      placeholder='Enter total amount paid'
                      value={formData.purchase_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchase_price: e.target.value,
                        })
                      }
                      required
                    />
                    {formData.purchase_price &&
                      formData.num_bunches &&
                      formData.weight_per_bunch && (
                        <p className='text-sm text-primary font-medium'>
                          Price per kg: ₦
                          {(
                            parseFloat(formData.purchase_price) /
                            (parseFloat(formData.num_bunches) *
                              parseFloat(formData.weight_per_bunch))
                          ).toFixed(2)}
                          /kg
                        </p>
                      )}
                  </div>
                )}

                <div className='grid gap-2'>
                  <Label htmlFor='ripeness'>Ripeness</Label>
                  <Select
                    value={formData.ripeness}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ripeness: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Ripe'>Ripe</SelectItem>
                      <SelectItem value='Unripe'>Unripe</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Button type='submit'>
                  {formData.is_purchased ? "Record Purchase" : "Save Harvest"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Harvest Records</CardTitle>
          <CardDescription>All FFB harvest data</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='px-4 py-2 text-left'>Date</th>
                    <th className='px-4 py-2 text-left'>Source</th>
                    <th className='px-4 py-2 text-left'>Location</th>
                    <th className='px-4 py-2 text-left'>Bunches</th>
                    <th className='px-4 py-2 text-left'>Weight (kg)</th>
                    <th className='px-4 py-2 text-left'>FFB Cost</th>
                    <th className='px-4 py-2 text-left'>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {harvests.map((harvest) => (
                    <tr key={harvest.id} className='border-b hover:bg-muted/50'>
                      <td className='px-4 py-2'>
                        {format(new Date(harvest.harvest_date), "MMM dd, yyyy")}
                      </td>
                      <td className='px-4 py-2'>
                        {harvest.is_purchased ? (
                          <div>
                            <span className='px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium'>
                              Purchased
                            </span>
                            {harvest.supplier_name && (
                              <p className='text-xs text-muted-foreground mt-1'>
                                {harvest.supplier_name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className='px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'>
                            Own Harvest
                          </span>
                        )}
                      </td>
                      <td className='px-4 py-2'>{harvest.plantation}</td>
                      <td className='px-4 py-2'>{harvest.num_bunches}</td>
                      <td className='px-4 py-2 font-medium'>
                        {harvest.total_weight.toFixed(2)}
                      </td>
                      <td className='px-4 py-2'>
                        <div>
                          <p className='font-medium'>
                            ₦{harvest.ffb_cost.toLocaleString()}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            ₦{harvest.cost_per_kg.toFixed(2)}/kg
                          </p>
                        </div>
                      </td>
                      <td className='px-4 py-2'>
                        {harvest.needs_milling_alert && (
                          <span className='flex items-center text-amber-600'>
                            <AlertTriangle className='h-4 w-4 mr-1' />
                            Needs Milling
                          </span>
                        )}
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
