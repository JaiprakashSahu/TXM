const policyService = require('../services/policy.service');
const {
  createPolicySchema,
  paginationSchema,
} = require('../validators/policy.validator');
const { BadRequestError } = require('../utils/errors');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    throw new BadRequestError(error.details.map((d) => d.message).join(', '));
  }
  return value;
}

class PolicyController {
  async create(req, res) {
    const data = validate(createPolicySchema, req.body);
    const result = await policyService.create({ data, actor: req.user });

    res.status(201).json({
      success: true,
      message: 'Policy created',
      data: result,
    });
  }

  async activate(req, res) {
    const result = await policyService.activate({ id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Policy activated',
      data: result,
    });
  }

  async getActive(req, res) {
    const result = await policyService.getActive();

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  async listAll(req, res) {
    const pagination = validate(paginationSchema, req.query);
    const result = await policyService.listAll({ pagination });

    res.status(200).json({
      success: true,
      data: result.docs,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  }

  async getById(req, res) {
    const result = await policyService.getById(req.params.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}

module.exports = new PolicyController();
