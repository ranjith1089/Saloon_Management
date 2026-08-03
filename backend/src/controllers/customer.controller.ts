import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ForbiddenError } from '../utils/ApiError';
import { isCustomer } from '../utils/scope';

export class CustomerController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    if (isCustomer(req)) throw new ForbiddenError('Not allowed');
    const customer = await CustomerService.create(req.body);
    return ApiResponse.created(res, 'Customer created', customer);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    if (isCustomer(req)) throw new ForbiddenError('Not allowed');
    const { customers, total, page, limit } = await CustomerService.findAll(req.query);
    return ApiResponse.paginated(res, 'Customers retrieved', customers, page, limit, total);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    // A CUSTOMER may only fetch their own record.
    if (isCustomer(req) && req.params.id !== req.user!.userId) {
      throw new ForbiddenError('Not allowed');
    }
    const customer = await CustomerService.findById(req.params.id);
    return ApiResponse.success(res, 'Customer retrieved', customer);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    if (isCustomer(req) && req.params.id !== req.user!.userId) {
      throw new ForbiddenError('Not allowed');
    }
    const customer = await CustomerService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Customer updated', customer);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    if (isCustomer(req)) throw new ForbiddenError('Not allowed');
    await CustomerService.delete(req.params.id);
    return ApiResponse.success(res, 'Customer deleted');
  });

  static getHistory = asyncHandler(async (req: Request, res: Response) => {
    if (isCustomer(req) && req.params.id !== req.user!.userId) {
      throw new ForbiddenError('Not allowed');
    }
    const history = await CustomerService.getHistory(req.params.id);
    return ApiResponse.success(res, 'Customer history retrieved', history);
  });
}
