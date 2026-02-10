'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib';
import { formatCurrency } from '@/lib/utils';
import { RoleGuard } from '@/components/auth';
import { Card, CardHeader, Spinner } from '@/components/ui';
import { Plane, Receipt, CalendarCheck, DollarSign, Clock, Flag } from 'lucide-react';

interface AnalyticsData {
  totalTravelRequests: number;
  totalExpenses: number;
  totalBookings: number;
  totalSpend: number;
  pendingApprovals: number;
  flaggedExpenses: number;
}

export default function AnalyticsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AnalyticsContent />
    </RoleGuard>
  );
}

function AnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiClient.get('/analytics/summary');
        setData(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
        <p className="text-sm text-danger-500">{error}</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Travel Requests',
      value: data?.totalTravelRequests || 0,
      icon: Plane,
      color: 'text-primary-400',
    },
    {
      label: 'Total Expenses',
      value: data?.totalExpenses || 0,
      icon: Receipt,
      color: 'text-success-500',
    },
    {
      label: 'Total Bookings',
      value: data?.totalBookings || 0,
      icon: CalendarCheck,
      color: 'text-warning-500',
    },
    {
      label: 'Total Spend',
      value: formatCurrency(data?.totalSpend || 0),
      icon: DollarSign,
      color: 'text-primary-400',
      isAmount: true,
    },
    {
      label: 'Pending Approvals',
      value: data?.pendingApprovals || 0,
      icon: Clock,
      color: 'text-warning-500',
    },
    {
      label: 'Flagged Expenses',
      value: data?.flaggedExpenses || 0,
      icon: Flag,
      color: 'text-danger-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Analytics</h1>
        <p className="text-surface-400 mt-1">Overview of travel and expense metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-surface-700 rounded-xl">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-surface-400">{stat.label}</p>
                <p className="text-2xl font-bold text-surface-100 mt-1">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Summary" description="Key performance indicators at a glance" />
        <div className="text-sm text-surface-400">
          <p>
            Your organization has processed {data?.totalTravelRequests || 0} travel requests with a
            total spend of {formatCurrency(data?.totalSpend || 0)}.
          </p>
          <p className="mt-2">
            Currently, there are {data?.pendingApprovals || 0} requests awaiting approval and{' '}
            {data?.flaggedExpenses || 0} expenses flagged for review.
          </p>
        </div>
      </Card>
    </div>
  );
}
