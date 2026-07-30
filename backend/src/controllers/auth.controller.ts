import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    return ApiResponse.created(res, 'User registered successfully', result);
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    return ApiResponse.success(res, 'Login successful', result);
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    return ApiResponse.success(res, 'Token refreshed successfully', result);
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await AuthService.logout(req.user!.userId, refreshToken);
    return ApiResponse.success(res, 'Logout successful');
  });

  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user!.userId, currentPassword, newPassword);
    return ApiResponse.success(res, 'Password changed successfully');
  });

  static getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = await AuthService.getMe(req.user!.userId);
    return ApiResponse.success(res, 'User details retrieved', user);
  });

  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await AuthService.updateProfile(req.user!.userId, req.body);
    return ApiResponse.success(res, 'Profile updated', user);
  });
}
