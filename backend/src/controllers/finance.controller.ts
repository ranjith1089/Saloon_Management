import { Request, Response } from 'express';
import { TaxService, EarningService, PayoutService } from '../services/finance.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class TaxController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const tax = await TaxService.create(req.body);
    return ApiResponse.created(res, 'Tax created', tax);
  });

  static findAll = asyncHandler(async (_req: Request, res: Response) => {
    const taxes = await TaxService.findAll();
    return ApiResponse.success(res, 'Taxes retrieved', taxes);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const tax = await TaxService.findById(req.params.id);
    return ApiResponse.success(res, 'Tax retrieved', tax);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const tax = await TaxService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Tax updated', tax);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await TaxService.delete(req.params.id);
    return ApiResponse.success(res, 'Tax deleted');
  });
}

export class EarningController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const earning = await EarningService.create(req.body.bookingId);
    return ApiResponse.created(res, 'Earning created', earning);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await EarningService.findAll(req.query);
    return ApiResponse.success(res, 'Earnings retrieved', result);
  });

  static getStaffEarnings = asyncHandler(async (req: Request, res: Response) => {
    const result = await EarningService.getStaffEarnings(req.params.staffId, req.query);
    return ApiResponse.success(res, 'Staff earnings retrieved', result);
  });
}

export class PayoutController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const payout = await PayoutService.create(req.body);
    return ApiResponse.created(res, 'Payout created', payout);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await PayoutService.findAll(req.query);
    return ApiResponse.success(res, 'Payouts retrieved', result);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const payout = await PayoutService.findById(req.params.id);
    return ApiResponse.success(res, 'Payout retrieved', payout);
  });

  static markAsPaid = asyncHandler(async (req: Request, res: Response) => {
    const payout = await PayoutService.markAsPaid(req.params.id, req.body.reference);
    return ApiResponse.success(res, 'Payout marked as paid', payout);
  });

  static cancel = asyncHandler(async (req: Request, res: Response) => {
    const payout = await PayoutService.cancel(req.params.id);
    return ApiResponse.success(res, 'Payout cancelled', payout);
  });
}
