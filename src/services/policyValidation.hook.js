/**
 * Policy validation hook.
 *
 * Runs policy rules against an expense and returns an array of flag reasons.
 * Returns an empty array if the expense passes all policies.
 *
 * Designed for extension: add new rule functions to the RULES array.
 * When a policy config model is built later, inject it into the rule functions.
 */

// ── Individual rule functions ────────────────────────────────────────────────
// Each returns a string reason if flagged, or null if passed.

function checkGeneralAmountCap(expense) {
  if (expense.amount > 5000) {
    return `Amount ${expense.amount} exceeds general policy cap of 5000`;
  }
  return null;
}

function checkHotelCap(expense) {
  if (expense.category === 'hotel' && expense.amount > 8000) {
    return `Hotel expense ${expense.amount} exceeds hotel policy cap of 8000`;
  }
  return null;
}

// ── Rule registry (add new rules here) ───────────────────────────────────────

const RULES = [checkGeneralAmountCap, checkHotelCap];

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Validate an expense against all policy rules.
 * @param {Object} expense - The expense data (amount, category, etc.)
 * @returns {{ flagged: boolean, reasons: string[] }}
 */
function validateExpenseAgainstPolicy(expense) {
  const reasons = [];

  for (const rule of RULES) {
    const result = rule(expense);
    if (result) {
      reasons.push(result);
    }
  }

  return {
    flagged: reasons.length > 0,
    reasons,
  };
}

module.exports = { validateExpenseAgainstPolicy };
