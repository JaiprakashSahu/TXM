'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Expense, ExpenseStatus, ExpenseCategory } from '@/types';
import { Card, CardHeader, Button, Badge, Spinner, Input, Select } from '@/components/ui';
import { Plus, Receipt, AlertTriangle, Upload } from 'lucide-react';

const statusVariant: Record<ExpenseStatus, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  submitted: 'primary',
  finance_approved: 'success',
  finance_rejected: 'danger',
  flagged: 'warning',
};

const categoryLabel: Record<ExpenseCategory, string> = {
  flight: 'Flight',
  hotel: 'Hotel',
  food: 'Food',
  transport: 'Transport',
  other: 'Other',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    travelRequestId: '',
    amount: '',
    category: 'other' as ExpenseCategory,
    expenseDate: '',
    description: '',
  });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await apiClient.get('/expenses/my');
      setExpenses(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('travelRequestId', formData.travelRequestId);
      form.append('amount', formData.amount);
      form.append('category', formData.category);
      form.append('expenseDate', formData.expenseDate);
      form.append('description', formData.description);
      if (receipt) {
        form.append('receipt', receipt);
      }

      await apiClient.post('/expenses', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowForm(false);
      setFormData({
        travelRequestId: '',
        amount: '',
        category: 'other',
        expenseDate: '',
        description: '',
      });
      setReceipt(null);
      fetchExpenses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit expense');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Expenses</h1>
          <p className="text-surface-400 mt-1">Track and submit your travel expenses</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      {/* Add Expense Form */}
      {showForm && (
        <Card>
          <CardHeader title="New Expense" />
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="travelRequestId"
              label="Travel Request ID"
              placeholder="Enter travel request ID"
              value={formData.travelRequestId}
              onChange={(e) => setFormData({ ...formData, travelRequestId: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="amount"
                type="number"
                label="Amount (INR)"
                placeholder="5000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              <Select
                id="category"
                label="Category"
                options={[
                  { value: 'flight', label: 'Flight' },
                  { value: 'hotel', label: 'Hotel' },
                  { value: 'food', label: 'Food' },
                  { value: 'transport', label: 'Transport' },
                  { value: 'other', label: 'Other' },
                ]}
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as ExpenseCategory })
                }
              />
            </div>
            <Input
              id="expenseDate"
              type="date"
              label="Expense Date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              required
            />
            <Input
              id="description"
              label="Description"
              placeholder="Describe the expense..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div>
              <label className="label">Receipt</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-surface-700 text-surface-100 rounded-xl cursor-pointer hover:bg-surface-600 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">{receipt ? receipt.name : 'Upload receipt'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" isLoading={isSubmitting}>
                Submit Expense
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-surface-500 mx-auto mb-3" />
            <p className="text-surface-400">No expenses submitted yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <Card key={expense._id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="neutral">{categoryLabel[expense.category]}</Badge>
                    <Badge variant={statusVariant[expense.status]}>{expense.status.replace('_', ' ')}</Badge>
                    {expense.violations.length > 0 && (
                      <Badge variant="warning">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Violation
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-surface-100">
                    {formatCurrency(expense.amount)}
                  </p>
                  <p className="text-sm text-surface-400 mt-1">
                    {formatDate(expense.expenseDate)}
                    {expense.description && ` • ${expense.description}`}
                  </p>
                  {expense.flaggedReason && (
                    <p className="text-sm text-warning-500 mt-2">
                      Flagged: {expense.flaggedReason}
                    </p>
                  )}
                </div>
                {expense.receiptUrl && (
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-400 hover:underline"
                  >
                    View Receipt
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
