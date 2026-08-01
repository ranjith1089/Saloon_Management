import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(`${err.message}`, {
    name: err.name,
    method: req.method,
    url: req.url,
    stack: err.stack,
  });

  // Handle Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? (err.meta?.target as string[]).join(', ') : err.meta?.target;
      return res.status(409).json({
        success: false,
        message: target ? `A record with this ${target} already exists` : 'A record with this value already exists',
        field: err.meta?.target,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: `Foreign key constraint failed on ${err.meta?.field_name || 'a related record'}`,
      });
    }
    if (err.code === 'P2000') {
      return res.status(400).json({
        success: false,
        message: `Value too long for column ${err.meta?.column_name || ''}`.trim(),
      });
    }
    // Any other known Prisma error — surface the code so we can diagnose from the response.
    return res.status(400).json({
      success: false,
      message: `Database error (${err.code}): ${err.message.split('\n').pop()?.trim() || err.message}`,
    });
  }

  // Bad data shape / unknown fields / type mismatch (e.g. sending a string for a Decimal column).
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data sent to database',
      detail: err.message.split('\n').slice(-3).join(' ').trim(),
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: (err as any).errors,
    });
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Fallback — include the message so we can actually see what went wrong in the client.
  // For an internal admin app this is the right trade-off; tighten if you ever expose this API publicly.
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    detail: err.message,
  });
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
