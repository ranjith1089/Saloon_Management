import { Request, Response } from 'express';
import { ReferralService } from '../services/referral.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ForbiddenError, UnauthorizedError } from '../utils/ApiError';

export class ReferralController {
  // GET /referrals/me — caller's own share code + list
  static me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const data = await ReferralService.myOverview(req.user.userId);
    return ApiResponse.success(res, 'Your referrals', data);
  });

  // GET /referrals — admin/manager list of every referral
  static list = asyncHandler(async (req: Request, res: Response) => {
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'MANAGER') throw new ForbiddenError('Not allowed');
    const rows = await ReferralService.findAll(req.query);
    return ApiResponse.success(res, 'Referrals', rows);
  });
}
