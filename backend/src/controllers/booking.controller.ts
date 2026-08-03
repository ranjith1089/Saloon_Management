import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ForbiddenError, BadRequestError } from '../utils/ApiError';
import {
  bookingListScope,
  assertBookingAccess,
  isCustomer,
} from '../utils/scope';

export class BookingController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    // CUSTOMER can only book for themselves. Force customerId to their own userId,
    // ignoring anything else the client tried to send.
    const body = isCustomer(req)
      ? { ...req.body, customerId: req.user!.userId }
      : req.body;
    const booking = await BookingService.create(body);
    return ApiResponse.created(res, 'Booking created', booking);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const scope = await bookingListScope(req);
    const { bookings, total, page, limit } = await BookingService.findAll(req.query, scope);
    return ApiResponse.paginated(res, 'Bookings retrieved', bookings, page, limit, total);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const booking = await BookingService.findById(req.params.id);
    await assertBookingAccess(req, booking);
    return ApiResponse.success(res, 'Booking retrieved', booking);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    if (isCustomer(req)) throw new ForbiddenError('Customers cannot edit bookings');
    const booking = await BookingService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Booking updated', booking);
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status, cancelReason } = req.body;
    // CUSTOMER can only cancel their own booking, and only outside a 2h window.
    if (isCustomer(req)) {
      const existing = await BookingService.findById(req.params.id);
      await assertBookingAccess(req, existing);
      if (status !== 'CANCELLED') {
        throw new ForbiddenError('Customers can only cancel their bookings');
      }
      const start = combineDateAndTime(existing.bookingDate, existing.startTime);
      const hoursUntil = (start.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 2) {
        throw new BadRequestError('Bookings can only be cancelled at least 2 hours before start time');
      }
    }
    const booking = await BookingService.updateStatus(req.params.id, status, cancelReason);
    return ApiResponse.success(res, 'Booking status updated', booking);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    if (isCustomer(req)) throw new ForbiddenError('Customers cannot delete bookings');
    await BookingService.delete(req.params.id);
    return ApiResponse.success(res, 'Booking deleted');
  });

  static collectPayment = asyncHandler(async (req: Request, res: Response) => {
    if (isCustomer(req)) throw new ForbiddenError('Customers cannot collect payments');
    const booking = await BookingService.collectPayment(req.params.id, req.body);
    return ApiResponse.success(res, 'Payment recorded', booking);
  });

  static quickSale = asyncHandler(async (req: Request, res: Response) => {
    if (isCustomer(req)) throw new ForbiddenError('Not allowed');
    const booking = await BookingService.quickSale(req.body);
    return ApiResponse.created(res, 'Sale recorded', booking);
  });

  static getCalendar = asyncHandler(async (req: Request, res: Response) => {
    const scope = await bookingListScope(req);
    const bookings = await BookingService.getCalendar(req.query, scope);
    return ApiResponse.success(res, 'Calendar retrieved', bookings);
  });

  static getAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
    const { staffId, date, serviceId } = req.query;
    const slots = await BookingService.getAvailableSlots(
      staffId as string,
      date as string,
      serviceId as string
    );
    return ApiResponse.success(res, 'Available slots retrieved', slots);
  });
}

/**
 * Combine a date-only column with an "HH:mm" string into a real Date.
 * Booking.startTime is stored as a text like "14:30".
 */
function combineDateAndTime(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}
