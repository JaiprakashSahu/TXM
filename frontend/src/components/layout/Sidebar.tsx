'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import {
  Briefcase,
  LayoutDashboard,
  Plane,
  Receipt,
  CalendarCheck,
  Bell,
  CheckSquare,
  FileText,
  BarChart3,
  Flag,
  ClipboardCheck,
  DollarSign,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  section?: string;
}

const navItems: NavItem[] = [
  // ── All Users ──
  {
    href: '/dashboard',
    label: 'Overview',
    icon: LayoutDashboard,
    roles: ['employee', 'manager', 'admin'],
    section: 'General',
  },
  {
    href: '/dashboard/travel',
    label: 'Travel Requests',
    icon: Plane,
    roles: ['employee', 'manager', 'admin'],
  },
  {
    href: '/dashboard/expenses',
    label: 'Expenses',
    icon: Receipt,
    roles: ['employee', 'manager', 'admin'],
  },
  {
    href: '/dashboard/bookings',
    label: 'Bookings',
    icon: CalendarCheck,
    roles: ['employee', 'manager', 'admin'],
  },
  {
    href: '/dashboard/notifications',
    label: 'Notifications',
    icon: Bell,
    roles: ['employee', 'manager', 'admin'],
  },

  // ── Manager ──
  {
    href: '/dashboard/manager/travel/pending',
    label: 'Travel Approvals',
    icon: ClipboardCheck,
    roles: ['manager', 'admin'],
    section: 'Manager',
  },
  {
    href: '/dashboard/approvals',
    label: 'Quick Approvals',
    icon: CheckSquare,
    roles: ['manager', 'admin'],
  },

  // ── Finance / Admin ──
  {
    href: '/dashboard/finance/expenses/pending',
    label: 'Expense Review',
    icon: DollarSign,
    roles: ['admin'],
    section: 'Finance',
  },
  {
    href: '/dashboard/flagged',
    label: 'Flagged Expenses',
    icon: Flag,
    roles: ['admin'],
  },
  {
    href: '/dashboard/policies',
    label: 'Policies',
    icon: FileText,
    roles: ['admin'],
    section: 'Admin',
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['admin'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();

  const filteredItems = navItems.filter((item) => role && item.roles.includes(role));

  let lastSection: string | undefined;

  return (
    <aside className="w-64 bg-surface-900 border-r border-surface-700 flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-surface-700">
        <div className="p-2 bg-primary-600 rounded-lg">
          <Briefcase className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-surface-100">ITILITE</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            const showSection = item.section && item.section !== lastSection;
            if (item.section) lastSection = item.section;

            return (
              <li key={item.href}>
                {showSection && (
                  <p className="px-3 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                    {item.section}
                  </p>
                )}
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-surface-400 hover:bg-surface-800 hover:text-surface-100'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-700">
        <p className="text-xs text-surface-500 text-center">
          Travel & Expense Management
        </p>
      </div>
    </aside>
  );
}
