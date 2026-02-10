const policyRepository = require('../repositories/policy.repository');
const { NotFoundError } = require('../utils/errors');

class PolicyService {
  /**
   * Create a new policy draft (inactive). Auto-increments version.
   */
  async create({ data, actor }) {
    const version = await policyRepository.getNextVersion();

    const policy = await policyRepository.create({
      name: data.name,
      version,
      isActive: false,
      rules: data.rules,
      createdBy: actor._id,
    });

    return policyRepository.findById(policy._id);
  }

  /**
   * Activate a policy. Deactivates any currently active policy atomically.
   */
  async activate({ id }) {
    const policy = await policyRepository.findById(id);
    if (!policy) {
      throw new NotFoundError('Policy not found');
    }

    await policyRepository.activatePolicy(id);
    return policyRepository.findById(id);
  }

  /**
   * Get the currently active policy.
   */
  async getActive() {
    const policy = await policyRepository.findActive();
    if (!policy) {
      throw new NotFoundError('No active policy found');
    }
    return policy;
  }

  /**
   * Get the currently active policy or null (no throw).
   * Used internally by other services during evaluation.
   */
  async getActiveOrNull() {
    return policyRepository.findActive();
  }

  /**
   * List all policies (paginated, newest version first).
   */
  async listAll({ pagination }) {
    return policyRepository.findAll(pagination);
  }

  /**
   * Get a single policy by ID.
   */
  async getById(id) {
    const policy = await policyRepository.findById(id);
    if (!policy) {
      throw new NotFoundError('Policy not found');
    }
    return policy;
  }
}

module.exports = new PolicyService();
