import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class DashboardController {
  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await DashboardService.getStats(req.query);
    return ApiResponse.success(res, 'Dashboard stats retrieved', stats);
  });

  static getRevenueChart = asyncHandler(async (req: Request, res: Response) => {
    const chart = await DashboardService.getRevenueChart(req.query);
    return ApiResponse.success(res, 'Revenue chart retrieved', chart);
  });
}
