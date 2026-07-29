import { Request, Response } from 'express';
import { StaffService } from '../services/staff.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class StaffController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const staff = await StaffService.create(req.body);
    return ApiResponse.created(res, 'Staff created', staff);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const { staff, total, page, limit } = await StaffService.findAll(req.query);
    return ApiResponse.paginated(res, 'Staff retrieved', staff, page, limit, total);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const staff = await StaffService.findById(req.params.id);
    return ApiResponse.success(res, 'Staff retrieved', staff);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const staff = await StaffService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Staff updated', staff);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await StaffService.delete(req.params.id);
    return ApiResponse.success(res, 'Staff deleted');
  });

  static verify = asyncHandler(async (req: Request, res: Response) => {
    const staff = await StaffService.verify(req.params.id);
    return ApiResponse.success(res, 'Staff verified', staff);
  });

  static setSchedule = asyncHandler(async (req: Request, res: Response) => {
    const schedules = await StaffService.setSchedule(req.params.id, req.body.schedules);
    return ApiResponse.success(res, 'Schedule updated', schedules);
  });
}
