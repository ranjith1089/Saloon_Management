import { Request, Response } from 'express';
import { CouponService } from '../services/coupon.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class CouponController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const coupon = await CouponService.create(req.body);
    return ApiResponse.created(res, 'Coupon created', coupon);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const { coupons, total, page, limit } = await CouponService.findAll(req.query);
    return ApiResponse.paginated(res, 'Coupons retrieved', coupons, page, limit, total);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const coupon = await CouponService.findById(req.params.id);
    return ApiResponse.success(res, 'Coupon retrieved', coupon);
  });

  static validate = asyncHandler(async (req: Request, res: Response) => {
    const { code, orderAmount } = req.body;
    const result = await CouponService.validate(code, orderAmount, req.user?.userId);
    return ApiResponse.success(res, 'Coupon is valid', result);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const coupon = await CouponService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Coupon updated', coupon);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await CouponService.delete(req.params.id);
    return ApiResponse.success(res, 'Coupon deleted');
  });
}
