'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { TravelRequest, TravelStatus } from '@/types';
import { Card, CardHeader, Button, Badge, Spinner } from '@/components/ui';
import { ArrowLeft, Send, AlertTriangle, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts';

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

export default function TravelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = params.id as string;

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await apiClient.get(`/travel/${id}`);
        setRequest(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load travel request');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [id]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.post(`/travel/${id}/submit`);
      const response = await apiClient.get(`/travel/${id}`);
      setRequest(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-surface-400">Travel request not found.</p>
        <Link href="/dashboard/travel">
          <Button className="mt-4">Back to Travel Requests</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/travel">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-surface-100">{request.destination}</h1>
          <p className="text-surface-400 mt-1">Travel Request Details</p>
        </div>
        <Badge variant={statusVariant[request.status]}>{statusLabel[request.status]}</Badge>
      </div>

      {error && (
        <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      {/* Details Card */}
      <Card>
        <CardHeader title="Trip Details" />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-surface-500">Destination</p>
            <p className="text-surface-100 font-medium">{request.destination}</p>
          </div>
          <div>
            <p className="text-surface-500">Estimated Cost</p>
            <p className="text-surface-100 font-medium">{formatCurrency(request.estimatedCost)}</p>
          </div>
          <div>
            <p className="text-surface-500">Start Date</p>
            <p className="text-surface-100 font-medium">{formatDate(request.startDate)}</p>
          </div>
          <div>
            <p className="text-surface-500">End Date</p>
            <p className="text-surface-100 font-medium">{formatDate(request.endDate)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-surface-500">Purpose</p>
            <p className="text-surface-100">{request.purpose}</p>
          </div>
          {request.managerComment && (
            <div className="col-span-2">
              <p className="text-surface-500">Manager Comment</p>
              <p className="text-surface-100">{request.managerComment}</p>
            </div>
          )}
        </div>

        {/* Submit button for drafts */}
        {request.status === 'draft' && (
          <div className="mt-6 pt-4 border-t border-surface-700">
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              <Send className="h-4 w-4" />
              Submit for Approval
            </Button>
          </div>
        )}
      </Card>

      {/* Violations */}
      {request.violations.length > 0 && (
        <Card>
          <CardHeader title="Policy Violations" />
          <div className="space-y-3">
            {request.violations.map((v, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning-500 mt-0.5" />
                <div>
                  <p className="text-surface-100">{v.message}</p>
                  {v.amount !== undefined && v.limit !== undefined && (
                    <p className="text-surface-400 mt-1">
                      Amount: {formatCurrency(v.amount)} | Limit: {formatCurrency(v.limit)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Audit Timeline */}
      <Card>
        <CardHeader title="Timeline" />
        <div className="relative">
          {request.auditLogs.map((log, i) => (
            <div key={i} className="flex gap-4 pb-4 last:pb-0">
              <div className="relative flex flex-col items-center">
                <div className="p-2 bg-surface-700 rounded-lg">
                  {log.action === 'created' && <Clock className="h-4 w-4 text-surface-400" />}
                  {log.action === 'submitted' && <Send className="h-4 w-4 text-primary-400" />}
                  {log.action === 'approved' && <CheckCircle className="h-4 w-4 text-success-500" />}
                  {log.action === 'rejected' && <XCircle className="h-4 w-4 text-danger-500" />}
                  {!['created', 'submitted', 'approved', 'rejected'].includes(log.action) && (
                    <User className="h-4 w-4 text-surface-400" />
                  )}
                </div>
                {i < request.auditLogs.length - 1 && (
                  <div className="w-px flex-1 bg-surface-700 my-2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium text-surface-100 capitalize">{log.action}</p>
                {log.note && <p className="text-sm text-surface-400 mt-1">{log.note}</p>}
                <p className="text-xs text-surface-500 mt-1">
                  {formatDateTime(log.timestamp)} • {log.actorRole}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
