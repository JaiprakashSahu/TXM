'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TravelRequest, PolicyRules } from '@/types';
import { RoleGuard } from '@/components/auth';
import {
    Card,
    CardHeader,
    Spinner,
    UserChip,
    StatusBadge,
    ViolationList,
    AuditTimeline,
    ApprovalPanel,
} from '@/components/ui';
import { ArrowLeft, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ManagerTravelReviewPage() {
    return (
        <RoleGuard allowedRoles={['manager', 'admin']}>
            <ReviewContent />
        </RoleGuard>
    );
}

function ReviewContent() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [request, setRequest] = useState<TravelRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchRequest();
    }, [id]);

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

    const handleApprove = async (comment: string) => {
        setIsProcessing(true);
        setError(null);
        try {
            await apiClient.post(`/travel/${id}/approve`, { comment });
            setSuccessMessage('Travel request approved successfully!');
            setTimeout(() => router.push('/dashboard/manager/travel/pending'), 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to approve request');
            setIsProcessing(false);
        }
    };

    const handleReject = async (comment: string) => {
        setIsProcessing(true);
        setError(null);
        try {
            await apiClient.post(`/travel/${id}/reject`, { comment });
            setSuccessMessage('Travel request rejected.');
            setTimeout(() => router.push('/dashboard/manager/travel/pending'), 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reject request');
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

    if (!request) {
        return (
            <div className="text-center py-12">
                <p className="text-surface-400">Travel request not found.</p>
            </div>
        );
    }

    const employee =
        typeof request.userId === 'object' ? request.userId : { name: 'Unknown', email: '' };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/manager/travel/pending">
                    <button className="p-2 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-surface-100">Review Travel Request</h1>
                    <p className="text-surface-400 mt-1">Submitted by {employee.name}</p>
                </div>
                <StatusBadge status={request.status} />
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="p-4 bg-success-600/10 border border-success-600/30 rounded-xl">
                    <p className="text-sm text-success-500">{successMessage}</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
                    <p className="text-sm text-danger-500">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Request Details */}
                    <Card>
                        <CardHeader title="Request Details" />
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-surface-500 uppercase tracking-wide">Destination</p>
                                    <p className="text-lg font-semibold text-surface-100 mt-0.5">
                                        {request.destination}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-primary-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-surface-500 uppercase tracking-wide">Travel Dates</p>
                                    <p className="text-sm text-surface-200 mt-0.5">
                                        {formatDate(request.startDate)} – {formatDate(request.endDate)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <DollarSign className="h-5 w-5 text-primary-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-surface-500 uppercase tracking-wide">Estimated Cost</p>
                                    <p className="text-lg font-semibold text-surface-100 mt-0.5">
                                        {formatCurrency(request.estimatedCost)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-primary-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs text-surface-500 uppercase tracking-wide">Purpose</p>
                                    <p className="text-sm text-surface-200 mt-0.5 leading-relaxed">
                                        {request.purpose}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Violations */}
                    {request.violations.length > 0 && (
                        <ViolationList violations={request.violations} />
                    )}

                    {/* Audit Timeline */}
                    {request.auditLogs.length > 0 && (
                        <Card>
                            <AuditTimeline logs={request.auditLogs} />
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Employee Info */}
                    <Card>
                        <CardHeader title="Employee" />
                        <UserChip name={employee.name} email={employee.email} />
                    </Card>

                    {/* Policy Snapshot */}
                    {request.policySnapshot && (
                        <Card>
                            <CardHeader title="Policy Limits" />
                            <PolicySnapshotTable policy={request.policySnapshot} />
                        </Card>
                    )}

                    {/* Approval Panel */}
                    {request.status === 'submitted' && (
                        <ApprovalPanel
                            onApprove={handleApprove}
                            onReject={handleReject}
                            isLoading={isProcessing}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function PolicySnapshotTable({ policy }: { policy: PolicyRules }) {
    return (
        <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-surface-400">Max Flight Cost</span>
                <span className="text-surface-200 font-medium">{formatCurrency(policy.maxFlightCost)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-surface-400">Max Hotel/Day</span>
                <span className="text-surface-200 font-medium">{formatCurrency(policy.maxHotelPerDay)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-surface-400">Max Daily Food</span>
                <span className="text-surface-200 font-medium">{formatCurrency(policy.maxDailyFood)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-surface-400">Max Trip Total</span>
                <span className="text-surface-200 font-medium">{formatCurrency(policy.maxTripTotal)}</span>
            </div>
            <div className="pt-2 border-t border-surface-700">
                <p className="text-surface-400 mb-1">Allowed Flight Classes</p>
                <div className="flex flex-wrap gap-1">
                    {policy.allowedFlightClasses.map((cls) => (
                        <span
                            key={cls}
                            className="px-2 py-0.5 bg-surface-700 text-surface-300 rounded text-xs"
                        >
                            {cls}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
