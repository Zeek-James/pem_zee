'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardSummary, getProfitTrends, downloadExcelReport, downloadPdfReport, type DashboardSummary, type ProfitTrend } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Package, DollarSign, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [profitTrends, setProfitTrends] = useState<ProfitTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, trendsRes] = await Promise.all([
        getDashboardSummary(),
        getProfitTrends()
      ]);

      setSummary(summaryRes.data);
      setProfitTrends(trendsRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    return `₦${amount?.toLocaleString() || 0}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Overview of your palm oil business performance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => window.open(downloadExcelReport('summary'), '_blank')} className="w-full sm:w-auto">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Excel Report</span>
            <span className="sm:hidden">Excel</span>
          </Button>
          <Button variant="outline" onClick={() => window.open(downloadPdfReport('summary'), '_blank')} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">PDF Report</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Oil Produced</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_oil_produced?.toFixed(2) || 0} kg</div>
            <p className="text-xs text-muted-foreground">Crude Palm Oil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">From all sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Cost</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.total_milling_cost)}</div>
            <p className="text-xs text-muted-foreground">Total expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.total_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary?.total_profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(summary?.total_profit || 0) >= 0 ? 'Profit' : 'Loss'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FFB Harvested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_ffb_harvested?.toFixed(2) || 0} kg</div>
            <p className="text-xs text-muted-foreground">Fresh Fruit Bunches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_storage?.toFixed(2) || 0} kg</div>
            <p className="text-xs text-muted-foreground">Available CPO</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pending_payments_count || 0}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(summary?.total_pending_amount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Oil Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.average_oil_yield?.toFixed(2) || 0} kg</div>
            <p className="text-xs text-muted-foreground">Per batch</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {profitTrends.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Profit Trends</CardTitle>
              <CardDescription>Revenue, costs, and profit over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={profitTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} name="Cost" />
                  <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost vs Revenue Comparison</CardTitle>
              <CardDescription>Side-by-side comparison of costs and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={profitTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="cost" fill="#ef4444" name="Cost" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
