import { Badge } from './Badge';
import { TravelStatus, ExpenseStatus } from '@/types';

type StatusType = TravelStatus | ExpenseStatus;

const statusConfig: Record<StatusType, { label: string; variant: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
  // Travel statuses
  draft: { label: 'Draft', variant: 'neutral' },
  submitted: { label: 'Pending Approval', variant: 'primary' },
  manager_approved: { label: 'Approved', variant: 'success' },
  manager_rejected: { label: 'Rejected', variant: 'danger' },
  booked: { label: 'Booked', variant: 'success' },
  completed: { label: 'Completed', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  // Expense statuses
  finance_approved: { label: 'Approved', variant: 'success' },
  finance_rejected: { label: 'Rejected', variant: 'danger' },
  flagged: { label: 'Flagged', variant: 'warning' },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'neutral' as const };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
