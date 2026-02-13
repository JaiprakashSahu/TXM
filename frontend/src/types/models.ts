// Travel request types
export type TravelStatus =
  | 'draft'
  | 'submitted'
  | 'manager_approved'
  | 'manager_rejected'
  | 'booked'
  | 'completed'
  | 'cancelled';

export interface TravelRequest {
  _id: string;
  userId: string | { _id: string; name: string; email: string };
  managerId: string | { _id: string; name: string; email: string };
  destination: string;
  startDate: string;
  endDate: string;
  estimatedCost: number;
  purpose: string;
  status: TravelStatus;
  managerComment: string;
  policySnapshot: PolicyRules | null;
  violations: Violation[];
  auditLogs: AuditLog[];
  createdAt: string;
  updatedAt: string;
}

// Expense types
export type ExpenseStatus = 'submitted' | 'finance_approved' | 'finance_rejected' | 'flagged';
export type ExpenseCategory = 'flight' | 'hotel' | 'food' | 'transport' | 'other';

export interface Expense {
  _id: string;
  travelRequestId: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  description: string;
  receiptUrl: string;
  status: ExpenseStatus;
  flaggedReason: string;
  violations: Violation[];
  auditLogs: AuditLog[];
  createdAt: string;
  updatedAt: string;
}

// Booking types
export type BookingStatus = 'initiated' | 'confirmed' | 'failed' | 'cancelled';
export type BookingType = 'flight' | 'hotel';

export interface Booking {
  _id: string;
  travelRequestId: string;
  userId: string;
  type: BookingType;
  inventoryId: string;
  price: number;
  currency: string;
  status: BookingStatus;
  idempotencyKey: string;
  attempts: number;
  lastError: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Policy types
export interface PolicyRules {
  maxFlightCost: number;
  maxHotelPerDay: number;
  maxDailyFood: number;
  maxTripTotal: number;
  allowedFlightClasses: string[];
}

export interface Policy {
  _id: string;
  name: string;
  version: number;
  isActive: boolean;
  rules: PolicyRules;
  createdBy: string;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export type NotificationChannel = 'email' | 'inapp';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  attempts: number;
  lastError: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Violation
export interface Violation {
  code: string;
  message: string;
  amount?: number;
  limit?: number;
}

// Audit log
export interface AuditLog {
  action: string;
  actorId: string;
  actorRole: string;
  timestamp: string;
  note: string;
}

// Analytics types — matching backend aggregation shapes

export interface SpendSummary {
  totalExpenseAmount: number;
  approvedExpenseAmount: number;
  flaggedExpenseAmount: number;
  rejectedExpenseAmount: number;
  submittedExpenseAmount: number;
  totalCount: number;
  countByStatus: Record<string, number>;
}

export interface MonthlyTrend {
  year: number;
  month: number;
  totalAmount: number;
  expenseCount: number;
}

export interface TopSpender {
  userId: string;
  name: string;
  email: string;
  totalAmount: number;
  expenseCount: number;
}

export interface ViolationStat {
  code: string;
  totalCount: number;
  expenseCount: number;
  travelRequestCount: number;
  sampleMessage: string;
}

export interface ManagerPerformance {
  managerId: string;
  name: string;
  email: string;
  approvedCount: number;
  rejectedCount: number;
  totalDecisions: number;
  avgApprovalTimeHours: number | null;
}
