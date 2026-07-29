import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class CustomerController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const customer = await CustomerService.create(req.body);
    return ApiResponse.created(res, 'Customer created', customer);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const { customers, total, page, limit } = await CustomerService.findAll(req.query);
    return ApiResponse.paginated(res, 'Customers retrieved', customers, page, limit, total);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const customer = await CustomerService.findById(req.params.id);
    return ApiResponse.success(res, 'Customer retrieved', customer);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const customer = await CustomerService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Customer updated', customer);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await CustomerService.delete(req.params.id);
    return ApiResponse.success(res, 'Customer deleted');
  });

  static getHistory = asyncHandler(async (req: Request, res: Response) => {
    const history = await CustomerService.getHistory(req.params.id);
    return ApiResponse.success(res, 'Customer history retrieved', history);
  });
}
