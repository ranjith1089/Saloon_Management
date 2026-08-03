import { Request, Response } from 'express';
import { TaxService, EarningService, PayoutService } from '../services/finance.service';
import { CommissionService } from '../services/commission.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ForbiddenError } from '../utils/ApiError';
import { earningListScope, payoutListScope, isCustomer, requireAdminManager, getStaffIdForUser } from '../utils/scope';

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

  static getDefault = asyncHandler(async (_req: Request, res: Response) => {
    const t = await TaxService.getDefault();
    return ApiResponse.success(res, 'Default tax', t);
  });
}

export class EarningController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    requireAdminManager(req);
    const earning = await EarningService.create(req.body.bookingId);
    return ApiResponse.created(res, 'Earning created', earning);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const scope = await earningListScope(req);
    const result = await EarningService.findAll(req.query, scope);
    return ApiResponse.success(res, 'Earnings retrieved', result);
  });

  static getStaffEarnings = asyncHandler(async (req: Request, res: Response) => {
    // STAFF may only look up their own earnings by :staffId; admins can look up anyone.
    if (!req.user) throw new ForbiddenError('Not authenticated');
    if (req.user.role === 'STAFF') {
      const ownStaffId = await getStaffIdForUser(req);
      if (req.params.staffId !== ownStaffId) throw new ForbiddenError('Not your earnings');
    } else if (req.user.role === 'CUSTOMER') {
      throw new ForbiddenError('Not allowed');
    }
    const result = await EarningService.getStaffEarnings(req.params.staffId, req.query);
    return ApiResponse.success(res, 'Staff earnings retrieved', result);
  });
}

export class PayoutController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    requireAdminManager(req);
    const payout = await PayoutService.create(req.body);
    return ApiResponse.created(res, 'Payout created', payout);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const scope = await payoutListScope(req);
    const result = await PayoutService.findAll(req.query, scope);
    return ApiResponse.success(res, 'Payouts retrieved', result);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    if (isCustomer(req)) throw new ForbiddenError('Not allowed');
    const payout = await PayoutService.findById(req.params.id);
    // STAFF can only view own payouts.
    if (req.user?.role === 'STAFF') {
      const ownStaffId = await getStaffIdForUser(req);
      if (payout.staffId !== ownStaffId) throw new ForbiddenError('Not your payout');
    }
    return ApiResponse.success(res, 'Payout retrieved', payout);
  });

  static markAsPaid = asyncHandler(async (req: Request, res: Response) => {
    requireAdminManager(req);
    const payout = await PayoutService.markAsPaid(req.params.id, req.body.reference);
    return ApiResponse.success(res, 'Payout marked as paid', payout);
  });

  static cancel = asyncHandler(async (req: Request, res: Response) => {
    requireAdminManager(req);
    const payout = await PayoutService.cancel(req.params.id);
    return ApiResponse.success(res, 'Payout cancelled', payout);
  });
}

export class CommissionController {
  static summary = asyncHandler(async (req: Request, res: Response) => {
    requireAdminManager(req);
    const now = new Date();
    const year = parseInt((req.query.year as string) || String(now.getUTCFullYear()), 10);
    const month = parseInt((req.query.month as string) || String(now.getUTCMonth() + 1), 10);
    const branchId = (req.query.branchId as string) || undefined;
    const summaries = await CommissionService.monthlySummaryForAll(year, month, branchId);
    return ApiResponse.success(res, 'Monthly commission summary', {
      year, month, branchId: branchId || null, summaries,
    });
  });

  static staffSummary = asyncHandler(async (req: Request, res: Response) => {
    // STAFF may only look up their own; ADMIN/MANAGER may look up anyone.
    if (!req.user) throw new ForbiddenError('Not authenticated');
    if (req.user.role === 'STAFF') {
      const ownStaffId = await getStaffIdForUser(req);
      if (req.params.staffId !== ownStaffId) throw new ForbiddenError('Not your commission');
    } else if (req.user.role === 'CUSTOMER') {
      throw new ForbiddenError('Not allowed');
    }
    const now = new Date();
    const year = parseInt((req.query.year as string) || String(now.getUTCFullYear()), 10);
    const month = parseInt((req.query.month as string) || String(now.getUTCMonth() + 1), 10);
    const summary = await CommissionService.monthlySummaryForStaff(req.params.staffId, year, month);
    return ApiResponse.success(res, 'Staff monthly commission', summary);
  });
}
