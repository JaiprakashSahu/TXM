'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Policy } from '@/types';
import { RoleGuard } from '@/components/auth';
import { Card, CardHeader, Spinner, Badge, Button, ConfirmModal } from '@/components/ui';
import { useToast } from '@/contexts';
import { ArrowLeft, CheckCircle, Power } from 'lucide-react';
import Link from 'next/link';

export default function PolicyDetailPage() {
    return (
        <RoleGuard allowedRoles={['admin']}>
            <DetailContent />
        </RoleGuard>
    );
}

function DetailContent() {
    const params = useParams();
    const id = params?.id as string;
    const { toast } = useToast();

    const [policy, setPolicy] = useState<Policy | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showActivate, setShowActivate] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    useEffect(() => {
        if (id) fetchPolicy();
    }, [id]);

    const fetchPolicy = async () => {
        try {
            const response = await apiClient.get(`/policy/${id}`);
            setPolicy(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load policy');
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivate = async () => {
        setIsActivating(true);
        try {
            await apiClient.post(`/policy/${id}/activate`);
            toast.success('Policy activated successfully');
            setShowActivate(false);
            fetchPolicy();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to activate');
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

    if (!policy) {
        return (
            <div className="text-center py-12">
                <p className="text-surface-400">{error || 'Policy not found.'}</p>
            </div>
        );
    }

    const rules = [
        { label: 'Max Flight Cost', value: formatCurrency(policy.rules.maxFlightCost) },
        { label: 'Max Hotel Per Day', value: formatCurrency(policy.rules.maxHotelPerDay) },
        { label: 'Max Daily Food', value: formatCurrency(policy.rules.maxDailyFood) },
        { label: 'Max Trip Total', value: formatCurrency(policy.rules.maxTripTotal) },
    ];

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/policies">
                    <button className="p-2 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-surface-100">{policy.name}</h1>
                        <Badge variant="neutral">v{policy.version}</Badge>
                        {policy.isActive && (
                            <Badge variant="success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                            </Badge>
                        )}
                    </div>
                    <p className="text-surface-400 mt-1">Created {formatDate(policy.createdAt)}</p>
                </div>
                {!policy.isActive && (
                    <Button onClick={() => setShowActivate(true)}>
                        <Power className="h-4 w-4" />
                        Activate
                    </Button>
                )}
            </div>

            {/* Policy Rules */}
            <Card>
                <CardHeader title="Expense Limits" />
                <div className="grid grid-cols-2 gap-6 mt-2">
                    {rules.map((rule) => (
                        <div key={rule.label}>
                            <p className="text-xs text-surface-500 uppercase tracking-wide">{rule.label}</p>
                            <p className="text-xl font-bold text-surface-100 mt-1">{rule.value}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Flight Classes */}
            <Card>
                <CardHeader title="Allowed Flight Classes" />
                <div className="flex flex-wrap gap-2 mt-2">
                    {policy.rules.allowedFlightClasses.map((cls) => (
                        <span
                            key={cls}
                            className="px-4 py-2 bg-primary-600/20 border border-primary-500/30 text-primary-400 rounded-lg text-sm font-medium capitalize"
                        >
                            {cls.replace('_', ' ')}
                        </span>
                    ))}
                </div>
            </Card>

            {/* Meta */}
            <Card>
                <CardHeader title="Metadata" />
                <div className="space-y-2 text-sm mt-2">
                    <div className="flex justify-between">
                        <span className="text-surface-400">Policy ID</span>
                        <span className="text-surface-300 font-mono text-xs">{policy._id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-surface-400">Version</span>
                        <span className="text-surface-200">{policy.version}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-surface-400">Status</span>
                        <span className="text-surface-200">{policy.isActive ? 'Active' : 'Draft'}</span>
                    </div>
                    {policy.activatedAt && (
                        <div className="flex justify-between">
                            <span className="text-surface-400">Activated At</span>
                            <span className="text-surface-200">{formatDate(policy.activatedAt)}</span>
                        </div>
                    )}
                </div>
            </Card>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={showActivate}
                title="Activate Policy"
                message={`Activating "${policy.name}" will deactivate the current active policy. Continue?`}
                confirmLabel="Activate"
                variant="primary"
                isLoading={isActivating}
                onConfirm={handleActivate}
                onCancel={() => setShowActivate(false)}
            />
        </div>
    );
}
