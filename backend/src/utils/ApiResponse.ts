import { Response } from 'express';

interface ApiResponseData {
  success: boolean;
  message: string;
  data?: any;
  meta?: any;
}

export class ApiResponse {
  static success(res: Response, message: string, data?: any, statusCode = 200, meta?: any) {
    const response: ApiResponseData = {
      success: true,
      message,
    };
    if (data !== undefined) response.data = data;
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  }

  static created(res: Response, message: string, data?: any) {
    return this.success(res, message, data, 201);
  }

  static error(res: Response, message: string, statusCode = 500, errors?: any) {
    const response: any = {
      success: false,
      message,
    };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  static paginated(res: Response, message: string, data: any[], page: number, limit: number, total: number) {
    return this.success(res, message, data, 200, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
}
