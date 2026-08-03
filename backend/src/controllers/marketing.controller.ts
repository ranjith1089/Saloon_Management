import { Request, Response } from 'express';
import { MarketingService } from '../services/marketing.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class MarketingController {
  static rebookDue = asyncHandler(async (req: Request, res: Response) => {
    const min = parseInt((req.query.minDays as string) || '30', 10);
    const max = parseInt((req.query.maxDays as string) || '89', 10);
    const rows = await MarketingService.rebookDue(min, max);
    return ApiResponse.success(res, 'Rebook due', rows);
  });

  static winBack = asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt((req.query.days as string) || '90', 10);
    const rows = await MarketingService.winBack(days);
    return ApiResponse.success(res, 'Lapsed customers', rows);
  });

  static birthdays = asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt((req.query.days as string) || '7', 10);
    const rows = await MarketingService.birthdaysThisWeek(days);
    return ApiResponse.success(res, 'Upcoming birthdays', rows);
  });
}
