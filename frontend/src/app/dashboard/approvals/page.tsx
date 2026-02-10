'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TravelRequest } from '@/types';
import { RoleGuard } from '@/components/auth';
import { Card, CardHeader, Button, Badge, Spinner, Textarea } from '@/components/ui';
import { CheckCircle, XCircle, Eye, AlertTriangle, User } from 'lucide-react';

export default function ApprovalsPage() {
  return (
    <RoleGuard allowedRoles={['manager', 'admin']}>
      <ApprovalsContent />
    </RoleGuard>
  );
}

function ApprovalsContent() {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const response = await apiClient.get('/travel/manager/pending');
      setRequests(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setIsProcessing(true);
    try {
      await apiClient.post(`/travel/${id}/${action}`, { comment });
      setComment('');
      setSelectedId(null);
      fetchPending();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Pending Approvals</h1>
        <p className="text-surface-400 mt-1">Review and approve travel requests from your team</p>
      </div>

      {error && (
        <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      {requests.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-surface-500 mx-auto mb-3" />
            <p className="text-surface-400">No pending approvals.</p>
            <p className="text-sm text-surface-500 mt-1">All travel requests have been reviewed.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const employee =
              typeof request.userId === 'object' ? request.userId : { name: 'Unknown', email: '' };
            const isSelected = selectedId === request._id;

            return (
              <Card key={request._id}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-surface-700 rounded-xl">
                    <User className="h-5 w-5 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-surface-100">{request.destination}</h3>
                      <Badge variant="primary">Pending</Badge>
                      {request.violations.length > 0 && (
                        <Badge variant="warning">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {request.violations.length} violation(s)
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-surface-300">
                      From: {employee.name} ({employee.email})
                    </p>
                    <div className="text-sm text-surface-400 mt-2 space-y-1">
                      <p>
                        {formatDate(request.startDate)} – {formatDate(request.endDate)}
                      </p>
                      <p>Estimated: {formatCurrency(request.estimatedCost)}</p>
                      <p className="line-clamp-2">{request.purpose}</p>
                    </div>

                    {/* Violations detail */}
                    {request.violations.length > 0 && (
                      <div className="mt-3 p-3 bg-warning-600/10 border border-warning-600/30 rounded-lg">
                        <p className="text-sm font-medium text-warning-500 mb-2">Policy Violations:</p>
                        <ul className="text-sm text-surface-300 space-y-1">
                          {request.violations.map((v, i) => (
                            <li key={i}>• {v.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-4">
                      {isSelected ? (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Add a comment (optional)..."
                            rows={2}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              isLoading={isProcessing}
                              onClick={() => handleAction(request._id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              isLoading={isProcessing}
                              onClick={() => handleAction(request._id, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedId(null);
                                setComment('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => setSelectedId(request._id)}>
                          <Eye className="h-4 w-4" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
