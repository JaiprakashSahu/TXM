const travelRequestRepository = require('../repositories/travelRequest.repository');
const userRepository = require('../repositories/user.repository');
const policyService = require('./policy.service');
const { evaluateTravelAgainstPolicy } = require('./violationEvaluator');
const { eventBus, EVENTS } = require('../events/eventBus');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require('../utils/errors');

// ── State machine ────────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS = {
  draft: ['submitted', 'cancelled'],
  submitted: ['manager_approved', 'manager_rejected', 'cancelled'],
  manager_approved: ['booked', 'cancelled'],
  manager_rejected: ['cancelled'],
  booked: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function assertTransition(currentStatus, targetStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new BadRequestError(
      `Transition from '${currentStatus}' to '${targetStatus}' is not allowed`
    );
  }
}

// ── Audit helper ─────────────────────────────────────────────────────────────

function appendAudit(travelRequest, { action, actor, note = '' }) {
  travelRequest.auditLogs.push({
    action,
    actorId: actor._id,
    actorRole: actor.role,
    note,
  });
}

// ── Service ──────────────────────────────────────────────────────────────────

class TravelRequestService {
  /**
   * Create a new draft travel request.
   */
  async create({ data, actor }) {
    // Verify the manager exists and actually has the manager or admin role
    const manager = await userRepository.findActiveById(data.managerId);
    if (!manager) {
      throw new NotFoundError('Assigned manager not found');
    }
    if (!['manager', 'admin'].includes(manager.role)) {
      throw new BadRequestError('Assigned user does not have a manager role');
    }

    const travelRequest = await travelRequestRepository.create({
      ...data,
      userId: actor._id,
      status: 'draft',
      auditLogs: [
        {
          action: 'created',
          actorId: actor._id,
          actorRole: actor.role,
          note: 'Travel request created as draft',
        },
      ],
    });

    return travelRequestRepository.findById(travelRequest._id);
  }

  /**
   * Update a draft travel request. Only the owner can update, and only while in draft.
   */
  async update({ id, data, actor }) {
    const tr = await this._findAndAssertOwner(id, actor);

    if (tr.status !== 'draft') {
      throw new BadRequestError('Only draft requests can be edited');
    }

    // If managerId is being changed, verify the new manager
    if (data.managerId && data.managerId !== tr.managerId.toString()) {
      const manager = await userRepository.findActiveById(data.managerId);
      if (!manager) {
        throw new NotFoundError('Assigned manager not found');
      }
      if (!['manager', 'admin'].includes(manager.role)) {
        throw new BadRequestError('Assigned user does not have a manager role');
      }
    }

    // Cross-field date validation when only one date is being updated
    const effectiveStart = data.startDate
      ? new Date(data.startDate)
      : tr.startDate;
    const effectiveEnd = data.endDate ? new Date(data.endDate) : tr.endDate;
    if (effectiveEnd <= effectiveStart) {
      throw new BadRequestError('End date must be after start date');
    }

    Object.assign(tr, data);
    appendAudit(tr, { action: 'updated', actor, note: 'Draft updated' });

    await travelRequestRepository.save(tr);
    return travelRequestRepository.findById(tr._id);
  }

  /**
   * Submit a draft for manager approval.
   * Evaluates the request against the active policy and stores a snapshot.
   */
  async submit({ id, actor, note = '' }) {
    const tr = await this._findAndAssertOwner(id, actor);

    assertTransition(tr.status, 'submitted');

    // ── Policy evaluation on submit ──────────────────────────────────────
    const activePolicy = await policyService.getActiveOrNull();

    if (activePolicy) {
      const snapshot = {
        policyId: activePolicy._id,
        name: activePolicy.name,
        version: activePolicy.version,
        rules: activePolicy.rules,
      };

      const violations = evaluateTravelAgainstPolicy(tr, activePolicy.rules);

      tr.policySnapshot = snapshot;
      tr.violations = violations;
      tr.hasViolations = violations.length > 0;

      if (violations.length > 0) {
        const violationSummary = violations
          .map((v) => v.message)
          .join('; ');
        appendAudit(tr, {
          action: 'policy_evaluated',
          actor,
          note: `Policy violations detected: ${violationSummary}`,
        });
      } else {
        appendAudit(tr, {
          action: 'policy_evaluated',
          actor,
          note: `Compliant with policy "${activePolicy.name}" v${activePolicy.version}`,
        });
      }
    }

    tr.status = 'submitted';
    appendAudit(tr, {
      action: 'submitted',
      actor,
      note: note || 'Submitted for manager approval',
    });

    await travelRequestRepository.save(tr);

    // Emit domain event — fire-and-forget
    eventBus.emitEvent(EVENTS.TRAVEL_SUBMITTED, { travelRequest: tr, actor });

    return travelRequestRepository.findById(tr._id);
  }

  /**
   * Manager approves a submitted request.
   */
  async approve({ id, actor, comment = '' }) {
    const tr = await this._findAndAssertManager(id, actor);

    assertTransition(tr.status, 'manager_approved');

    tr.status = 'manager_approved';
    tr.managerComment = comment;
    appendAudit(tr, {
      action: 'manager_approved',
      actor,
      note: comment || 'Approved by manager',
    });

    await travelRequestRepository.save(tr);

    // Emit domain event — fire-and-forget
    eventBus.emitEvent(EVENTS.TRAVEL_APPROVED, { travelRequest: tr, actor });

    return travelRequestRepository.findById(tr._id);
  }

  /**
   * Manager rejects a submitted request.
   */
  async reject({ id, actor, comment = '' }) {
    const tr = await this._findAndAssertManager(id, actor);

    assertTransition(tr.status, 'manager_rejected');

    tr.status = 'manager_rejected';
    tr.managerComment = comment;
    appendAudit(tr, {
      action: 'manager_rejected',
      actor,
      note: comment || 'Rejected by manager',
    });

    await travelRequestRepository.save(tr);

    // Emit domain event — fire-and-forget
    eventBus.emitEvent(EVENTS.TRAVEL_REJECTED, { travelRequest: tr, actor });

    return travelRequestRepository.findById(tr._id);
  }

  /**
   * Cancel a request. Allowed from any status except completed/cancelled.
   */
  async cancel({ id, actor, note = '' }) {
    const tr = await travelRequestRepository.findByIdRaw(id);
    if (!tr) {
      throw new NotFoundError('Travel request not found');
    }

    // Owner or assigned manager can cancel
    const isOwner = tr.userId.toString() === actor._id.toString();
    const isManager = tr.managerId.toString() === actor._id.toString();
    if (!isOwner && !isManager) {
      throw new ForbiddenError('Not authorized to cancel this request');
    }

    assertTransition(tr.status, 'cancelled');

    tr.status = 'cancelled';
    appendAudit(tr, {
      action: 'cancelled',
      actor,
      note: note || 'Request cancelled',
    });

    await travelRequestRepository.save(tr);
    return travelRequestRepository.findById(tr._id);
  }

  /**
   * List requests for the authenticated employee.
   */
  async listMy({ userId, pagination }) {
    return travelRequestRepository.findByUser(userId, pagination);
  }

  /**
   * List submitted requests pending the manager's review.
   */
  async listPendingForManager({ managerId, pagination }) {
    return travelRequestRepository.findPendingForManager(
      managerId,
      pagination
    );
  }

  /**
   * Get a single travel request by ID (for the owner or assigned manager).
   */
  async getById({ id, actor }) {
    const tr = await travelRequestRepository.findById(id);
    if (!tr) {
      throw new NotFoundError('Travel request not found');
    }

    const isOwner = tr.userId._id.toString() === actor._id.toString();
    const isManager = tr.managerId._id.toString() === actor._id.toString();
    const isAdmin = actor.role === 'admin';
    if (!isOwner && !isManager && !isAdmin) {
      throw new ForbiddenError('Not authorized to view this request');
    }

    return tr;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  async _findAndAssertOwner(id, actor) {
    const tr = await travelRequestRepository.findByIdRaw(id);
    if (!tr) {
      throw new NotFoundError('Travel request not found');
    }
    if (tr.userId.toString() !== actor._id.toString()) {
      throw new ForbiddenError('You can only modify your own travel requests');
    }
    return tr;
  }

  async _findAndAssertManager(id, actor) {
    const tr = await travelRequestRepository.findByIdRaw(id);
    if (!tr) {
      throw new NotFoundError('Travel request not found');
    }
    if (tr.managerId.toString() !== actor._id.toString()) {
      throw new ForbiddenError(
        'You are not the assigned manager for this request'
      );
    }
    return tr;
  }
}

module.exports = new TravelRequestService();
