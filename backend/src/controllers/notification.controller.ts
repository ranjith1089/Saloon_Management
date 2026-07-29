import { Request, Response } from 'express';
import { NotificationService, NotificationTemplateService } from '../services/notification.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class NotificationController {
  static findMine = asyncHandler(async (req: Request, res: Response) => {
    const result = await NotificationService.findByUser(req.user!.userId, req.query);
    return ApiResponse.success(res, 'Notifications retrieved', result);
  });

  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const notification = await NotificationService.markAsRead(req.params.id, req.user!.userId);
    return ApiResponse.success(res, 'Marked as read', notification);
  });

  static markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    await NotificationService.markAllAsRead(req.user!.userId);
    return ApiResponse.success(res, 'All notifications marked as read');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await NotificationService.delete(req.params.id, req.user!.userId);
    return ApiResponse.success(res, 'Notification deleted');
  });
}

export class NotificationTemplateController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const template = await NotificationTemplateService.create(req.body);
    return ApiResponse.created(res, 'Template created', template);
  });

  static findAll = asyncHandler(async (_req: Request, res: Response) => {
    const templates = await NotificationTemplateService.findAll();
    return ApiResponse.success(res, 'Templates retrieved', templates);
  });

  static findById = asyncHandler(async (req: Request, res: Response) => {
    const template = await NotificationTemplateService.findById(req.params.id);
    return ApiResponse.success(res, 'Template retrieved', template);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const template = await NotificationTemplateService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Template updated', template);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await NotificationTemplateService.delete(req.params.id);
    return ApiResponse.success(res, 'Template deleted');
  });
}
