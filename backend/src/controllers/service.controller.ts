import { Request, Response } from 'express';
import { ServiceService, ServiceCategoryService } from '../services/service.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class ServiceCategoryController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const category = await ServiceCategoryService.create(req.body);
    return ApiResponse.created(res, 'Category created', category);
  });

  static findAll = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await ServiceCategoryService.findAll();
    return ApiResponse.success(res, 'Categories retrieved', categories);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const category = await ServiceCategoryService.findById(req.params.id);
    return ApiResponse.success(res, 'Category retrieved', category);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const category = await ServiceCategoryService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Category updated', category);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await ServiceCategoryService.delete(req.params.id);
    return ApiResponse.success(res, 'Category deleted');
  });
}

export class ServiceController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.create(req.body);
    return ApiResponse.created(res, 'Service created', service);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const { services, total, page, limit } = await ServiceService.findAll(req.query);
    return ApiResponse.paginated(res, 'Services retrieved', services, page, limit, total);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.findById(req.params.id);
    return ApiResponse.success(res, 'Service retrieved', service);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Service updated', service);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await ServiceService.delete(req.params.id);
    return ApiResponse.success(res, 'Service deleted');
  });
}
