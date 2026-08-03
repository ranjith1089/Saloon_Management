import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getStaffIdForUser, isAdminOrManager, isCustomer, isStaff } from '../utils/scope';
import { ForbiddenError } from '../utils/ApiError';

export class DashboardController {
  static getStats = asyncHandler(async (req: Request, res: Response) => {
    if (isCustomer(req)) throw new ForbiddenError('Not allowed');
    const stats = await DashboardService.getStats(req.query);
    return ApiResponse.success(res, 'Dashboard stats retrieved', stats);
  });

  static getRevenueChart = asyncHandler(async (req: Request, res: Response) => {
    if (isCustomer(req)) throw new ForbiddenError('Not allowed');
    const chart = await DashboardService.getRevenueChart(req.query);
    return ApiResponse.success(res, 'Revenue chart retrieved', chart);
  });

  static getHome = asyncHandler(async (req: Request, res: Response) => {
    if (isAdminOrManager(req)) {
      const stats = await DashboardService.getStats(req.query);
      return ApiResponse.success(res, 'Dashboard', { role: req.user?.role, ...stats });
    }
    if (isStaff(req)) {
      const staffId = await getStaffIdForUser(req);
      if (!staffId) throw new ForbiddenError('No staff profile linked');
      const home = await DashboardService.getStaffHome(staffId);
      return ApiResponse.success(res, 'Dashboard', { role: 'STAFF', ...home });
    }
    if (isCustomer(req)) {
      const home = await DashboardService.getCustomerHome(req.user!.userId);
      return ApiResponse.success(res, 'Dashboard', { role: 'CUSTOMER', ...home });
    }
    throw new ForbiddenError('Not allowed');
  });
}
