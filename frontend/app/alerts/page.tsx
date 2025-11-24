'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllAlerts, type Alert } from '@/lib/api';
import { AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AlertsPage() {
  return (
    <ProtectedRoute>
      <AlertsContent />
    </ProtectedRoute>
  );
}

function AlertsContent() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await getAllAlerts();
      setAlerts(res.data.alerts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-4 border-red-600 bg-red-50';
      case 'high':
        return 'border-l-4 border-orange-600 bg-orange-50';
      case 'medium':
        return 'border-l-4 border-yellow-600 bg-yellow-50';
      default:
        return 'border-l-4 border-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h1>
          <p className="text-muted-foreground">Monitor important business events</p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <span className="text-2xl font-bold">{alerts.length}</span>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">Loading alerts...</p>
          </CardContent>
        </Card>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">No alerts at this time</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <Card key={index} className={getSeverityColor(alert.severity)}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <CardTitle className="text-base capitalize">{alert.type} Alert</CardTitle>
                    <CardDescription className="mt-1">{alert.message}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
