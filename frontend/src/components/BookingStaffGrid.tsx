import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, Building2, User } from 'lucide-react';
import api from '@/services/api';

interface Props {
  onSelectBooking?: (booking: any) => void;
  onCreateBooking?: (prefill: { staffId: string; startTime: string; date: string; branchId: string }) => void;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-900' },
  CONFIRMED: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-900' },
  IN_PROGRESS: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-900' },
  COMPLETED: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-900' },
  CANCELLED: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-900' },
  NO_SHOW: { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-700' },
};

const SLOT_MIN = 30;
const ROW_HEIGHT_PX = 40;

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
function fmtHour(mins: number) {
  const h = Math.floor(mins / 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:00 ${ampm}`;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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

  const openTime = activeBranch?.openTime || '09:00';
  const closeTime = activeBranch?.closeTime || '21:00';
  const dayStartMin = toMinutes(openTime);
  const dayEndMin = toMinutes(closeTime);

  const slotStarts = useMemo(() => {
    const out: number[] = [];
    for (let m = dayStartMin; m < dayEndMin; m += SLOT_MIN) out.push(m);
    return out;
  }, [dayStartMin, dayEndMin]);

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

  const navPrev = () => setCursor((c) => { const d = new Date(c); d.setDate(d.getDate() - 1); return d; });
  const navNext = () => setCursor((c) => { const d = new Date(c); d.setDate(d.getDate() + 1); return d; });
  const goToday = () => setCursor(new Date());

  const isToday = sameDay(cursor, new Date());
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const nowLineTop = isToday && nowMinutes >= dayStartMin && nowMinutes <= dayEndMin
    ? ((nowMinutes - dayStartMin) / SLOT_MIN) * ROW_HEIGHT_PX
    : null;

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
      <div className="flex items-center justify-between p-4 border-b border-gray-200 gap-3 flex-wrap bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center gap-1">
          <button onClick={navPrev} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Previous day">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
              isToday ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Today
          </button>
          <button onClick={navNext} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Next day">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900 leading-tight">
              {cursor.toLocaleDateString(undefined, { weekday: 'long' })}
            </h3>
            <p className="text-xs text-gray-500">
              {cursor.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{staff.length} staff · {bookings?.length ?? 0} booking{bookings?.length === 1 ? '' : 's'}</span>
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
        <div className="p-8 text-center text-sm text-gray-500">Loading day…</div>
      ) : staff.length === 0 ? (
        <div className="p-12 text-center">
          <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 font-medium">No verified staff at this branch</p>
          <p className="text-xs text-gray-400 mt-1">Verify or add staff to build the schedule grid.</p>
        </div>
      ) : (
        <div className="overflow-x-auto relative">
          <div
            className="grid relative"
            style={{ gridTemplateColumns: `72px repeat(${staff.length}, minmax(200px, 1fr))` }}
          >
            {/* Header row */}
            <div className="border-b-2 border-gray-200 bg-gray-50 sticky left-0 z-20" />
            {staff.map((s) => (
              <div
                key={s.id}
                className="border-b-2 border-l border-gray-200 bg-gray-50 px-3 py-3 flex items-center gap-2 min-w-0"
              >
                {s.user?.profile?.avatar ? (
                  <img
                    src={s.user.profile.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                    {s.user?.profile?.firstName?.[0]}{s.user?.profile?.lastName?.[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {s.user?.profile?.firstName} {s.user?.profile?.lastName}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">{s.designation || s.employeeCode}</div>
                </div>
              </div>
            ))}

            {/* Now-line — only when viewing today */}
            {nowLineTop !== null && (
              <div
                className="absolute left-0 right-0 pointer-events-none z-10"
                style={{ top: `${nowLineTop + 65 /* header row height */}px` }}
              >
                <div className="flex items-center">
                  <span className="ml-16 text-[9px] font-bold text-red-500 bg-white px-1">
                    {fmtHHMM(nowMinutes)}
                  </span>
                  <div className="flex-1 h-[2px] bg-red-500" />
                </div>
              </div>
            )}

            {/* Time rows */}
            {slotStarts.map((slotMin, idx) => (
              <RowTime
                key={slotMin}
                slotMin={slotMin}
                slotIndex={idx}
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
      <div className="p-3 border-t border-gray-100 flex items-center gap-3 flex-wrap text-[11px] bg-gray-50/50">
        <span className="text-gray-500 font-medium">Status:</span>
        {Object.entries(STATUS_COLORS).map(([key, c]) => (
          <span key={key} className={`px-2 py-0.5 rounded border-l-2 ${c.bg} ${c.border} ${c.text}`}>
            {key.replace('_', ' ')}
          </span>
        ))}
        {isToday && (
          <span className="ml-auto inline-flex items-center gap-1 text-red-600">
            <div className="w-2 h-[2px] bg-red-500" /> now
          </span>
        )}
      </div>
    </div>
  );
}

function RowTime({
  slotMin,
  slotIndex,
  staff,
  byStaff,
  dateStr,
  branchId,
  onSelectBooking,
  onCreateBooking,
}: {
  slotMin: number;
  slotIndex: number;
  staff: any[];
  byStaff: Map<string, Array<{ startMin: number; endMin: number; booking: any }>>;
  dateStr: string;
  branchId: string;
  onSelectBooking?: (b: any) => void;
  onCreateBooking?: (p: { staffId: string; startTime: string; date: string; branchId: string }) => void;
}) {
  const isHourStart = slotMin % 60 === 0;
  const zebra = slotIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/40';

  return (
    <>
      {/* Time label — sticky column */}
      <div
        className={`px-2 text-[11px] font-mono sticky left-0 z-10 flex items-start justify-end pr-2 pt-1 ${
          isHourStart ? 'text-gray-700 font-semibold border-t border-gray-200 bg-white' : 'text-gray-300 border-t border-gray-50 bg-white'
        }`}
        style={{ height: ROW_HEIGHT_PX }}
      >
        {isHourStart && fmtHour(slotMin)}
      </div>
      {staff.map((s) => {
        const items = byStaff.get(s.id) || [];
        const startsHere = items.find((it) => it.startMin === slotMin);
        const insideRunning = items.some((it) => it.startMin < slotMin && it.endMin > slotMin);
        const rowBorder = isHourStart ? 'border-t border-gray-200' : 'border-t border-gray-100';

        if (startsHere) {
          const durationMin = startsHere.endMin - startsHere.startMin;
          const rows = Math.max(1, Math.round(durationMin / 30));
          const b = startsHere.booking;
          const c = STATUS_COLORS[b.status] || STATUS_COLORS.PENDING;
          return (
            <button
              key={s.id}
              onClick={() => onSelectBooking?.(b)}
              className={`${rowBorder} border-l border-gray-100 relative overflow-hidden text-left ${c.bg} border-l-4 ${c.border} hover:brightness-95 shadow-sm rounded-sm m-0.5`}
              style={{
                height: ROW_HEIGHT_PX * rows - 4,
                marginBottom: -1 * (rows - 1) * ROW_HEIGHT_PX + (rows - 1) * 1,
              }}
              title={`${b.startTime}–${b.endTime} · ${b.service?.name} · ${b.customer?.profile?.firstName || ''} ${b.customer?.profile?.lastName || ''}`.trim()}
            >
              <div className={`px-2 py-1.5 text-[11px] leading-tight ${c.text}`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono font-semibold">{b.startTime}</span>
                  {b.paymentStatus === 'PAID' && (
                    <span className="text-[9px] font-bold opacity-70">✓ PAID</span>
                  )}
                </div>
                <div className="truncate font-semibold">{b.service?.name}</div>
                <div className="truncate opacity-75">
                  {b.customer?.profile?.firstName || ''} {b.customer?.profile?.lastName || ''}
                </div>
              </div>
            </button>
          );
        }
        if (insideRunning) {
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
            className={`${zebra} ${rowBorder} border-l border-gray-100 hover:bg-primary-50 group flex items-center justify-center transition-colors`}
            style={{ height: ROW_HEIGHT_PX }}
            title={`Book ${s.user?.profile?.firstName || 'staff'} at ${fmtHHMM(slotMin)}`}
          >
            <span className="opacity-0 group-hover:opacity-100 text-primary-500 text-[10px] font-medium inline-flex items-center gap-1">
              <Plus className="w-3 h-3" /> book
            </span>
          </button>
        );
      })}
    </>
  );
}
