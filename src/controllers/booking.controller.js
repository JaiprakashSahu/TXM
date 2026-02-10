const bookingService = require('../services/booking.service');
const {
  createBookingSchema,
  bookingPaginationSchema,
} = require('../validators/booking.validator');
const { BadRequestError } = require('../utils/errors');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    throw new BadRequestError(error.details.map((d) => d.message).join(', '));
  }
  return value;
}

class BookingController {
  async create(req, res) {
    const data = validate(createBookingSchema, req.body);
    const idempotencyKey = req.headers['idempotency-key'];

    const result = await bookingService.create({
      data,
      idempotencyKey,
      actor: req.user,
    });

    const statusCode = result.status === 'confirmed' ? 201 : 200;
    const message =
      result.status === 'confirmed'
        ? 'Booking confirmed'
        : result.status === 'failed'
          ? 'Booking attempt failed — retry with same Idempotency-Key'
          : `Booking status: ${result.status}`;

    res.status(statusCode).json({
      success: result.status === 'confirmed',
      message,
      data: result,
    });
  }

  async cancel(req, res) {
    const result = await bookingService.cancel({
      id: req.params.id,
      actor: req.user,
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled',
      data: result,
    });
  }

  async listMy(req, res) {
    const pagination = validate(bookingPaginationSchema, req.query);
    const result = await bookingService.listMy({
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

  async getById(req, res) {
    const result = await bookingService.getById({
      id: req.params.id,
      actor: req.user,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  async getFlightOptions(_req, res) {
    const flights = bookingService.getFlightOptions();
    res.status(200).json({ success: true, data: flights });
  }

  async getHotelOptions(_req, res) {
    const hotels = bookingService.getHotelOptions();
    res.status(200).json({ success: true, data: hotels });
  }
}

module.exports = new BookingController();
