// Shared booking display helpers — keep date/time formatting and status
// wording identical across the Home dashboard and the My Bookings page.

/** e.g. "Sat, Aug 29 · 09:00 – 10:00" (or "· 09:00" when no end time given). */
export function formatBookingWhen(bookingDate: string, startTime: string, endTime?: string) {
  const datePart = new Date(bookingDate).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timePart = endTime ? `${startTime} – ${endTime}` : startTime;
  return `${datePart} · ${timePart}`;
}

/** Customer-friendly labels — PENDING reads as "awaiting confirmation". */
export const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Awaiting confirmation',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No show',
};

export function bookingStatusLabel(status: string) {
  return BOOKING_STATUS_LABEL[status] || status.replace(/_/g, ' ');
}

/** Tailwind badge classes per status — shared so badges look the same everywhere. */
export const BOOKING_STATUS_TONE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-gray-200 text-gray-700',
};

export function bookingStatusTone(status: string) {
  return BOOKING_STATUS_TONE[status] || 'bg-gray-100 text-gray-700';
}
