import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ForbiddenError } from '../utils/ApiError';
import { isCustomer } from '../utils/scope';

export class ReviewController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const review = await ReviewService.create(req.user!.userId, req.body);
    return ApiResponse.created(res, 'Review submitted', review);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    // CUSTOMER only sees their own reviews (not the whole gallery).
    const query = isCustomer(req)
      ? { ...req.query, customerId: req.user!.userId }
      : req.query;
    const result = await ReviewService.findAll(query);
    return ApiResponse.success(res, 'Reviews retrieved', result);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const review = await ReviewService.findById(req.params.id);
    if (isCustomer(req) && (review as any).customerId !== req.user!.userId) {
      throw new ForbiddenError('Not your review');
    }
    return ApiResponse.success(res, 'Review retrieved', review);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const existing = await ReviewService.findById(req.params.id);
    if (isCustomer(req) && (existing as any).customerId !== req.user!.userId) {
      throw new ForbiddenError('Not your review');
    }
    const review = await ReviewService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Review updated', review);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const existing = await ReviewService.findById(req.params.id);
    if (isCustomer(req) && (existing as any).customerId !== req.user!.userId) {
      throw new ForbiddenError('Not your review');
    }
    await ReviewService.delete(req.params.id);
    return ApiResponse.success(res, 'Review deleted');
  });

  static getStaffRating = asyncHandler(async (req: Request, res: Response) => {
    const rating = await ReviewService.getStaffRating(req.params.staffId);
    return ApiResponse.success(res, 'Staff rating retrieved', rating);
  });
}
