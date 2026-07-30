import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/services/api';

type View = 'month' | 'week';

interface Props {
  onSelectBooking?: (booking: any) => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  NO_SHOW: 'bg-gray-100 text-gray-700 border-gray-200',
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function fmtISODate(d: Date) {
  return d.toISOString().split('T')[0];
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function BookingCalendar({ onSelectBooking }: Props) {
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(new Date());

  const { rangeStart, rangeEnd, gridDays } = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(cursor);
      const end = addDays(start, 6);
      const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
      return { rangeStart: start, rangeEnd: end, gridDays: days };
    }
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = addDays(startOfWeek(monthEnd), 6);
    const days: Date[] = [];
    for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) days.push(new Date(d));
    return { rangeStart: gridStart, rangeEnd: gridEnd, gridDays: days };
  }, [view, cursor]);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings-calendar', fmtISODate(rangeStart), fmtISODate(rangeEnd)],
    queryFn: async () => {
      const res = await api.get('/bookings/calendar', {
        params: { startDate: fmtISODate(rangeStart), endDate: fmtISODate(rangeEnd) },
      });
      return res.data.data as any[];
    },
  });

  const byDay = useMemo(() => {
    const map = new Map<string, any[]>();
    (data || []).forEach((b) => {
      const key = fmtISODate(new Date(b.bookingDate));
      const arr = map.get(key) || [];
      arr.push(b);
      map.set(key, arr);
    });
    return map;
  }, [data]);

  const navPrev = () =>
    setCursor((c) => (view === 'week' ? addDays(c, -7) : new Date(c.getFullYear(), c.getMonth() - 1, 1)));
  const navNext = () =>
    setCursor((c) => (view === 'week' ? addDays(c, 7) : new Date(c.getFullYear(), c.getMonth() + 1, 1)));
  const goToday = () => setCursor(new Date());

  const title =
    view === 'week'
      ? `${rangeStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${rangeEnd.toLocaleDateString(
          undefined,
          { month: 'short', day: 'numeric', year: 'numeric' }
        )}`
      : cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={navPrev} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Previous">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goToday} className="btn-secondary !py-1.5 !px-3 text-xs">
            Today
          </button>
          <button onClick={navNext} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Next">
            <ChevronRight className="w-4 h-4" />
          </button>
          <h3 className="ml-2 font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['month', 'week'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${
                view === v ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="px-2 py-2 text-xs font-medium text-gray-500 text-center">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-sm text-gray-500">Loading bookings…</div>
      ) : (
        <div className="grid grid-cols-7">
          {gridDays.map((day) => {
            const key = fmtISODate(day);
            const bookings = byDay.get(key) || [];
            const inCurrentMonth = view === 'week' || day.getMonth() === cursor.getMonth();
            const isToday = sameDay(day, new Date());
            const cellHeight = view === 'week' ? 'min-h-[240px]' : 'min-h-[110px]';
            return (
              <div
                key={key}
                className={`${cellHeight} border-b border-r border-gray-100 p-1.5 ${
                  inCurrentMonth ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      isToday
                        ? 'bg-primary-600 text-white'
                        : inCurrentMonth
                          ? 'text-gray-700'
                          : 'text-gray-400'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {bookings.length > 0 && (
                    <span className="text-[10px] text-gray-500">{bookings.length}</span>
                  )}
                </div>
                <div className="space-y-1 overflow-hidden">
                  {bookings.slice(0, view === 'week' ? 12 : 3).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onSelectBooking?.(b)}
                      className={`w-full text-left px-1.5 py-1 rounded border text-[10.5px] leading-tight truncate ${
                        STATUS_COLORS[b.status] || STATUS_COLORS.PENDING
                      } hover:brightness-95`}
                      title={`${b.startTime} · ${b.service?.name} · ${b.customer?.profile?.firstName || ''} ${
                        b.customer?.profile?.lastName || ''
                      }`}
                    >
                      <span className="font-mono font-semibold mr-1">{b.startTime}</span>
                      <span className="truncate">{b.service?.name}</span>
                    </button>
                  ))}
                  {bookings.length > (view === 'week' ? 12 : 3) && (
                    <div className="text-[10px] text-gray-500 pl-1">
                      +{bookings.length - (view === 'week' ? 12 : 3)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
