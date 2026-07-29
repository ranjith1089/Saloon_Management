import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class ReviewController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const review = await ReviewService.create(req.user!.userId, req.body);
    return ApiResponse.created(res, 'Review submitted', review);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await ReviewService.findAll(req.query);
    return ApiResponse.success(res, 'Reviews retrieved', result);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const review = await ReviewService.findById(req.params.id);
    return ApiResponse.success(res, 'Review retrieved', review);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const review = await ReviewService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Review updated', review);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await ReviewService.delete(req.params.id);
    return ApiResponse.success(res, 'Review deleted');
  });

  static getStaffRating = asyncHandler(async (req: Request, res: Response) => {
    const rating = await ReviewService.getStaffRating(req.params.staffId);
    return ApiResponse.success(res, 'Staff rating retrieved', rating);
  });
}
