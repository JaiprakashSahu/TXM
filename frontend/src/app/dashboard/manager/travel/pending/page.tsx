'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TravelRequest } from '@/types';
import { RoleGuard } from '@/components/auth';
import { Card, Spinner, Button, UserChip, StatusBadge, Badge } from '@/components/ui';
import { Eye, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ManagerTravelPendingPage() {
    return (
        <RoleGuard allowedRoles={['manager', 'admin']}>
            <PendingContent />
        </RoleGuard>
    );
}

function PendingContent() {
    const [requests, setRequests] = useState<TravelRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    useEffect(() => {
        fetchPending();
    }, [page]);

    const fetchPending = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/travel/manager/pending?page=${page}&limit=${limit}`);
            const data = response.data.data || [];
            setRequests(Array.isArray(data) ? data : []);

            // Handle pagination meta if available
            if (response.data.meta) {
                setTotalPages(response.data.meta.totalPages || 1);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load pending approvals');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && page === 1) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-surface-100">Travel Approvals</h1>
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
                        <p className="text-surface-400">No pending travel requests.</p>
                        <p className="text-sm text-surface-500 mt-1">All requests have been reviewed.</p>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Table */}
                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-700/50 border-b border-surface-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Destination
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Dates
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Est. Cost
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Submitted
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Violations
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-700">
                                    {requests.map((request) => {
                                        const employee =
                                            typeof request.userId === 'object'
                                                ? request.userId
                                                : { name: 'Unknown', email: '' };

                                        return (
                                            <tr key={request._id} className="hover:bg-surface-700/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <UserChip name={employee.name} email={employee.email} size="sm" />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-surface-100">{request.destination}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-surface-300">
                                                        {formatDate(request.startDate)}
                                                    </p>
                                                    <p className="text-xs text-surface-500">
                                                        to {formatDate(request.endDate)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-surface-200">
                                                        {formatCurrency(request.estimatedCost)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-surface-400">
                                                        {formatDate(request.createdAt)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {request.violations.length > 0 ? (
                                                        <Badge variant="warning">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            {request.violations.length}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-surface-500">None</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/dashboard/manager/travel/${request._id}`}>
                                                        <Button variant="secondary" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                            Review
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-surface-400">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1 || isLoading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || isLoading}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
