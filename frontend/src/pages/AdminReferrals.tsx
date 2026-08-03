import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, CheckCircle2, Clock, Award, Search } from 'lucide-react';
import api from '@/services/api';

type Filter = 'ALL' | 'PENDING' | 'COMPLETED';

export default function AdminReferrals() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');

  const { data = [], isLoading } = useQuery({
    queryKey: ['referrals-admin', filter],
    queryFn: async () => {
      const params: any = { limit: 500 };
      if (filter !== 'ALL') params.status = filter;
      return (await api.get('/referrals', { params })).data.data as any[];
    },
  });

  const rows = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((r) => {
      const hay = [
        r.owner?.profile?.firstName, r.owner?.profile?.lastName, r.owner?.email,
        r.referee?.profile?.firstName, r.referee?.profile?.lastName, r.referee?.email,
        r.code,
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [data, search]);

  const summary = useMemo(() => {
    const total = data.length;
    const completed = data.filter((r) => r.status === 'COMPLETED').length;
    const pending = total - completed;
    const pointsAwarded = data
      .filter((r) => r.status === 'COMPLETED')
      .reduce((s, r) => s + (r.rewardOwner || 0) + (r.rewardReferee || 0), 0);
    return { total, completed, pending, pointsAwarded };
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" /> Referrals
        </h1>
        <p className="text-sm text-gray-500 mt-1">All customer-to-customer referrals</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Total" value={summary.total} icon={<Users className="w-4 h-4" />} tone="blue" />
        <StatTile label="Pending first visit" value={summary.pending} icon={<Clock className="w-4 h-4" />} tone="yellow" />
        <StatTile label="Completed" value={summary.completed} icon={<CheckCircle2 className="w-4 h-4" />} tone="green" />
        <StatTile label="Loyalty points awarded" value={summary.pointsAwarded} icon={<Award className="w-4 h-4" />} tone="pink" />
      </div>

      <div className="card p-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['ALL', 'PENDING', 'COMPLETED'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                filter === f ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600'
              }`}
            >
              {f === 'ALL' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Referrer</th>
                <th className="text-left px-4 py-3 font-semibold">Code</th>
                <th className="text-left px-4 py-3 font-semibold">Referred</th>
                <th className="text-left px-4 py-3 font-semibold">Signed up</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Reward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  No referrals yet.
                </td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {r.owner?.profile?.firstName} {r.owner?.profile?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{r.owner?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                    <td className="px-4 py-3">
                      {r.referee ? (
                        <>
                          <div className="font-medium">
                            {r.referee.profile?.firstName} {r.referee.profile?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{r.referee.email}</div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">deleted</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${
                        r.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        r.status === 'EXPIRED' ? 'bg-gray-200 text-gray-600' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {r.status === 'COMPLETED' ? '✓ COMPLETED' : r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums">
                      {r.status === 'COMPLETED'
                        ? <>+{r.rewardOwner} <span className="text-gray-400">/</span> +{r.rewardReferee} <span className="text-gray-500">pts</span></>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, icon, tone }: {
  label: string; value: number; icon: React.ReactNode; tone: 'blue' | 'yellow' | 'green' | 'pink';
}) {
  const tones = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-600',
    pink: 'bg-pink-100 text-pink-600',
  };
  return (
    <div className="card !p-3">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider truncate">{label}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}
