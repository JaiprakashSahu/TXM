'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TravelRequest, TravelStatus } from '@/types';
import { Card, CardHeader, Button, Badge, Spinner } from '@/components/ui';
import { Plus, Eye, AlertTriangle } from 'lucide-react';

const statusVariant: Record<TravelStatus, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  draft: 'neutral',
  submitted: 'primary',
  manager_approved: 'success',
  manager_rejected: 'danger',
  booked: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

const statusLabel: Record<TravelStatus, string> = {
  draft: 'Draft',
  submitted: 'Pending Approval',
  manager_approved: 'Approved',
  manager_rejected: 'Rejected',
  booked: 'Booked',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function TravelListPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await apiClient.get('/travel/my');
        setRequests(response.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load travel requests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Travel Requests</h1>
          <p className="text-surface-400 mt-1">Manage your travel requests</p>
        </div>
        <Link href="/dashboard/travel/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      {requests.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-surface-400">No travel requests yet.</p>
            <Link href="/dashboard/travel/new">
              <Button className="mt-4">Create your first request</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request._id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-surface-100">{request.destination}</h3>
                    <Badge variant={statusVariant[request.status]}>
                      {statusLabel[request.status]}
                    </Badge>
                    {request.violations.length > 0 && (
                      <Badge variant="warning">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {request.violations.length} violation(s)
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-surface-400 space-y-1">
                    <p>
                      {formatDate(request.startDate)} – {formatDate(request.endDate)}
                    </p>
                    <p>Estimated: {formatCurrency(request.estimatedCost)}</p>
                    <p className="line-clamp-1">{request.purpose}</p>
                  </div>
                </div>
                <Link href={`/dashboard/travel/${request._id}`}>
                  <Button variant="secondary" size="sm">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
