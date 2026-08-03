import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class BookingController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const booking = await BookingService.create(req.body);
    return ApiResponse.created(res, 'Booking created', booking);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const { bookings, total, page, limit } = await BookingService.findAll(req.query);
    return ApiResponse.paginated(res, 'Bookings retrieved', bookings, page, limit, total);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const booking = await BookingService.findById(req.params.id);
    return ApiResponse.success(res, 'Booking retrieved', booking);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const booking = await BookingService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Booking updated', booking);
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status, cancelReason } = req.body;
    const booking = await BookingService.updateStatus(req.params.id, status, cancelReason);
    return ApiResponse.success(res, 'Booking status updated', booking);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await BookingService.delete(req.params.id);
    return ApiResponse.success(res, 'Booking deleted');
  });

  static collectPayment = asyncHandler(async (req: Request, res: Response) => {
    const booking = await BookingService.collectPayment(req.params.id, req.body);
    return ApiResponse.success(res, 'Payment recorded', booking);
  });

  static getCalendar = asyncHandler(async (req: Request, res: Response) => {
    const bookings = await BookingService.getCalendar(req.query);
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
