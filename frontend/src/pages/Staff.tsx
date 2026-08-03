import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, CheckCircle2, CalendarClock, Target, Edit2, Trash2 } from 'lucide-react';
import api from '@/services/api';
import NewStaffModal from '@/components/NewStaffModal';
import StaffScheduleModal from '@/components/StaffScheduleModal';

export default function Staff() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [scheduleFor, setScheduleFor] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => (await api.get('/staff')).data,
  });

  const now = new Date();
  const { data: commissionsData } = useQuery({
    queryKey: ['commissions-summary', now.getUTCFullYear(), now.getUTCMonth() + 1],
    queryFn: async () =>
      (await api.get('/finance/commissions/summary', {
        params: { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 },
      })).data.data,
  });

  const summaryByStaff = useMemo(() => {
    const map = new Map<string, any>();
    (commissionsData?.summaries || []).forEach((s: any) => map.set(s.staffId, s));
    return map;
  }, [commissionsData]);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => {
      toast.success('Staff removed');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (s: any) => {
    setEditing(s);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-sm text-gray-500 mt-1">Manage salon staff and stylists</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> New Staff
        </button>
      </div>

      <NewStaffModal open={modalOpen} onClose={closeModal} staff={editing} />
      <StaffScheduleModal open={!!scheduleFor} onClose={() => setScheduleFor(null)} staff={scheduleFor} />

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map((s: any) => {
            const summary = summaryByStaff.get(s.id);
            const hasTarget = summary && summary.monthlyTarget > 0;
            const pct = hasTarget
              ? Math.min(100, Math.round((summary.achieved / summary.monthlyTarget) * 100))
              : 0;

            return (
              <div key={s.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-medium text-primary-700">
                      {s.user?.profile?.firstName?.[0]}{s.user?.profile?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold truncate">
                        {s.user?.profile?.firstName} {s.user?.profile?.lastName}
                      </h3>
                      {s.isVerified && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{s.designation}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.employeeCode}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                      title="Edit staff"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${s.user?.profile?.firstName} ${s.user?.profile?.lastName}? This deletes the user account.`)) {
                          deleteMut.mutate(s.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-50 rounded text-red-600"
                      title="Delete staff"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Branch:</span>
                    <span className="font-medium">{s.branch?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Services:</span>
                    <span className="font-medium">{s.services?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bookings:</span>
                    <span className="font-medium">{s._count?.bookings || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Commission:</span>
                    <span className="font-medium">{s.commissionRate}%</span>
                  </div>
                </div>

                {/* Target progress for the current month */}
                {hasTarget && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Target className="w-3 h-3" /> This month
                      </span>
                      <span className={summary.targetMet ? 'font-semibold text-green-700' : 'text-gray-700'}>
                        ₹{Number(summary.achieved).toLocaleString()} / ₹{Number(summary.monthlyTarget).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          summary.targetMet ? 'bg-green-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {summary.targetMet ? (
                        <>Payable commission: <span className="font-semibold text-green-700">₹{Number(summary.payableCommission).toLocaleString()}</span></>
                      ) : (
                        <>Needs ₹{Number(summary.monthlyTarget - summary.achieved).toLocaleString()} more to earn commission</>
                      )}
                    </p>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setScheduleFor(s)}
                    className="btn-secondary w-full text-xs !py-1.5 inline-flex items-center justify-center gap-1"
                  >
                    <CalendarClock className="w-3.5 h-3.5" /> Edit Schedule
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
