import { Request, Response } from 'express';
import { BranchService } from '../services/branch.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class BranchController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const branch = await BranchService.create(req.body);
    return ApiResponse.created(res, 'Branch created successfully', branch);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const { branches, total, page, limit } = await BranchService.findAll(req.query);
    return ApiResponse.paginated(res, 'Branches retrieved successfully', branches, page, limit, total);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const branch = await BranchService.findById(req.params.id);
    return ApiResponse.success(res, 'Branch retrieved successfully', branch);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const branch = await BranchService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Branch updated successfully', branch);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await BranchService.delete(req.params.id);
    return ApiResponse.success(res, 'Branch deleted successfully');
  });

  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await BranchService.getStats(req.params.id);
    return ApiResponse.success(res, 'Branch statistics retrieved', stats);
  });
}
