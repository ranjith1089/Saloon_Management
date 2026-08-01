import { Request, Response } from 'express';
import { MembershipPlanService, MembershipService } from '../services/membership.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class MembershipPlanController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const p = await MembershipPlanService.create(req.body);
    return ApiResponse.created(res, 'Plan created', p);
  });
  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const list = await MembershipPlanService.findAll(req.query);
    return ApiResponse.success(res, 'Plans retrieved', list);
  });
  static findById = asyncHandler(async (req: Request, res: Response) => {
    const p = await MembershipPlanService.findById(req.params.id);
    return ApiResponse.success(res, 'Plan retrieved', p);
  });
  static update = asyncHandler(async (req: Request, res: Response) => {
    const p = await MembershipPlanService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Plan updated', p);
  });
  static delete = asyncHandler(async (req: Request, res: Response) => {
    await MembershipPlanService.delete(req.params.id);
    return ApiResponse.success(res, 'Plan deactivated');
  });
}

export class MembershipController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const m = await MembershipService.create(req.body);
    return ApiResponse.created(res, 'Membership created', m);
  });
  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const { memberships, total, page, limit, totalRevenue } = await MembershipService.findAll(req.query);
    return ApiResponse.success(res, 'Memberships retrieved', memberships, 200, {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      totalRevenue,
    });
  });
  static findById = asyncHandler(async (req: Request, res: Response) => {
    const m = await MembershipService.findById(req.params.id);
    return ApiResponse.success(res, 'Membership retrieved', m);
  });
  static update = asyncHandler(async (req: Request, res: Response) => {
    const m = await MembershipService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Membership updated', m);
  });
  static cancel = asyncHandler(async (req: Request, res: Response) => {
    const m = await MembershipService.cancel(req.params.id);
    return ApiResponse.success(res, 'Membership cancelled', m);
  });
  static active = asyncHandler(async (req: Request, res: Response) => {
    const m = await MembershipService.getActiveForCustomer(req.params.customerId);
    return ApiResponse.success(res, m ? 'Active membership' : 'No active membership', m);
  });
}
