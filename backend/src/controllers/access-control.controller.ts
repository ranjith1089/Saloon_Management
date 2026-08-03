import { Request, Response } from 'express';
import { AccessControlService } from '../services/access-control.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class AccessControlController {
  /** Return the current user's role + effective permission keys. */
  static me = asyncHandler(async (req: Request, res: Response) => {
    const role = req.user?.role as any;
    if (!role) return ApiResponse.success(res, 'No role', { role: null, permissions: [] });
    const matrix = await AccessControlService.getMatrix();
    const permissions = matrix.permissions
      .filter((p) => p.grantedTo.includes(role))
      .map((p) => p.key);
    return ApiResponse.success(res, 'Effective permissions', { role, permissions });
  });

  static matrix = asyncHandler(async (_req: Request, res: Response) => {
    const m = await AccessControlService.getMatrix();
    return ApiResponse.success(res, 'Permission matrix', m);
  });

  static setMatrix = asyncHandler(async (req: Request, res: Response) => {
    const items = req.body?.items;
    if (!Array.isArray(items)) {
      return ApiResponse.error(res, 'items[] required', 400);
    }
    const m = await AccessControlService.setMatrix(items);
    return ApiResponse.success(res, 'Matrix updated', m);
  });
}
