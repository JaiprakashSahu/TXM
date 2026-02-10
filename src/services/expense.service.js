const expenseRepository = require('../repositories/expense.repository');
const travelRequestRepository = require('../repositories/travelRequest.repository');
const policyService = require('./policy.service');
const { evaluateExpenseAgainstPolicy } = require('./violationEvaluator');
const { eventBus, EVENTS } = require('../events/eventBus');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require('../utils/errors');

// ── Statuses that allow expense submission ───────────────────────────────────

const EXPENSABLE_STATUSES = ['manager_approved', 'booked', 'completed'];

// ── Allowed finance transitions ──────────────────────────────────────────────

const FINANCE_TRANSITIONS = {
  submitted: ['finance_approved', 'finance_rejected'],
  flagged: ['finance_approved', 'finance_rejected'],
  finance_approved: [],
  finance_rejected: [],
};

function assertFinanceTransition(currentStatus, targetStatus) {
  const allowed = FINANCE_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new BadRequestError(
      `Transition from '${currentStatus}' to '${targetStatus}' is not allowed`
    );
  }
}

// ── Audit helper ─────────────────────────────────────────────────────────────

function appendAudit(expense, { action, actor, note = '' }) {
  expense.auditLogs.push({
    action,
    actorId: actor._id,
    actorRole: actor.role,
    note,
  });
}

// ── Service ──────────────────────────────────────────────────────────────────

class ExpenseService {
  /**
   * Submit a new expense against a travel request.
   */
  async submit({ data, receiptPath, actor }) {
    // 1. Validate travel request exists and belongs to the actor
    const travelRequest = await travelRequestRepository.findByIdRaw(
      data.travelRequestId
    );
    if (!travelRequest) {
      throw new NotFoundError('Travel request not found');
    }

    // Cross-entity ownership check
    if (travelRequest.userId.toString() !== actor._id.toString()) {
      throw new ForbiddenError(
        'You can only submit expenses for your own travel requests'
      );
    }

    // 2. Validate travel request is in an expensable status
    if (!EXPENSABLE_STATUSES.includes(travelRequest.status)) {
      throw new BadRequestError(
        `Cannot submit expenses for a travel request in '${travelRequest.status}' status. ` +
          `Allowed statuses: ${EXPENSABLE_STATUSES.join(', ')}`
      );
    }

    // 3. Duplicate detection
    const duplicate = await expenseRepository.findDuplicate({
      userId: actor._id,
      amount: data.amount,
      expenseDate: data.expenseDate,
    });

    let status = 'submitted';
    let flaggedReason = '';
    let violations = [];

    if (duplicate) {
      status = 'flagged';
      flaggedReason = `Potential duplicate: matches expense ${duplicate._id} (same user, amount, date)`;
    }

    // 4. Policy validation via real violation engine
    const activePolicy = await policyService.getActiveOrNull();

    if (activePolicy) {
      const policyViolations = evaluateExpenseAgainstPolicy(
        data,
        activePolicy.rules
      );

      if (policyViolations.length > 0) {
        status = 'flagged';
        violations = policyViolations;
        const policyReasons = policyViolations
          .map((v) => v.message)
          .join('; ');
        flaggedReason = flaggedReason
          ? `${flaggedReason}. ${policyReasons}`
          : policyReasons;
      }
    }

    // 5. Build audit note
    const initialAuditNote =
      status === 'flagged'
        ? `Expense submitted and auto-flagged: ${flaggedReason}`
        : 'Expense submitted';

    // 6. Create the expense
    const expense = await expenseRepository.create({
      travelRequestId: data.travelRequestId,
      userId: actor._id,
      amount: data.amount,
      category: data.category,
      expenseDate: data.expenseDate,
      description: data.description || '',
      receiptUrl: receiptPath || '',
      status,
      flaggedReason,
      violations,
      auditLogs: [
        {
          action: status === 'flagged' ? 'submitted_flagged' : 'submitted',
          actorId: actor._id,
          actorRole: actor.role,
          note: initialAuditNote,
        },
      ],
    });

    // Emit domain event if expense was auto-flagged
    if (status === 'flagged') {
      eventBus.emitEvent(EVENTS.EXPENSE_FLAGGED, {
        expense: { ...expense.toObject(), flaggedReason },
        actor,
      });
    }

    return expenseRepository.findById(expense._id);
  }

  /**
   * Finance approves a submitted or flagged expense.
   */
  async approve({ id, actor, comment = '' }) {
    const expense = await expenseRepository.findByIdRaw(id);
    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    assertFinanceTransition(expense.status, 'finance_approved');

    expense.status = 'finance_approved';
    appendAudit(expense, {
      action: 'finance_approved',
      actor,
      note: comment || 'Approved by finance',
    });

    await expenseRepository.save(expense);

    // Emit domain event — fire-and-forget
    eventBus.emitEvent(EVENTS.EXPENSE_APPROVED, { expense, actor });

    return expenseRepository.findById(expense._id);
  }

  /**
   * Finance rejects a submitted or flagged expense.
   */
  async reject({ id, actor, comment = '' }) {
    const expense = await expenseRepository.findByIdRaw(id);
    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    assertFinanceTransition(expense.status, 'finance_rejected');

    expense.status = 'finance_rejected';
    appendAudit(expense, {
      action: 'finance_rejected',
      actor,
      note: comment || 'Rejected by finance',
    });

    await expenseRepository.save(expense);
    return expenseRepository.findById(expense._id);
  }

  /**
   * List expenses for the authenticated user.
   */
  async listMy({ userId, filters }) {
    return expenseRepository.findByUser(userId, filters);
  }

  /**
   * List submitted/flagged expenses for finance review.
   */
  async listPending({ pagination }) {
    return expenseRepository.findPendingForFinance(pagination);
  }

  /**
   * Get a single expense by ID (owner or admin).
   */
  async getById({ id, actor }) {
    const expense = await expenseRepository.findById(id);
    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    const isOwner = expense.userId._id.toString() === actor._id.toString();
    const isAdmin = actor.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('Not authorized to view this expense');
    }

    return expense;
  }
}

module.exports = new ExpenseService();
