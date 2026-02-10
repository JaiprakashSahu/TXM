const travelService = require('../services/travel.service');
const {
  createTravelSchema,
  updateTravelSchema,
  submitTravelSchema,
  managerActionSchema,
  paginationSchema,
} = require('../validators/travel.validator');
const { BadRequestError } = require('../utils/errors');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    throw new BadRequestError(error.details.map((d) => d.message).join(', '));
  }
  return value;
}

class TravelController {
  async create(req, res) {
    const data = validate(createTravelSchema, req.body);
    const result = await travelService.create({ data, actor: req.user });

    res.status(201).json({
      success: true,
      message: 'Travel request created',
      data: result,
    });
  }

  async update(req, res) {
    const data = validate(updateTravelSchema, req.body);
    const result = await travelService.update({
      id: req.params.id,
      data,
      actor: req.user,
    });

    res.status(200).json({
      success: true,
      message: 'Travel request updated',
      data: result,
    });
  }

  async submit(req, res) {
    const { note } = validate(submitTravelSchema, req.body);
    const result = await travelService.submit({
      id: req.params.id,
      actor: req.user,
      note,
    });

    res.status(200).json({
      success: true,
      message: 'Travel request submitted for approval',
      data: result,
    });
  }

  async approve(req, res) {
    const { comment } = validate(managerActionSchema, req.body);
    const result = await travelService.approve({
      id: req.params.id,
      actor: req.user,
      comment,
    });

    res.status(200).json({
      success: true,
      message: 'Travel request approved',
      data: result,
    });
  }

  async reject(req, res) {
    const { comment } = validate(managerActionSchema, req.body);
    const result = await travelService.reject({
      id: req.params.id,
      actor: req.user,
      comment,
    });

    res.status(200).json({
      success: true,
      message: 'Travel request rejected',
      data: result,
    });
  }

  async cancel(req, res) {
    const result = await travelService.cancel({
      id: req.params.id,
      actor: req.user,
      note: req.body.note || '',
    });

    res.status(200).json({
      success: true,
      message: 'Travel request cancelled',
      data: result,
    });
  }

  async listMy(req, res) {
    const pagination = validate(paginationSchema, req.query);
    const result = await travelService.listMy({
      userId: req.user._id,
      pagination,
    });

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

  async listPendingForManager(req, res) {
    const pagination = validate(paginationSchema, req.query);
    const result = await travelService.listPendingForManager({
      managerId: req.user._id,
      pagination,
    });

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
    const result = await travelService.getById({
      id: req.params.id,
      actor: req.user,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}

module.exports = new TravelController();
