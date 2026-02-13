'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Policy } from '@/types';
import { RoleGuard } from '@/components/auth';
import { Card, Spinner, Button, Badge, ConfirmModal } from '@/components/ui';
import { useToast } from '@/contexts';
import { Plus, Eye, Power, CheckCircle, FileText } from 'lucide-react';

export default function PoliciesPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <PoliciesContent />
    </RoleGuard>
  );
}

function PoliciesContent() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activateTarget, setActivateTarget] = useState<Policy | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await apiClient.get('/policy/all');
      setPolicies(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!activateTarget) return;
    setIsActivating(true);
    try {
      await apiClient.post(`/policy/${activateTarget._id}/activate`);
      toast.success(`Policy "${activateTarget.name}" activated`);
      setActivateTarget(null);
      fetchPolicies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to activate policy');
    } finally {
      setIsActivating(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Policies</h1>
          <p className="text-surface-400 mt-1">Manage travel and expense policies</p>
        </div>
        <Link href="/dashboard/policies/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Policy
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      {policies.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-surface-500 mx-auto mb-3" />
            <p className="text-surface-400">No policies created yet.</p>
            <Link href="/dashboard/policies/new" className="text-primary-400 text-sm hover:underline mt-1 inline-block">
              Create your first policy →
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-700/50 border-b border-surface-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-surface-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700">
                {policies.map((policy) => (
                  <tr key={policy._id} className="hover:bg-surface-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-surface-100">{policy.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral">v{policy.version}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-surface-400">{formatDate(policy.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {policy.isActive ? (
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Draft</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/policies/${policy._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </Link>
                        {!policy.isActive && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActivateTarget(policy)}
                          >
                            <Power className="h-4 w-4" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirm Activate Modal */}
      <ConfirmModal
        isOpen={!!activateTarget}
        title="Activate Policy"
        message={`Are you sure you want to activate "${activateTarget?.name}"? This will deactivate the current active policy.`}
        confirmLabel="Activate"
        variant="primary"
        isLoading={isActivating}
        onConfirm={handleActivate}
        onCancel={() => setActivateTarget(null)}
      />
    </div>
  );
}
