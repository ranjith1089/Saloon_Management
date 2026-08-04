/**
 * Public (unauthenticated) endpoints powering the embeddable booking widget.
 * NO auth middleware — anyone with a branch id can list services / staff /
 * slots and create a booking. The parent app-level rate limiter still applies.
 *
 * Design notes:
 *  - Bookings created here land as PENDING so a spam wave can't lock real time
 *    slots; owner approves in the dashboard.
 *  - Only ACTIVE services and VERIFIED staff of ACTIVE branches are exposed.
 *  - No prices are hidden — customers see them before confirming, exactly like
 *    a walk-in flow.
 */
import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { BookingService } from '../services/booking.service';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { NotFoundError, BadRequestError } from '../utils/ApiError';

const router = Router();

// GET /public/branches/:branchId — public salon card
router.get('/branches/:branchId', asyncHandler(async (req, res) => {
  const branch = await prisma.branch.findUnique({
    where: { id: req.params.branchId },
    include: { city: true },
  });
  if (!branch || !branch.status) throw new NotFoundError('Branch not available');
  return ApiResponse.success(res, 'ok', {
    id: branch.id,
    name: branch.name,
    description: branch.description,
    address: branch.address,
    phone: branch.phone,
    email: branch.email,
    logo: branch.logo,
    openTime: branch.openTime,
    closeTime: branch.closeTime,
    city: branch.city?.name || null,
  });
}));

// GET /public/branches/:branchId/services — active services offered at the branch
router.get('/branches/:branchId/services', asyncHandler(async (req, res) => {
  const branchServices = await prisma.branchService.findMany({
    where: { branchId: req.params.branchId },
    include: {
      service: { include: { category: true } },
    },
  });
  const list = branchServices
    .filter((bs) => bs.service.status)
    .map((bs) => ({
      id: bs.service.id,
      name: bs.service.name,
      description: bs.service.description,
      duration: bs.service.duration,
      price: Number(bs.price ?? bs.service.price),
      category: bs.service.category?.name || null,
      image: bs.service.image,
    }));
  return ApiResponse.success(res, 'ok', list);
}));

// GET /public/branches/:branchId/staff?serviceId=X — staff at branch that perform the service
router.get('/branches/:branchId/staff', asyncHandler(async (req, res) => {
  const serviceId = String(req.query.serviceId || '');
  if (!serviceId) throw new BadRequestError('serviceId is required');

  const staff = await prisma.staff.findMany({
    where: {
      branchId: req.params.branchId,
      isVerified: true,
      services: { some: { serviceId } },
    },
    include: {
      user: { include: { profile: true } },
    },
  });
  const list = staff.map((s) => ({
    id: s.id,
    name:
      [s.user?.profile?.firstName, s.user?.profile?.lastName].filter(Boolean).join(' ') ||
      s.employeeCode,
    designation: s.designation,
    photo: s.user?.profile?.avatar || null,
    experience: s.experience,
  }));
  return ApiResponse.success(res, 'ok', list);
}));

// GET /public/branches/:branchId/slots?staffId=X&serviceId=X&date=YYYY-MM-DD
router.get('/branches/:branchId/slots', asyncHandler(async (req, res) => {
  const staffId = String(req.query.staffId || '');
  const serviceId = String(req.query.serviceId || '');
  const dateStr = String(req.query.date || '');
  if (!staffId || !serviceId || !dateStr) {
    throw new BadRequestError('staffId, serviceId, date are required');
  }

  const [branch, service, existing] = await Promise.all([
    prisma.branch.findUnique({ where: { id: req.params.branchId } }),
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.booking.findMany({
      where: {
        staffId,
        bookingDate: new Date(dateStr),
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      select: { startTime: true, endTime: true },
    }),
  ]);
  if (!branch || !branch.status) throw new NotFoundError('Branch not available');
  if (!service) throw new NotFoundError('Service not found');

  // Generate 30-minute anchor slots between openTime and closeTime, skipping
  // any where a slot of length `service.duration` would overlap an existing
  // booking or spill past closing.
  const [openH, openM] = branch.openTime.split(':').map(Number);
  const [closeH, closeM] = branch.closeTime.split(':').map(Number);
  const openMin = openH * 60 + openM;
  const closeMin = closeH * 60 + closeM;

  const now = new Date();
  const requested = new Date(dateStr);
  const isToday = now.toDateString() === requested.toDateString();
  const minStartMin = isToday ? now.getHours() * 60 + now.getMinutes() : 0;

  const toHM = (min: number) =>
    `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const asMin = (hm: string) => {
    const [h, m] = hm.split(':').map(Number);
    return h * 60 + m;
  };

  const slots: { time: string; available: boolean }[] = [];
  for (let start = openMin; start + service.duration <= closeMin; start += 30) {
    if (start < minStartMin) continue;
    const end = start + service.duration;
    const overlaps = existing.some((b) => {
      const bs = asMin(b.startTime);
      const be = asMin(b.endTime);
      return start < be && end > bs;
    });
    slots.push({ time: toHM(start), available: !overlaps });
  }
  return ApiResponse.success(res, 'ok', slots);
}));

// POST /public/bookings — create a walk-in-style booking, no auth
const createSchema = z.object({
  body: z.object({
    branchId: z.string().uuid(),
    serviceId: z.string().uuid(),
    staffId: z.string().uuid(),
    bookingDate: z.string().min(8),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    customerName: z.string().min(2).max(100),
    customerPhone: z.string().min(6).max(20),
    customerEmail: z.string().email().optional(),
    notes: z.string().max(500).optional(),
  }),
});
router.post('/bookings', validate(createSchema), asyncHandler(async (req, res) => {
  const b = req.body;
  const branch = await prisma.branch.findUnique({ where: { id: b.branchId } });
  if (!branch || !branch.status) throw new NotFoundError('Branch not available');

  const booking = await BookingService.create({
    branchId: b.branchId,
    serviceId: b.serviceId,
    staffId: b.staffId,
    bookingDate: b.bookingDate,
    startTime: b.startTime,
    walkInName: b.customerName,
    walkInPhone: b.customerPhone,
    notes: b.notes ? `Public booking · ${b.customerEmail || ''}\n${b.notes}` : `Public booking · ${b.customerEmail || ''}`,
    status: 'PENDING',
  });

  // Return a minimal safe payload — never leak internal ids beyond the booking number
  return ApiResponse.success(res, 'Booking requested', {
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    startTime: booking.startTime,
    bookingDate: booking.bookingDate,
  });
}));

export default router;
