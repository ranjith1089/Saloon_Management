import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Clock, CheckCircle, Target } from 'lucide-react';
import api from '@/services/api';

const now = new Date();

export default function Earnings() {
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);

  const { data: earningsData, isLoading } = useQuery({
    queryKey: ['earnings'],
    queryFn: async () => (await api.get('/finance/earnings')).data,
  });

  const { data: commData } = useQuery({
    queryKey: ['commissions-summary', year, month],
    queryFn: async () =>
      (await api.get('/finance/commissions/summary', { params: { year, month } })).data.data,
  });

  const earnings = earningsData?.data?.earnings || [];
  const summary = earningsData?.data?.summary || { totalBase: 0, totalCommission: 0 };
  const commissionSummaries: any[] = commData?.summaries || [];

  const totalPayable = useMemo(
    () => commissionSummaries.reduce((sum, s) => sum + Number(s.payableCommission || 0), 0),
    [commissionSummaries]
  );

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const changeMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Staff Earnings</h1>
        <p className="text-sm text-gray-500 mt-1">Commission tracking and payouts</p>
      </div>

      {/* Monthly commissions (target-aware) */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-wrap gap-3">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Target className="w-4 h-4" /> Monthly Commissions
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Payable = (achieved − monthly target) × commission %. Zero until the target is met.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="btn-secondary !py-1.5 !px-3 text-xs">←</button>
            <div className="text-sm font-medium min-w-[130px] text-center">{monthLabel}</div>
            <button onClick={() => changeMonth(1)} className="btn-secondary !py-1.5 !px-3 text-xs">→</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border-b border-gray-100 divide-x divide-gray-100">
          <MiniStat label="Total payable this month" value={`₹${totalPayable.toLocaleString()}`} tone="primary" />
          <MiniStat label="Staff at/above target" value={commissionSummaries.filter((s) => s.targetMet && s.monthlyTarget > 0).length} tone="green" />
          <MiniStat label="Staff below target" value={commissionSummaries.filter((s) => !s.targetMet && s.monthlyTarget > 0).length} tone="yellow" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium text-gray-700">Staff</th>
                <th className="px-4 py-2 font-medium text-gray-700 text-right">Target</th>
                <th className="px-4 py-2 font-medium text-gray-700 text-right">Achieved</th>
                <th className="px-4 py-2 font-medium text-gray-700 text-right">Excess</th>
                <th className="px-4 py-2 font-medium text-gray-700 text-right">Rate</th>
                <th className="px-4 py-2 font-medium text-gray-700 text-right">Payable</th>
                <th className="px-4 py-2 font-medium text-gray-700">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {commissionSummaries.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-500">No staff data.</td></tr>
              ) : (
                commissionSummaries.map((s: any) => {
                  const hasTarget = s.monthlyTarget > 0;
                  const pct = hasTarget ? Math.min(100, Math.round((s.achieved / s.monthlyTarget) * 100)) : 100;
                  return (
                    <tr key={s.staffId} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-medium">{s.staffName}</div>
                        <div className="text-xs text-gray-500">{s.employeeCode}{s.branch ? ` · ${s.branch}` : ''}</div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {hasTarget ? `₹${Number(s.monthlyTarget).toLocaleString()}` : <span className="text-xs text-gray-400">flat</span>}
                      </td>
                      <td className="px-4 py-2 text-right">₹{Number(s.achieved).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">
                        {hasTarget ? (
                          <span className={s.excess > 0 ? 'text-green-700 font-medium' : 'text-gray-400'}>
                            ₹{Number(s.excess).toLocaleString()}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2 text-right">{s.commissionRate}%</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-semibold ${s.payableCommission > 0 ? 'text-primary-600' : 'text-gray-400'}`}>
                          ₹{Number(s.payableCommission).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-2 min-w-[140px]">
                        {hasTarget ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${s.targetMet ? 'bg-green-500' : 'bg-primary-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs w-8 text-right ${s.targetMet ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
                              {pct}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">no target</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw per-transaction earnings (unchanged existing view) */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Raw earnings (per booking / sale)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Base Amount</p>
                <p className="text-2xl font-bold mt-1">₹{Number(summary.totalBase).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Raw Commissions</p>
                <p className="text-2xl font-bold mt-1 text-primary-600">₹{Number(summary.totalCommission).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold mt-1">{earningsData?.data?.total || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Staff</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Service / Sale</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Base Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Commission %</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Commission ₹</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
                ) : earnings.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    No earnings yet
                  </td></tr>
                ) : (
                  earnings.map((e: any) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {e.staff?.user?.profile?.firstName} {e.staff?.user?.profile?.lastName}
                      </td>
                      <td className="px-4 py-3">{e.booking?.service?.name || 'Product Sale'}</td>
                      <td className="px-4 py-3">
                        {e.booking?.customer?.profile?.firstName} {e.booking?.customer?.profile?.lastName}
                      </td>
                      <td className="px-4 py-3">₹{Number(e.baseAmount).toLocaleString()}</td>
                      <td className="px-4 py-3">{e.commissionRate}%</td>
                      <td className="px-4 py-3 font-semibold text-primary-600">₹{Number(e.commissionAmount).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[e.payoutStatus]}`}>
                          {e.payoutStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: any; tone: 'primary' | 'green' | 'yellow' }) {
  const tones = {
    primary: 'text-primary-600',
    green: 'text-green-700',
    yellow: 'text-yellow-700',
  };
  return (
    <div className="px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${tones[tone]}`}>{value}</p>
    </div>
  );
}
