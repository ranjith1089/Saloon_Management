import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, Building2 } from 'lucide-react';
import api from '@/services/api';

interface Props {
  onSelectBooking?: (booking: any) => void;
  onCreateBooking?: (prefill: { staffId: string; startTime: string; date: string; branchId: string }) => void;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900' },
  CONFIRMED: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900' },
  IN_PROGRESS: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-900' },
  COMPLETED: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-900' },
  CANCELLED: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900' },
  NO_SHOW: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' },
};

const SLOT_MIN = 30; // 30-minute rows
const ROW_HEIGHT_PX = 32; // per SLOT_MIN

function fmtISODate(d: Date) {
  return d.toISOString().split('T')[0];
}
function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function fmtHHMM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function BookingStaffGrid({ onSelectBooking, onCreateBooking }: Props) {
  const [cursor, setCursor] = useState(new Date());
  const [branchId, setBranchId] = useState<string>('');

  const dateStr = fmtISODate(cursor);

  const { data: branches } = useQuery({
    queryKey: ['branches-select'],
    queryFn: async () => (await api.get('/branches?limit=100')).data.data,
  });

  const activeBranch = useMemo(
    () => (branches || []).find((b: any) => b.id === branchId) || (branches || [])[0],
    [branches, branchId]
  );

  // Default to the first branch if none selected
  const effectiveBranchId = branchId || activeBranch?.id || '';

  const { data: staffList } = useQuery({
    queryKey: ['staff-grid', effectiveBranchId],
    queryFn: async () => {
      const r = await api.get('/staff', { params: { branchId: effectiveBranchId, isVerified: true, limit: 100 } });
      return r.data.data as any[];
    },
    enabled: !!effectiveBranchId,
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings-staff-grid', dateStr, effectiveBranchId],
    queryFn: async () => {
      const r = await api.get('/bookings/calendar', {
        params: { startDate: dateStr, endDate: dateStr, branchId: effectiveBranchId },
      });
      return (r.data.data as any[]) || [];
    },
    enabled: !!effectiveBranchId,
  });

  // Build slots from the branch's opening hours.
  const openTime = activeBranch?.openTime || '09:00';
  const closeTime = activeBranch?.closeTime || '21:00';
  const dayStartMin = toMinutes(openTime);
  const dayEndMin = toMinutes(closeTime);

  const slotStarts = useMemo(() => {
    const out: number[] = [];
    for (let m = dayStartMin; m < dayEndMin; m += SLOT_MIN) out.push(m);
    return out;
  }, [dayStartMin, dayEndMin]);

  // Index bookings by staffId → { startMin, endMin, booking }
  const byStaff = useMemo(() => {
    const map = new Map<string, Array<{ startMin: number; endMin: number; booking: any }>>();
    (bookings || []).forEach((b) => {
      const key = b.staffId as string;
      const list = map.get(key) || [];
      list.push({ startMin: toMinutes(b.startTime), endMin: toMinutes(b.endTime), booking: b });
      map.set(key, list);
    });
    return map;
  }, [bookings]);

  const navPrev = () => setCursor((c) => {
    const d = new Date(c); d.setDate(d.getDate() - 1); return d;
  });
  const navNext = () => setCursor((c) => {
    const d = new Date(c); d.setDate(d.getDate() + 1); return d;
  });
  const goToday = () => setCursor(new Date());

  const isToday = sameDay(cursor, new Date());

  if (!branches || branches.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-500">
        <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
        No branches yet — add one to use the staff-grid view.
      </div>
    );
  }

  const staff = staffList || [];

  return (
    <div className="card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={navPrev} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Previous day">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className={`btn-secondary !py-1.5 !px-3 text-xs ${isToday ? 'bg-primary-50 text-primary-700 border-primary-200' : ''}`}
          >
            Today
          </button>
          <button onClick={navNext} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Next day">
            <ChevronRight className="w-4 h-4" />
          </button>
          <h3 className="ml-2 font-semibold text-gray-900">
            {cursor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input !py-1.5 text-sm max-w-[220px]"
            value={effectiveBranchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
      ) : staff.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">
          No verified staff at this branch yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `60px repeat(${staff.length}, minmax(180px, 1fr))`,
            }}
          >
            {/* Header row */}
            <div className="border-b border-gray-200 bg-gray-50 sticky left-0 z-10" />
            {staff.map((s) => (
              <div key={s.id} className="border-b border-l border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
                <div className="truncate">
                  {s.user?.profile?.firstName} {s.user?.profile?.lastName}
                </div>
                <div className="text-[10px] text-gray-500 truncate">{s.designation || s.employeeCode}</div>
              </div>
            ))}

            {/* Time rows */}
            {slotStarts.map((slotMin) => (
              <RowTime
                key={slotMin}
                slotMin={slotMin}
                staff={staff}
                byStaff={byStaff}
                dateStr={dateStr}
                branchId={effectiveBranchId}
                onSelectBooking={onSelectBooking}
                onCreateBooking={onCreateBooking}
              />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-3 border-t border-gray-100 flex items-center gap-3 flex-wrap text-[11px]">
        <span className="text-gray-500">Status:</span>
        {Object.entries(STATUS_COLORS).map(([key, c]) => (
          <span key={key} className={`px-1.5 py-0.5 rounded border ${c.bg} ${c.border} ${c.text}`}>
            {key.replace('_', ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}

function RowTime({
  slotMin,
  staff,
  byStaff,
  dateStr,
  branchId,
  onSelectBooking,
  onCreateBooking,
}: {
  slotMin: number;
  staff: any[];
  byStaff: Map<string, Array<{ startMin: number; endMin: number; booking: any }>>;
  dateStr: string;
  branchId: string;
  onSelectBooking?: (b: any) => void;
  onCreateBooking?: (p: { staffId: string; startTime: string; date: string; branchId: string }) => void;
}) {
  const label = fmtHHMM(slotMin);
  return (
    <>
      <div
        className="border-b border-gray-100 px-2 py-1 text-[11px] font-mono text-gray-500 sticky left-0 bg-white z-10"
        style={{ height: ROW_HEIGHT_PX }}
      >
        {slotMin % 60 === 0 ? label : ''}
      </div>
      {staff.map((s) => {
        const items = byStaff.get(s.id) || [];
        // A booking "starts" at this slot iff startMin equals this slotMin (or the
        // booking started before the day-window and we're at the first slot).
        const startsHere = items.find((it) => it.startMin === slotMin);
        // Skip cells that are inside a running booking (they'll be covered by the span).
        const insideRunning = items.some((it) => it.startMin < slotMin && it.endMin > slotMin);

        if (startsHere) {
          const durationMin = startsHere.endMin - startsHere.startMin;
          const rows = Math.max(1, Math.round(durationMin / 30));
          const b = startsHere.booking;
          const c = STATUS_COLORS[b.status] || STATUS_COLORS.PENDING;
          return (
            <button
              key={s.id}
              onClick={() => onSelectBooking?.(b)}
              className={`border-b border-l border-gray-100 relative overflow-hidden text-left ${c.bg} ${c.border} border-l-4 hover:brightness-95`}
              style={{ height: ROW_HEIGHT_PX * rows, marginBottom: -1 * (rows - 1) * ROW_HEIGHT_PX + (rows - 1) }}
              title={`${b.startTime}–${b.endTime} · ${b.service?.name} · ${b.customer?.profile?.firstName || ''} ${b.customer?.profile?.lastName || ''}`.trim()}
            >
              <div className={`px-2 py-1 text-[11px] leading-tight ${c.text}`}>
                <div className="font-mono font-semibold">{b.startTime}</div>
                <div className="truncate font-medium">{b.service?.name}</div>
                <div className="truncate opacity-80">
                  {b.customer?.profile?.firstName || ''} {b.customer?.profile?.lastName || ''}
                </div>
                {b.paymentStatus === 'PAID' && (
                  <div className="text-[10px] mt-0.5 opacity-70">✓ PAID</div>
                )}
              </div>
            </button>
          );
        }
        if (insideRunning) {
          // Return a placeholder so the grid layout stays aligned.
          return <div key={s.id} className="border-l border-transparent" style={{ height: 0 }} />;
        }
        return (
          <button
            key={s.id}
            onClick={() =>
              onCreateBooking?.({
                staffId: s.id,
                startTime: fmtHHMM(slotMin),
                date: dateStr,
                branchId,
              })
            }
            className="border-b border-l border-gray-100 hover:bg-primary-50 group flex items-center justify-center"
            style={{ height: ROW_HEIGHT_PX }}
            title={`Book ${s.user?.profile?.firstName || 'staff'} at ${fmtHHMM(slotMin)}`}
          >
            <Plus className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 opacity-0 group-hover:opacity-100" />
          </button>
        );
      })}
    </>
  );
}
