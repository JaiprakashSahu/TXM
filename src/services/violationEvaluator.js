/**
 * Violation Evaluator Engine
 *
 * Evaluates travel requests and expenses against a policy's rules.
 * Returns structured violation objects with codes, messages, actual amounts, and limits.
 *
 * Each evaluator function takes the entity + policy.rules and returns
 * an array of violation objects (empty if compliant).
 */

// ── Violation codes ──────────────────────────────────────────────────────────

const CODES = {
  TRIP_TOTAL_EXCEEDED: 'TRIP_TOTAL_EXCEEDED',
  FLIGHT_LIMIT_EXCEEDED: 'FLIGHT_LIMIT_EXCEEDED',
  HOTEL_LIMIT_EXCEEDED: 'HOTEL_LIMIT_EXCEEDED',
  FOOD_LIMIT_EXCEEDED: 'FOOD_LIMIT_EXCEEDED',
  FLIGHT_CLASS_NOT_ALLOWED: 'FLIGHT_CLASS_NOT_ALLOWED',
  CATEGORY_LIMIT_EXCEEDED: 'CATEGORY_LIMIT_EXCEEDED',
};

// ── Travel request evaluator ─────────────────────────────────────────────────

/**
 * Evaluate a travel request's estimated cost against policy limits.
 *
 * @param {Object} travelRequest - { estimatedCost }
 * @param {Object} rules - Policy rules object
 * @returns {Object[]} Array of violation objects
 */
function evaluateTravelAgainstPolicy(travelRequest, rules) {
  const violations = [];

  if (!rules) return violations;

  if (travelRequest.estimatedCost > rules.maxTripTotal) {
    violations.push({
      code: CODES.TRIP_TOTAL_EXCEEDED,
      message: `Estimated trip cost ${travelRequest.estimatedCost} exceeds policy limit of ${rules.maxTripTotal}`,
      amount: travelRequest.estimatedCost,
      limit: rules.maxTripTotal,
    });
  }

  return violations;
}

// ── Expense evaluator ────────────────────────────────────────────────────────

/**
 * Category-to-rule mapping.
 * Maps each expense category to the corresponding policy rule key and violation code.
 */
const CATEGORY_RULE_MAP = {
  flight: { ruleKey: 'maxFlightCost', code: CODES.FLIGHT_LIMIT_EXCEEDED },
  hotel: { ruleKey: 'maxHotelPerDay', code: CODES.HOTEL_LIMIT_EXCEEDED },
  food: { ruleKey: 'maxDailyFood', code: CODES.FOOD_LIMIT_EXCEEDED },
};

/**
 * Evaluate a single expense against policy limits.
 *
 * @param {Object} expense - { amount, category, flightClass? }
 * @param {Object} rules - Policy rules object
 * @returns {Object[]} Array of violation objects
 */
function evaluateExpenseAgainstPolicy(expense, rules) {
  const violations = [];

  if (!rules) return violations;

  // Category-specific limit check
  const mapping = CATEGORY_RULE_MAP[expense.category];
  if (mapping) {
    const limit = rules[mapping.ruleKey];
    if (limit != null && expense.amount > limit) {
      violations.push({
        code: mapping.code,
        message: `${expense.category} expense ${expense.amount} exceeds policy limit of ${limit}`,
        amount: expense.amount,
        limit,
      });
    }
  }

  // Generic category limit for categories without a specific rule (transport, other)
  // These fall under the general trip total which is checked at travel request level.

  // Flight class check
  if (
    expense.category === 'flight' &&
    expense.flightClass &&
    rules.allowedFlightClasses &&
    rules.allowedFlightClasses.length > 0
  ) {
    if (!rules.allowedFlightClasses.includes(expense.flightClass)) {
      violations.push({
        code: CODES.FLIGHT_CLASS_NOT_ALLOWED,
        message: `Flight class '${expense.flightClass}' is not allowed. Permitted: ${rules.allowedFlightClasses.join(', ')}`,
        amount: null,
        limit: null,
      });
    }
  }

  return violations;
}

module.exports = {
  evaluateTravelAgainstPolicy,
  evaluateExpenseAgainstPolicy,
  CODES,
};
