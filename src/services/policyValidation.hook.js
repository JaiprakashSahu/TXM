/**
 * Policy validation hook — DEPRECATED.
 *
 * This file originally contained hardcoded stub rules.
 * It has been superseded by the config-driven violation evaluator engine:
 *   - src/services/violationEvaluator.js   (rule evaluation)
 *   - src/services/policy.service.js       (active policy lookup)
 *
 * Both travel.service.js and expense.service.js now use the real engine directly.
 *
 * This file is retained only for backward compatibility. Do not add new rules here.
 */

const { evaluateExpenseAgainstPolicy } = require('./violationEvaluator');

/**
 * Legacy wrapper. Calls the real engine with null rules (no-op) if called
 * without a policy. For proper evaluation, use the violation evaluator
 * with an active policy's rules instead.
 *
 * @deprecated Use evaluateExpenseAgainstPolicy from violationEvaluator.js
 */
function validateExpenseAgainstPolicy(expense, rules) {
  if (!rules) {
    return { flagged: false, reasons: [], violations: [] };
  }

  const violations = evaluateExpenseAgainstPolicy(expense, rules);
  return {
    flagged: violations.length > 0,
    reasons: violations.map((v) => v.message),
    violations,
  };
}

module.exports = { validateExpenseAgainstPolicy };
