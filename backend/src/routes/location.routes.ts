import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize } from '../middlewares/auth';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

// Countries
router.get('/countries', asyncHandler(async (_req: Request, res: Response) => {
  const countries = await prisma.country.findMany({ orderBy: { name: 'asc' } });
  return ApiResponse.success(res, 'Countries retrieved', countries);
}));

router.post('/countries', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const country = await prisma.country.create({ data: req.body });
  return ApiResponse.created(res, 'Country created', country);
}));

// States
router.get('/states', asyncHandler(async (req: Request, res: Response) => {
  const where: any = {};
  if (req.query.countryId) where.countryId = req.query.countryId;
  const states = await prisma.state.findMany({ where, orderBy: { name: 'asc' } });
  return ApiResponse.success(res, 'States retrieved', states);
}));

router.post('/states', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const state = await prisma.state.create({ data: req.body });
  return ApiResponse.created(res, 'State created', state);
}));

// Cities
router.get('/cities', asyncHandler(async (req: Request, res: Response) => {
  const where: any = {};
  if (req.query.stateId) where.stateId = req.query.stateId;
  const cities = await prisma.city.findMany({ where, orderBy: { name: 'asc' } });
  return ApiResponse.success(res, 'Cities retrieved', cities);
}));

router.post('/cities', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const city = await prisma.city.create({ data: req.body });
  return ApiResponse.created(res, 'City created', city);
}));

export default router;
