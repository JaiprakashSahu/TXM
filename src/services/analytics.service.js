const { Expense } = require('../models/expense.model');
const { TravelRequest } = require('../models/travelRequest.model');

class AnalyticsService {
  /**
   * 1. Global Spend Summary
   * Aggregates expense amounts grouped by status.
   * Uses { userId: 1, expenseDate: -1 } index for collection scan efficiency.
   */
  async getSpendSummary() {
    const [result] = await Expense.aggregate([
      {
        $group: {
          _id: null,
          totalExpenseAmount: { $sum: '$amount' },
          approvedExpenseAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'finance_approved'] }, '$amount', 0],
            },
          },
          flaggedExpenseAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'flagged'] }, '$amount', 0],
            },
          },
          rejectedExpenseAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'finance_rejected'] }, '$amount', 0],
            },
          },
          submittedExpenseAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'submitted'] }, '$amount', 0],
            },
          },
          countByStatus: {
            $push: '$status',
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalExpenseAmount: 1,
          approvedExpenseAmount: 1,
          flaggedExpenseAmount: 1,
          rejectedExpenseAmount: 1,
          submittedExpenseAmount: 1,
          totalCount: 1,
        },
      },
    ]);

    if (!result) {
      return {
        totalExpenseAmount: 0,
        approvedExpenseAmount: 0,
        flaggedExpenseAmount: 0,
        rejectedExpenseAmount: 0,
        submittedExpenseAmount: 0,
        totalCount: 0,
        countByStatus: {},
      };
    }

    // Parallel pipeline for status counts to keep the main pipeline clean
    const statusCounts = await Expense.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
    ]);

    const countByStatus = {};
    for (const entry of statusCounts) {
      countByStatus[entry.status] = entry.count;
    }

    return { ...result, countByStatus };
  }

  /**
   * 2. Monthly Spend Trend — last 12 months
   * Groups expenses by year+month, returns totalAmount and expenseCount.
   * Leverages { userId: 1, expenseDate: -1 } index via $match on expenseDate.
   */
  async getMonthlyTrend() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const trend = await Expense.aggregate([
      {
        $match: {
          expenseDate: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$expenseDate' },
            month: { $month: '$expenseDate' },
          },
          totalAmount: { $sum: '$amount' },
          expenseCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          totalAmount: 1,
          expenseCount: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    return trend;
  }

  /**
   * 3. Top Spenders — top 10 users by total expense amount
   * Groups by userId, uses $lookup to fetch user name+email.
   * Uses { userId: 1, expenseDate: -1 } index for the initial grouping.
   */
  async getTopSpenders() {
    const spenders = await Expense.aggregate([
      {
        $group: {
          _id: '$userId',
          totalAmount: { $sum: '$amount' },
          expenseCount: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          pipeline: [
            { $project: { name: 1, email: 1, _id: 0 } },
          ],
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          totalAmount: 1,
          expenseCount: 1,
        },
      },
    ]);

    return spenders;
  }

  /**
   * 4. Policy Violation Stats
   * Unwinds violations from both expenses and travel requests,
   * merges and counts by violation code.
   * Runs two pipelines in parallel via Promise.all.
   */
  async getViolationStats() {
    const [expenseViolations, travelViolations] = await Promise.all([
      Expense.aggregate([
        { $match: { 'violations.0': { $exists: true } } },
        { $unwind: '$violations' },
        {
          $group: {
            _id: '$violations.code',
            count: { $sum: 1 },
            sampleMessage: { $first: '$violations.message' },
          },
        },
        {
          $project: {
            _id: 0,
            code: '$_id',
            count: 1,
            sampleMessage: 1,
            source: { $literal: 'expense' },
          },
        },
      ]),
      TravelRequest.aggregate([
        { $match: { hasViolations: true } },
        { $unwind: '$violations' },
        {
          $group: {
            _id: '$violations.code',
            count: { $sum: 1 },
            sampleMessage: { $first: '$violations.message' },
          },
        },
        {
          $project: {
            _id: 0,
            code: '$_id',
            count: 1,
            sampleMessage: 1,
            source: { $literal: 'travelRequest' },
          },
        },
      ]),
    ]);

    // Merge counts by code across both sources
    const mergedMap = {};
    for (const v of [...expenseViolations, ...travelViolations]) {
      if (!mergedMap[v.code]) {
        mergedMap[v.code] = {
          code: v.code,
          totalCount: 0,
          expenseCount: 0,
          travelRequestCount: 0,
          sampleMessage: v.sampleMessage,
        };
      }
      mergedMap[v.code].totalCount += v.count;
      if (v.source === 'expense') {
        mergedMap[v.code].expenseCount += v.count;
      } else {
        mergedMap[v.code].travelRequestCount += v.count;
      }
    }

    const violationCountByCode = Object.values(mergedMap).sort(
      (a, b) => b.totalCount - a.totalCount
    );

    return { violationCountByCode };
  }

  /**
   * 5. Manager Approval Performance
   * For each manager: approvedCount, rejectedCount, avgApprovalTimeHours.
   * Approval time = time between "submitted" and "manager_approved" audit log entries.
   * Uses { managerId: 1, status: 1 } compound index via $match.
   */
  async getManagerPerformance() {
    const [approvalCounts, approvalTimes] = await Promise.all([
      // Pipeline 1: counts by managerId + status
      TravelRequest.aggregate([
        {
          $match: {
            status: { $in: ['manager_approved', 'manager_rejected'] },
          },
        },
        {
          $group: {
            _id: '$managerId',
            approvedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'manager_approved'] }, 1, 0],
              },
            },
            rejectedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'manager_rejected'] }, 1, 0],
              },
            },
          },
        },
      ]),

      // Pipeline 2: avg approval time from audit logs
      TravelRequest.aggregate([
        { $match: { status: 'manager_approved' } },
        { $unwind: '$auditLogs' },
        {
          $match: {
            'auditLogs.action': { $in: ['submitted', 'manager_approved'] },
          },
        },
        {
          $group: {
            _id: {
              requestId: '$_id',
              managerId: '$managerId',
            },
            submittedAt: {
              $min: {
                $cond: [
                  { $eq: ['$auditLogs.action', 'submitted'] },
                  '$auditLogs.timestamp',
                  null,
                ],
              },
            },
            approvedAt: {
              $max: {
                $cond: [
                  { $eq: ['$auditLogs.action', 'manager_approved'] },
                  '$auditLogs.timestamp',
                  null,
                ],
              },
            },
          },
        },
        {
          $match: {
            submittedAt: { $ne: null },
            approvedAt: { $ne: null },
          },
        },
        {
          $project: {
            managerId: '$_id.managerId',
            approvalTimeMs: { $subtract: ['$approvedAt', '$submittedAt'] },
          },
        },
        {
          $group: {
            _id: '$managerId',
            avgApprovalTimeMs: { $avg: '$approvalTimeMs' },
          },
        },
      ]),
    ]);

    // Build a map of approval times
    const timeMap = {};
    for (const entry of approvalTimes) {
      timeMap[entry._id.toString()] = entry.avgApprovalTimeMs;
    }

    // Merge + lookup manager info
    const managerIds = approvalCounts.map((c) => c._id);
    const managers = await TravelRequest.aggregate([
      { $match: { managerId: { $in: managerIds } } },
      {
        $group: {
          _id: '$managerId',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          pipeline: [
            { $project: { name: 1, email: 1, _id: 0 } },
          ],
          as: 'manager',
        },
      },
      { $unwind: '$manager' },
      {
        $project: {
          _id: 0,
          managerId: '$_id',
          name: '$manager.name',
          email: '$manager.email',
        },
      },
    ]);

    const managerMap = {};
    for (const m of managers) {
      managerMap[m.managerId.toString()] = m;
    }

    const performance = approvalCounts.map((entry) => {
      const id = entry._id.toString();
      const avgMs = timeMap[id] || 0;
      const info = managerMap[id] || {};
      return {
        managerId: entry._id,
        name: info.name || 'Unknown',
        email: info.email || '',
        approvedCount: entry.approvedCount,
        rejectedCount: entry.rejectedCount,
        totalDecisions: entry.approvedCount + entry.rejectedCount,
        avgApprovalTimeHours: avgMs > 0 ? +(avgMs / 3_600_000).toFixed(2) : null,
      };
    });

    performance.sort((a, b) => b.totalDecisions - a.totalDecisions);

    return performance;
  }
}

module.exports = new AnalyticsService();
