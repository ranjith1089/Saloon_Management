/** Date/number helpers shared across screens. */

export function dateParts(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return {
    mon: d.toLocaleDateString(undefined, { month: 'short' }),
    day: String(d.getDate()).padStart(2, '0'),
    dow: d.toLocaleDateString(undefined, { weekday: 'short' }),
  };
}

export function money(n?: number | string) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export function initials(first?: string, last?: string) {
  const s = `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`;
  return s || '·';
}

export function fullName(first?: string, last?: string) {
  return [first, last].filter(Boolean).join(' ') || 'Customer';
}

/** hh:mm start–end when both present, else just start. */
export function timeRange(start?: string, end?: string) {
  if (start && end) return `${start} – ${end}`;
  return start || '';
}
