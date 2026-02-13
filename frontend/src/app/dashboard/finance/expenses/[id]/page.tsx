'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Expense } from '@/types';
import { RoleGuard } from '@/components/auth';
import {
    Card,
    CardHeader,
    Spinner,
    Button,
    StatusBadge,
    ViolationList,
    ApprovalPanel,
    ReceiptPreviewModal,
} from '@/components/ui';
import { ArrowLeft, DollarSign, Calendar, Tag, FileText, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function FinanceExpenseReviewPage() {
    return (
        <RoleGuard allowedRoles={['admin']}>
            <ReviewContent />
        </RoleGuard>
    );
}

function ReviewContent() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [expense, setExpense] = useState<Expense | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    useEffect(() => {
        if (id) fetchExpense();
    }, [id]);

    const fetchExpense = async () => {
        try {
            const response = await apiClient.get(`/expenses/${id}`);
            setExpense(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load expense');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (comment: string) => {
        setIsProcessing(true);
        setError(null);
        try {
            await apiClient.post(`/expenses/${id}/approve`, { comment });
            setSuccessMessage('Expense approved successfully!');
            setTimeout(() => router.push('/dashboard/finance/expenses/pending'), 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to approve expense');
            setIsProcessing(false);
        }
    };

    const handleReject = async (comment: string) => {
        setIsProcessing(true);
        setError(null);
        try {
            await apiClient.post(`/expenses/${id}/reject`, { comment });
            setSuccessMessage('Expense rejected.');
            setTimeout(() => router.push('/dashboard/finance/expenses/pending'), 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reject expense');
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

    if (!expense) {
        return (
            <div className="text-center py-12">
                <p className="text-surface-400">Expense not found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/finance/expenses/pending">
                    <button className="p-2 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-surface-100">Review Expense</h1>
                    <p className="text-surface-400 mt-1">
                        {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)} expense
                    </p>
                </div>
                <StatusBadge status={expense.status} />
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
                    {/* Expense Details */}
                    <Card>
                        <CardHeader title="Expense Details" />
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <DollarSign className="h-5 w-5 text-primary-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-surface-500 uppercase tracking-wide">Amount</p>
                                    <p className="text-2xl font-bold text-surface-100 mt-0.5">
                                        {formatCurrency(expense.amount)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Tag className="h-5 w-5 text-primary-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-surface-500 uppercase tracking-wide">Category</p>
                                    <p className="text-sm text-surface-200 mt-0.5 capitalize">
                                        {expense.category}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-primary-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-surface-500 uppercase tracking-wide">Expense Date</p>
                                    <p className="text-sm text-surface-200 mt-0.5">
                                        {formatDate(expense.expenseDate)}
                                    </p>
                                </div>
                            </div>

                            {expense.description && (
                                <div className="flex items-start gap-3">
                                    <FileText className="h-5 w-5 text-primary-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs text-surface-500 uppercase tracking-wide">Description</p>
                                        <p className="text-sm text-surface-200 mt-0.5 leading-relaxed">
                                            {expense.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {expense.flaggedReason && (
                                <div className="p-3 bg-warning-600/10 border border-warning-600/30 rounded-lg">
                                    <p className="text-xs font-semibold text-warning-500 uppercase tracking-wide mb-1">
                                        Flagged Reason
                                    </p>
                                    <p className="text-sm text-surface-200">{expense.flaggedReason}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Violations */}
                    {expense.violations.length > 0 && (
                        <ViolationList violations={expense.violations} />
                    )}

                    {/* Travel Request Link */}
                    {expense.travelRequestId && (
                        <Card>
                            <CardHeader title="Linked Travel Request" />
                            <p className="text-sm text-surface-400">
                                This expense is linked to travel request{' '}
                                <Link
                                    href={`/dashboard/travel/${expense.travelRequestId}`}
                                    className="text-primary-400 hover:text-primary-300 underline"
                                >
                                    {expense.travelRequestId}
                                </Link>
                            </p>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Receipt */}
                    {expense.receiptUrl && (
                        <Card>
                            <CardHeader title="Receipt" />
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => setShowReceiptModal(true)}
                            >
                                <ImageIcon className="h-4 w-4" />
                                View Receipt
                            </Button>
                        </Card>
                    )}

                    {/* Approval Panel */}
                    {(expense.status === 'submitted' || expense.status === 'flagged') && (
                        <ApprovalPanel
                            onApprove={handleApprove}
                            onReject={handleReject}
                            isLoading={isProcessing}
                        />
                    )}
                </div>
            </div>

            {/* Receipt Preview Modal */}
            {expense.receiptUrl && (
                <ReceiptPreviewModal
                    url={expense.receiptUrl}
                    isOpen={showReceiptModal}
                    onClose={() => setShowReceiptModal(false)}
                />
            )}
        </div>
    );
}
