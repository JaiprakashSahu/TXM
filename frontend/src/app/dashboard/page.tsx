'use client';

import { useAuth } from '@/contexts';
import { Card, CardHeader, Badge } from '@/components/ui';
import { Plane, Receipt, CalendarCheck, Bell, CheckSquare, Flag, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

function QuickAction({ href, icon: Icon, title, description }: QuickActionProps) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary-600/50 transition-colors cursor-pointer">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-surface-700 rounded-xl">
            <Icon className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <h3 className="font-medium text-surface-100">{title}</h3>
            <p className="text-sm text-surface-400 mt-1">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, role } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-surface-100">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-surface-400 mt-1">
          Here's an overview of your travel and expense management.
        </p>
      </div>

      {/* Role Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-surface-400">Your role:</span>
        <Badge variant="primary" className="capitalize">
          {role}
        </Badge>
      </div>

      {/* Quick Actions based on role */}
      <div>
        <h2 className="text-lg font-semibold text-surface-200 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Employee actions */}
          <QuickAction
            href="/dashboard/travel/new"
            icon={Plane}
            title="New Travel Request"
            description="Create a new travel request for approval"
          />
          <QuickAction
            href="/dashboard/expenses"
            icon={Receipt}
            title="Submit Expense"
            description="Add expenses and upload receipts"
          />
          <QuickAction
            href="/dashboard/bookings"
            icon={CalendarCheck}
            title="View Bookings"
            description="Check your confirmed bookings"
          />
          <QuickAction
            href="/dashboard/notifications"
            icon={Bell}
            title="Notifications"
            description="View your recent notifications"
          />

          {/* Manager actions */}
          {(role === 'manager' || role === 'admin') && (
            <QuickAction
              href="/dashboard/approvals"
              icon={CheckSquare}
              title="Pending Approvals"
              description="Review travel requests awaiting approval"
            />
          )}

          {/* Admin actions */}
          {role === 'admin' && (
            <>
              <QuickAction
                href="/dashboard/flagged"
                icon={Flag}
                title="Flagged Expenses"
                description="Review expenses flagged for violations"
              />
              <QuickAction
                href="/dashboard/analytics"
                icon={BarChart3}
                title="Analytics"
                description="View spending and travel analytics"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
