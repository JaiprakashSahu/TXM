'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Expense, ExpenseCategory } from '@/types';
import { RoleGuard } from '@/components/auth';
import { Card, CardHeader, Button, Badge, Spinner, Textarea } from '@/components/ui';
import { Flag, CheckCircle, XCircle, AlertTriangle, User } from 'lucide-react';

const categoryLabel: Record<ExpenseCategory, string> = {
  flight: 'Flight',
  hotel: 'Hotel',
  food: 'Food',
  transport: 'Transport',
  other: 'Other',
};

export default function FlaggedExpensesPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <FlaggedContent />
    </RoleGuard>
  );
}

function FlaggedContent() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchFlagged();
  }, []);

  const fetchFlagged = async () => {
    try {
      const response = await apiClient.get('/expenses/flagged');
      setExpenses(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load flagged expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setIsProcessing(true);
    try {
      await apiClient.post(`/expenses/${id}/${action}`, { note });
      setNote('');
      setSelectedId(null);
      fetchFlagged();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} expense`);
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
        <h1 className="text-2xl font-bold text-surface-100">Flagged Expenses</h1>
        <p className="text-surface-400 mt-1">Review expenses flagged for policy violations</p>
      </div>

      {error && (
        <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      {expenses.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-success-500 mx-auto mb-3" />
            <p className="text-surface-400">No flagged expenses to review.</p>
            <p className="text-sm text-surface-500 mt-1">All expenses are in compliance.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => {
            const isSelected = selectedId === expense._id;

            return (
              <Card key={expense._id}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-warning-600/20 rounded-xl">
                    <Flag className="h-5 w-5 text-warning-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="neutral">{categoryLabel[expense.category]}</Badge>
                      <Badge variant="warning">Flagged</Badge>
                    </div>
                    <p className="text-lg font-semibold text-surface-100">
                      {formatCurrency(expense.amount)}
                    </p>
                    <p className="text-sm text-surface-400 mt-1">
                      {formatDate(expense.expenseDate)}
                      {expense.description && ` • ${expense.description}`}
                    </p>

                    {/* Flagged reason */}
                    <div className="mt-3 p-3 bg-warning-600/10 border border-warning-600/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-warning-500">Flagged Reason</p>
                          <p className="text-sm text-surface-300 mt-1">{expense.flaggedReason}</p>
                        </div>
                      </div>
                    </div>

                    {/* Violations */}
                    {expense.violations.length > 0 && (
                      <div className="mt-2 text-sm text-surface-400">
                        <p className="font-medium mb-1">Violations:</p>
                        <ul className="space-y-1">
                          {expense.violations.map((v, i) => (
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
                            placeholder="Add a note (optional)..."
                            rows={2}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              isLoading={isProcessing}
                              onClick={() => handleAction(expense._id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              isLoading={isProcessing}
                              onClick={() => handleAction(expense._id, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedId(null);
                                setNote('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => setSelectedId(expense._id)}>
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
