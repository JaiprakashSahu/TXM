'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { UserRole } from '@/types';
import { ShieldX } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackUrl?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackUrl = '/dashboard' }: RoleGuardProps) {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  const hasAccess = role && allowedRoles.includes(role);

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      router.replace(fallbackUrl);
    }
  }, [hasAccess, isLoading, router, fallbackUrl]);

  if (isLoading) {
    return null;
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ShieldX className="h-12 w-12 text-surface-500 mb-4" />
        <h2 className="text-lg font-semibold text-surface-300">Access Denied</h2>
        <p className="text-sm text-surface-500 mt-1">
          You don't have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
