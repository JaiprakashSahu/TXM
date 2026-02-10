const notificationService = require('../services/notification.service');
const { BadRequestError } = require('../utils/errors');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

class NotificationController {
  async listMy(req, res) {
    const page = Math.max(parseInt(req.query.page, 10) || DEFAULT_PAGE, 1);
    let limit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
    if (limit < 1 || limit > MAX_LIMIT) {
      throw new BadRequestError(`limit must be between 1 and ${MAX_LIMIT}`);
    }

    const result = await notificationService.listMy({
      userId: req.user._id,
      pagination: { page, limit },
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
}

module.exports = new NotificationController();
