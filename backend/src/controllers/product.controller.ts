import { Request, Response } from 'express';
import {
  ProductCategoryService,
  ProductService,
  ProductSaleService,
} from '../services/product.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class ProductCategoryController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const c = await ProductCategoryService.create(req.body);
    return ApiResponse.created(res, 'Category created', c);
  });
  static findAll = asyncHandler(async (_req: Request, res: Response) => {
    const list = await ProductCategoryService.findAll();
    return ApiResponse.success(res, 'Categories retrieved', list);
  });
  static findById = asyncHandler(async (req: Request, res: Response) => {
    const c = await ProductCategoryService.findById(req.params.id);
    return ApiResponse.success(res, 'Category retrieved', c);
  });
  static update = asyncHandler(async (req: Request, res: Response) => {
    const c = await ProductCategoryService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Category updated', c);
  });
  static delete = asyncHandler(async (req: Request, res: Response) => {
    await ProductCategoryService.delete(req.params.id);
    return ApiResponse.success(res, 'Category deleted');
  });
}

export class ProductController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const p = await ProductService.create(req.body);
    return ApiResponse.created(res, 'Product created', p);
  });
  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const { products, total, page, limit } = await ProductService.findAll(req.query);
    return ApiResponse.paginated(res, 'Products retrieved', products, page, limit, total);
  });
  static findById = asyncHandler(async (req: Request, res: Response) => {
    const p = await ProductService.findById(req.params.id);
    return ApiResponse.success(res, 'Product retrieved', p);
  });
  static update = asyncHandler(async (req: Request, res: Response) => {
    const p = await ProductService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Product updated', p);
  });
  static delete = asyncHandler(async (req: Request, res: Response) => {
    await ProductService.delete(req.params.id);
    return ApiResponse.success(res, 'Product deactivated');
  });
  static lowStock = asyncHandler(async (req: Request, res: Response) => {
    const list = await ProductService.getLowStock(req.query);
    return ApiResponse.success(res, 'Low-stock products', list);
  });
  static expiring = asyncHandler(async (req: Request, res: Response) => {
    const list = await ProductService.getExpiring(req.query);
    return ApiResponse.success(res, 'Expiring products', list);
  });
}

export class ProductSaleController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const sale = await ProductSaleService.create(req.body);
    return ApiResponse.created(res, 'Sale recorded', sale);
  });
  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const { sales, total, page, limit, totalRevenue } = await ProductSaleService.findAll(req.query);
    return ApiResponse.success(res, 'Sales retrieved', sales, 200, {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      totalRevenue,
    });
  });
  static findById = asyncHandler(async (req: Request, res: Response) => {
    const s = await ProductSaleService.findById(req.params.id);
    return ApiResponse.success(res, 'Sale retrieved', s);
  });
  static void = asyncHandler(async (req: Request, res: Response) => {
    const s = await ProductSaleService.voidSale(req.params.id, req.body.reason);
    return ApiResponse.success(res, 'Sale voided', s);
  });
}
