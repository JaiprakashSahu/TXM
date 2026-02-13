'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Expense } from '@/types';
import { RoleGuard } from '@/components/auth';
import { Card, Spinner, Button, UserChip, StatusBadge, Badge } from '@/components/ui';
import { Eye, AlertTriangle, FileImage, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FinanceExpensePendingPage() {
    return (
        <RoleGuard allowedRoles={['admin']}>
            <PendingContent />
        </RoleGuard>
    );
}

function PendingContent() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
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
            const response = await apiClient.get(`/expenses/pending?page=${page}&limit=${limit}`);
            const data = response.data.data || [];
            setExpenses(Array.isArray(data) ? data : []);

            if (response.data.meta) {
                setTotalPages(response.data.meta.totalPages || 1);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load pending expenses');
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
                <h1 className="text-2xl font-bold text-surface-100">Expense Review Queue</h1>
                <p className="text-surface-400 mt-1">Review and approve expense submissions</p>
            </div>

            {error && (
                <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
                    <p className="text-sm text-danger-500">{error}</p>
                </div>
            )}

            {expenses.length === 0 ? (
                <Card>
                    <div className="text-center py-8">
                        <p className="text-surface-400">No pending expenses.</p>
                        <p className="text-sm text-surface-500 mt-1">All expenses have been reviewed.</p>
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
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Violations
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Receipt
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-surface-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-700">
                                    {expenses.map((expense) => {
                                        // Note: userId might not be populated, handle gracefully
                                        const userName = typeof expense.userId === 'string' ? 'Employee' : 'Employee';
                                        const userEmail = '';

                                        return (
                                            <tr key={expense._id} className="hover:bg-surface-700/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <UserChip name={userName} email={userEmail} size="sm" />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-surface-700 text-surface-300 capitalize">
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-surface-100">
                                                        {formatCurrency(expense.amount)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-surface-300">
                                                        {formatDate(expense.expenseDate)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={expense.status} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    {expense.violations.length > 0 ? (
                                                        <Badge variant="warning">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            {expense.violations.length}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-surface-500">None</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {expense.receiptUrl ? (
                                                        <FileImage className="h-4 w-4 text-primary-400" />
                                                    ) : (
                                                        <span className="text-xs text-surface-500">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/dashboard/finance/expenses/${expense._id}`}>
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
