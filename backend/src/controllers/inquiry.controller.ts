import { Request, Response } from 'express';
import { InquiryService } from '../services/inquiry.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class InquiryController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const i = await InquiryService.create(req.body);
    return ApiResponse.created(res, 'Inquiry submitted', i);
  });

  static findAll = asyncHandler(async (req: Request, res: Response) => {
    const { inquiries, total, page, limit, newCount } = await InquiryService.findAll(req.query);
    return ApiResponse.success(res, 'Inquiries', inquiries, 200, {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      newCount,
    });
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const i = await InquiryService.findById(req.params.id);
    return ApiResponse.success(res, 'Inquiry', i);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const i = await InquiryService.update(req.params.id, req.body, req.user?.userId);
    return ApiResponse.success(res, 'Inquiry updated', i);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await InquiryService.delete(req.params.id);
    return ApiResponse.success(res, 'Inquiry deleted');
  });
}
