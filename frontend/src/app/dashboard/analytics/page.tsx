'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib';
import { formatCurrency } from '@/lib/utils';
import {
  SpendSummary,
  MonthlyTrend,
  TopSpender,
  ViolationStat,
  ManagerPerformance,
} from '@/types';
import { RoleGuard } from '@/components/auth';
import { Card, CardHeader, Spinner, UserChip } from '@/components/ui';
import {
  DollarSign,
  CheckCircle,
  Flag,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function AnalyticsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AnalyticsContent />
    </RoleGuard>
  );
}

function AnalyticsContent() {
  const [summary, setSummary] = useState<SpendSummary | null>(null);
  const [trend, setTrend] = useState<MonthlyTrend[]>([]);
  const [spenders, setSpenders] = useState<TopSpender[]>([]);
  const [violations, setViolations] = useState<ViolationStat[]>([]);
  const [managers, setManagers] = useState<ManagerPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [summaryRes, trendRes, spendersRes, violationsRes, managersRes] = await Promise.all([
        apiClient.get('/analytics/summary'),
        apiClient.get('/analytics/monthly-trend'),
        apiClient.get('/analytics/top-spenders'),
        apiClient.get('/analytics/violations'),
        apiClient.get('/analytics/manager-performance'),
      ]);

      setSummary(summaryRes.data.data);
      setTrend(trendRes.data.data || []);
      setSpenders(spendersRes.data.data || []);
      setViolations(violationsRes.data.data?.violationCountByCode || []);
      setManagers(managersRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
        <p className="text-sm text-danger-500">{error}</p>
      </div>
    );
  }

  // Prepare trend chart data
  const trendData = trend.map((t) => ({
    label: `${MONTH_LABELS[t.month - 1]} ${t.year}`,
    amount: t.totalAmount,
    count: t.expenseCount,
  }));

  const summaryCards = [
    {
      label: 'Total Expenses',
      value: formatCurrency(summary?.totalExpenseAmount || 0),
      icon: DollarSign,
      color: 'text-primary-400',
      bg: 'bg-primary-600/20',
    },
    {
      label: 'Approved',
      value: formatCurrency(summary?.approvedExpenseAmount || 0),
      icon: CheckCircle,
      color: 'text-success-500',
      bg: 'bg-success-600/20',
    },
    {
      label: 'Flagged',
      value: formatCurrency(summary?.flaggedExpenseAmount || 0),
      icon: Flag,
      color: 'text-warning-500',
      bg: 'bg-warning-600/20',
    },
    {
      label: 'Rejected',
      value: formatCurrency(summary?.rejectedExpenseAmount || 0),
      icon: XCircle,
      color: 'text-danger-500',
      bg: 'bg-danger-600/20',
    },
    {
      label: 'Total Count',
      value: summary?.totalCount || 0,
      icon: AlertTriangle,
      color: 'text-surface-300',
      bg: 'bg-surface-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Analytics Dashboard</h1>
        <p className="text-surface-400 mt-1">Organization-wide spend and performance insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-surface-500 uppercase tracking-wide">{card.label}</p>
                <p className="text-xl font-bold text-surface-100 mt-0.5 truncate">{card.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Monthly Spend Trend */}
      <Card>
        <CardHeader title="Monthly Spend Trend" description="Last 12 months" />
        {trendData.length > 0 ? (
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#f1f5f9',
                  }}
                  formatter={(value: any) => [formatCurrency(value), 'Amount']}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-surface-500 text-sm py-8 text-center">No data available</p>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spenders Chart */}
        <Card>
          <CardHeader title="Top Spenders" description="Top 10 by total spend" />
          {spenders.length > 0 ? (
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spenders} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: '#f1f5f9',
                    }}
                    formatter={(value: any) => [formatCurrency(value), 'Total Spend']}
                  />
                  <Bar dataKey="totalAmount" radius={[0, 6, 6, 0]}>
                    {spenders.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-surface-500 text-sm py-8 text-center">No data available</p>
          )}
        </Card>

        {/* Violation Distribution */}
        <Card>
          <CardHeader title="Violation Distribution" description="By violation code" />
          {violations.length > 0 ? (
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={violations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="code"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: '#f1f5f9',
                    }}
                    formatter={(value: any, name: any) => {
                      const label = name === 'expenseCount' ? 'Expense' : name === 'travelRequestCount' ? 'Travel' : name;
                      return [value, label];
                    }}
                  />
                  <Bar dataKey="expenseCount" fill="#f59e0b" stackId="stack" radius={[0, 0, 0, 0]} name="expenseCount" />
                  <Bar dataKey="travelRequestCount" fill="#ef4444" stackId="stack" radius={[4, 4, 0, 0]} name="travelRequestCount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-surface-500 text-sm py-8 text-center">No violations recorded</p>
          )}
        </Card>
      </div>

      {/* Top Spenders Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 pt-5 pb-3">
          <CardHeader title="Top Spenders — Detail" />
        </div>
        {spenders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-700/50 border-y border-surface-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">Total Spend</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700">
                {spenders.map((s, i) => (
                  <tr key={i} className="hover:bg-surface-700/30 transition-colors">
                    <td className="px-6 py-3">
                      <UserChip name={s.name} email={s.email} size="sm" />
                    </td>
                    <td className="px-6 py-3 text-sm text-surface-400">{s.email}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-surface-100">{formatCurrency(s.totalAmount)}</td>
                    <td className="px-6 py-3 text-sm text-surface-300">{s.expenseCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-surface-500 text-sm py-8 text-center">No data</p>
        )}
      </Card>

      {/* Manager Performance Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 pt-5 pb-3">
          <CardHeader title="Manager Performance" />
        </div>
        {managers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-700/50 border-y border-surface-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">Manager</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">Approvals</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">Rejections</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-surface-300 uppercase tracking-wider">Avg. Approval Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700">
                {managers.map((m, i) => (
                  <tr key={i} className="hover:bg-surface-700/30 transition-colors">
                    <td className="px-6 py-3">
                      <UserChip name={m.name} email={m.email} size="sm" />
                    </td>
                    <td className="px-6 py-3 text-sm text-success-500 font-semibold">{m.approvedCount}</td>
                    <td className="px-6 py-3 text-sm text-danger-500 font-semibold">{m.rejectedCount}</td>
                    <td className="px-6 py-3 text-sm text-surface-200">{m.totalDecisions}</td>
                    <td className="px-6 py-3 text-sm text-surface-300">
                      {m.avgApprovalTimeHours !== null ? `${m.avgApprovalTimeHours}h` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-surface-500 text-sm py-8 text-center">No data</p>
        )}
      </Card>
    </div>
  );
}
