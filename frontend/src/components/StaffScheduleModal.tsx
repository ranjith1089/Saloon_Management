import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Copy } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  staff: any | null;
}

const DAYS = [
  { i: 0, label: 'Sunday' },
  { i: 1, label: 'Monday' },
  { i: 2, label: 'Tuesday' },
  { i: 3, label: 'Wednesday' },
  { i: 4, label: 'Thursday' },
  { i: 5, label: 'Friday' },
  { i: 6, label: 'Saturday' },
];

const DEFAULT: Record<number, { startTime: string; endTime: string; isOff: boolean }> = Object.fromEntries(
  DAYS.map((d) => [d.i, { startTime: '09:00', endTime: '18:00', isOff: d.i === 0 }])
);

export default function StaffScheduleModal({ open, onClose, staff }: Props) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(DEFAULT);

  // Load the staff's full record (which includes `schedules`) when the modal opens.
  const { data, isFetching } = useQuery({
    queryKey: ['staff-schedule', staff?.id],
    queryFn: async () => (await api.get(`/staff/${staff.id}`)).data.data,
    enabled: open && !!staff?.id,
  });

  useEffect(() => {
    if (!data) return;
    const next: typeof DEFAULT = JSON.parse(JSON.stringify(DEFAULT));
    (data.schedules || []).forEach((s: any) => {
      next[s.dayOfWeek] = {
        startTime: s.startTime,
        endTime: s.endTime,
        isOff: s.isOff ?? false,
      };
    });
    setRows(next);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        schedules: DAYS.map((d) => ({
          dayOfWeek: d.i,
          startTime: rows[d.i].startTime,
          endTime: rows[d.i].endTime,
          isOff: rows[d.i].isOff,
        })),
      };
      return api.put(`/staff/${staff.id}/schedule`, payload);
    },
    onSuccess: () => {
      toast.success('Schedule saved');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-schedule', staff?.id] });
      onClose();
    },
  });

  const applyToAll = (dayIndex: number) => {
    const src = rows[dayIndex];
    const next = { ...rows };
    DAYS.forEach((d) => {
      if (d.i !== dayIndex && !next[d.i].isOff) {
        next[d.i] = { ...src };
      }
    });
    setRows(next);
    toast.success('Applied to all working days');
  };

  const setField = (dayIndex: number, field: 'startTime' | 'endTime' | 'isOff', value: string | boolean) => {
    setRows((prev) => ({ ...prev, [dayIndex]: { ...prev[dayIndex], [field]: value as any } }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Weekly Schedule"
      description={staff ? `${staff.user?.profile?.firstName || ''} ${staff.user?.profile?.lastName || ''}`.trim() : ''}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Schedule'}
          </button>
        </>
      }
    >
      {isFetching ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading current schedule…</div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 px-1 text-[11px] font-medium text-gray-500 uppercase">
            <div className="col-span-3">Day</div>
            <div className="col-span-2 text-center">Off</div>
            <div className="col-span-3">Start</div>
            <div className="col-span-3">End</div>
            <div className="col-span-1"></div>
          </div>
          {DAYS.map((d) => {
            const row = rows[d.i];
            return (
              <div
                key={d.i}
                className={`grid grid-cols-12 gap-2 items-center px-1 py-2 rounded-lg ${
                  row.isOff ? 'bg-gray-50' : 'bg-white border border-gray-100'
                }`}
              >
                <div className="col-span-3 font-medium text-sm">{d.label}</div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="checkbox"
                    checked={row.isOff}
                    onChange={(e) => setField(d.i, 'isOff', e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="time"
                    value={row.startTime}
                    disabled={row.isOff}
                    onChange={(e) => setField(d.i, 'startTime', e.target.value)}
                    className="input !py-1.5 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="time"
                    value={row.endTime}
                    disabled={row.isOff}
                    onChange={(e) => setField(d.i, 'endTime', e.target.value)}
                    className="input !py-1.5 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => applyToAll(d.i)}
                    disabled={row.isOff}
                    className="p-1.5 hover:bg-primary-50 text-gray-400 hover:text-primary-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Copy these times to every working day"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-gray-500 mt-3">
            Available booking slots on the Bookings page are generated from this schedule in 30-min increments.
          </p>
        </div>
      )}
    </Modal>
  );
}
