'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import {
  Plane,
  LayoutDashboard,
  Receipt,
  CalendarCheck,
  Bell,
  CheckSquare,
  FileText,
  BarChart3,
  Flag,
  ClipboardCheck,
  DollarSign,
  Users,
  User,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  section?: string;
}

const navItems: NavItem[] = [
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
  {
    href: '/dashboard/users',
    label: 'Users',
    icon: Users,
    roles: ['admin'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, user } = useAuth();

  const filteredItems = navItems.filter((item) => role && item.roles.includes(role));

  let lastSection: string | undefined;

  return (
    <aside className="w-[250px] bg-gradient-to-b from-blue-900 via-blue-950 to-slate-950 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5">
        <div className="w-8 h-8 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <Plane className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">ITILITE</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            const showSection = item.section && item.section !== lastSection;
            if (item.section) lastSection = item.section;

            const isDisabled = (user as any)?.mustChangePassword && item.href !== '/dashboard/profile';

            return (
              <li key={item.href}>
                {showSection && (
                  <p className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-300/40">
                    {item.section}
                  </p>
                )}
                {isDisabled ? (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium opacity-30 cursor-not-allowed text-blue-200/50">
                    <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-blue-100/60 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-white/10">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-200" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-blue-300/50 capitalize">{role}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
