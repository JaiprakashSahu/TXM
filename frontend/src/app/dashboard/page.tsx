'use client';

import { useAuth } from '@/contexts';
import {
  Plane,
  Receipt,
  CalendarCheck,
  Bell,
  CheckSquare,
  Flag,
  BarChart3,
  ArrowRight,
  MapPin,
  Clock,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

function QuickAction({ href, icon: Icon, title, description, color }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors mt-1" />
        </div>
      </div>
    </Link>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function UpcomingTripCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Upcoming Trips</h3>
        <Link href="/dashboard/travel" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Plane className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-sm font-medium text-gray-800">No upcoming trips</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">Create a travel request to get started</span>
            </div>
          </div>
          <Link
            href="/dashboard/travel/new"
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function RecentExpensesCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Recent Expenses</h3>
        <Link href="/dashboard/expenses" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all
        </Link>
      </div>
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Receipt className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-800">No recent expenses</span>
          <p className="text-xs text-gray-500 mt-0.5">Submit expenses against your approved trips</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, role } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here&apos;s what&apos;s happening with your travel and expenses.
          </p>
        </div>
        <Link
          href="/dashboard/travel/new"
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Book New Trip
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Trips" value="--" icon={Plane} color="bg-blue-500" />
        <StatCard label="Pending Expenses" value="--" icon={Receipt} color="bg-amber-500" />
        <StatCard label="Bookings" value="--" icon={CalendarCheck} color="bg-green-500" />
        <StatCard label="Notifications" value="--" icon={Bell} color="bg-purple-500" />
      </div>

      {/* Trips & Expenses Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <UpcomingTripCard />
        <RecentExpensesCard />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction
            href="/dashboard/travel/new"
            icon={Plane}
            title="New Travel Request"
            description="Create a new travel request for approval"
            color="bg-blue-500"
          />
          <QuickAction
            href="/dashboard/expenses"
            icon={Receipt}
            title="Submit Expense"
            description="Add expenses and upload receipts"
            color="bg-green-500"
          />
          <QuickAction
            href="/dashboard/bookings"
            icon={CalendarCheck}
            title="View Bookings"
            description="Check your confirmed bookings"
            color="bg-indigo-500"
          />

          {(role === 'manager' || role === 'admin') && (
            <QuickAction
              href="/dashboard/approvals"
              icon={CheckSquare}
              title="Pending Approvals"
              description="Review travel requests awaiting approval"
              color="bg-amber-500"
            />
          )}

          {role === 'admin' && (
            <>
              <QuickAction
                href="/dashboard/flagged"
                icon={Flag}
                title="Flagged Expenses"
                description="Review expenses flagged for violations"
                color="bg-red-500"
              />
              <QuickAction
                href="/dashboard/analytics"
                icon={BarChart3}
                title="Analytics"
                description="View spending and travel analytics"
                color="bg-purple-500"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
