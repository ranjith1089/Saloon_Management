import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class ReportController {
  static dailyBookings = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.dailyBookings(req.query);
    return ApiResponse.success(res, 'Daily bookings report', report);
  });

  static overallBookings = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.overallBookings(req.query);
    return ApiResponse.success(res, 'Overall bookings report', report);
  });

  static staffPayoutReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.staffPayoutReport(req.query);
    return ApiResponse.success(res, 'Staff payout report', report);
  });

  static staffServiceReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.staffServiceReport(req.query);
    return ApiResponse.success(res, 'Staff service report', report);
  });

  static productSalesReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.productSalesReport(req.query);
    return ApiResponse.success(res, 'Product sales report', report);
  });
}
