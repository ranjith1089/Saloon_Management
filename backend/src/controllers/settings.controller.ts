import { Request, Response } from 'express';
import { SettingsService, HolidayService, PaymentMethodService } from '../services/settings.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

// ============ SETTINGS (generic) ============
export class SettingsController {
  static getBranding = asyncHandler(async (_req: Request, res: Response) => {
    const data = await SettingsService.getByType('BRANDING');
    return ApiResponse.success(res, 'Branding settings retrieved', data);
  });

  static updateBranding = asyncHandler(async (req: Request, res: Response) => {
    const data = await SettingsService.upsertMany('BRANDING', req.body);
    return ApiResponse.success(res, 'Branding updated', data);
  });

  static getCurrency = asyncHandler(async (_req: Request, res: Response) => {
    const data = await SettingsService.getByType('CURRENCY');
    return ApiResponse.success(res, 'Currency settings retrieved', data);
  });

  static updateCurrency = asyncHandler(async (req: Request, res: Response) => {
    const data = await SettingsService.upsertMany('CURRENCY', req.body);
    return ApiResponse.success(res, 'Currency updated', data);
  });

  static getBusiness = asyncHandler(async (_req: Request, res: Response) => {
    const data = await SettingsService.getByType('BUSINESS');
    return ApiResponse.success(res, 'Business settings retrieved', data);
  });

  static updateBusiness = asyncHandler(async (req: Request, res: Response) => {
    const data = await SettingsService.upsertMany('BUSINESS', req.body);
    return ApiResponse.success(res, 'Business updated', data);
  });
}

// ============ HOLIDAYS ============
export class HolidayController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const h = await HolidayService.create(req.body);
    return ApiResponse.created(res, 'Holiday created', h);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const list = await HolidayService.findAll(req.query);
    return ApiResponse.success(res, 'Holidays retrieved', list);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const h = await HolidayService.findById(req.params.id);
    return ApiResponse.success(res, 'Holiday retrieved', h);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const h = await HolidayService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Holiday updated', h);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await HolidayService.delete(req.params.id);
    return ApiResponse.success(res, 'Holiday deleted');
  });

  static bulkCreate = asyncHandler(async (req: Request, res: Response) => {
    const result = await HolidayService.bulkCreate(req.body.holidays);
    return ApiResponse.created(res, `${result.count} holidays created`, result);
  });
}

// ============ PAYMENT METHODS ============
export class PaymentMethodController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const m = await PaymentMethodService.create(req.body);
    return ApiResponse.created(res, 'Payment method created', m);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const list = await PaymentMethodService.findAll(req.query);
    return ApiResponse.success(res, 'Payment methods retrieved', list);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const m = await PaymentMethodService.findById(req.params.id);
    return ApiResponse.success(res, 'Payment method retrieved', m);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const m = await PaymentMethodService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Payment method updated', m);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await PaymentMethodService.delete(req.params.id);
    return ApiResponse.success(res, 'Payment method deleted');
  });

  static reorder = asyncHandler(async (req: Request, res: Response) => {
    const list = await PaymentMethodService.reorder(req.body.orderedIds);
    return ApiResponse.success(res, 'Order updated', list);
  });
}
