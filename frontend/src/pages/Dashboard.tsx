import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Calendar, DollarSign, Users, TrendingUp, ShoppingBag, Award, Crown, Target, Clock, User,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();
  const role = user?.role;

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-home', role],
    queryFn: async () => (await api.get('/dashboard/home')).data.data,
  });

  if (isLoading) return <div className="text-center py-16 text-gray-500">Loading…</div>;

  if (role === 'CUSTOMER') return <CustomerHome data={data} user={user} />;
  if (role === 'STAFF') return <StaffHome data={data} user={user} />;
  return <AdminHome data={data} />;
}

// ============ CUSTOMER ============
function CustomerHome({ data, user }: { data: any; user: any }) {
  const m = data?.metrics || {};
  const upcoming = data?.upcoming || [];
  const membership = data?.membership;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hi {user?.profile?.firstName || 'there'} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Your bookings, membership and rewards at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Upcoming" value={m.upcomingCount ?? 0} icon={<Calendar className="w-5 h-5" />} tone="blue" />
        <Tile label="Completed visits" value={m.completedCount ?? 0} icon={<Clock className="w-5 h-5" />} tone="green" />
        <Tile label="Loyalty points" value={m.loyaltyPoints ?? 0} icon={<Award className="w-5 h-5" />} tone="yellow" />
        <Tile label="Lifetime spend" value={`₹${Number(m.totalSpent ?? 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} tone="pink" />
      </div>

      {membership && (
        <div
          className="card border-2"
          style={{ borderColor: membership.plan?.color, backgroundColor: `${membership.plan?.color}08` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${membership.plan?.color}20`, color: membership.plan?.color }}
            >
              <Crown className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{membership.plan?.name} Member</p>
              <p className="text-xs text-gray-500">
                Valid until {new Date(membership.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loyalty streak — progress toward the next reward */}
      {(() => {
        const REWARD_THRESHOLD = 500;
        const pts = m.loyaltyPoints ?? 0;
        const reached = pts >= REWARD_THRESHOLD;
        const pct = Math.min(100, Math.round((pts / REWARD_THRESHOLD) * 100));
        return (
          <div className={`card border-2 ${reached ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-white' : 'border-primary-200 bg-gradient-to-br from-primary-50/50 to-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                reached ? 'bg-yellow-400 text-white' : 'bg-primary-100 text-primary-700'
              }`}>
                <Award className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {reached ? '🎁 Free service unlocked!' : `${pts} / ${REWARD_THRESHOLD} points`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {reached
                    ? 'Mention this at your next visit to redeem your free service.'
                    : `${REWARD_THRESHOLD - pts} more points to earn a free service reward`}
                </p>
              </div>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-gray-100">
              <div
                className={`h-full ${reached ? 'bg-yellow-400' : 'bg-primary-500'} transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 text-xs">
              <Link to="/my/referrals" className="text-primary-600 hover:underline">
                💡 Earn 100 pts by referring a friend →
              </Link>
            </div>
          </div>
        );
      })()}

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold">Upcoming Appointments</h2>
          <Link to="/bookings" className="text-xs text-primary-600 hover:underline">View all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p>No upcoming appointments.</p>
            <Link to="/bookings" className="btn-primary mt-3 inline-block">Book Now</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcoming.map((b: any) => (
              <div key={b.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{b.service?.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(b.bookingDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · {b.startTime} · {b.branch?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    with {b.staff?.user?.profile?.firstName} {b.staff?.user?.profile?.lastName}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ STAFF ============
function StaffHome({ data, user }: { data: any; user: any }) {
  const m = data?.metrics || {};
  const today = data?.today || [];
  const targetPct = m.monthlyTarget > 0 ? Math.min(100, Math.round((m.monthlyAchieved / m.monthlyTarget) * 100)) : 0;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Good day, {user?.profile?.firstName || 'there'}</h1>
        <p className="text-sm text-gray-500 mt-1">Your schedule and earnings this month.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Today" value={m.todayCount ?? 0} icon={<Calendar className="w-5 h-5" />} tone="blue" sub="bookings" />
        <Tile label="Next 7 days" value={m.upcomingWeekCount ?? 0} icon={<Clock className="w-5 h-5" />} tone="green" sub="upcoming" />
        <Tile label="Month achieved" value={`₹${Number(m.monthlyAchieved ?? 0).toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} tone="purple" />
        <Tile
          label={m.monthlyTarget > 0 ? 'Payable commission' : 'Commission'}
          value={`₹${Number(m.payableCommission ?? 0).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          tone={m.targetMet ? 'green' : 'yellow'}
        />
      </div>

      {m.monthlyTarget > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Monthly target progress</span>
            <span className="ml-auto text-sm text-gray-600">
              ₹{Number(m.monthlyAchieved).toLocaleString()} / ₹{Number(m.monthlyTarget).toLocaleString()}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${m.targetMet ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${targetPct}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {m.targetMet
              ? `Target met — commission unlocked (${targetPct}%)`
              : `${targetPct}% — need ₹${Number(m.monthlyTarget - m.monthlyAchieved).toLocaleString()} more to earn commission this month`}
          </p>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold">Today's Schedule</h2>
          <Link to="/bookings" className="text-xs text-primary-600 hover:underline">All bookings →</Link>
        </div>
        {today.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            No bookings today. Enjoy the calm.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {today.map((b: any) => (
              <div key={b.id} className="p-4 flex items-center gap-3">
                <div className="w-14 text-center flex-shrink-0">
                  <p className="font-mono text-sm font-semibold">{b.startTime}</p>
                  <p className="text-[10px] text-gray-500">{b.endTime}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{b.service?.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {b.customer?.profile?.firstName} {b.customer?.profile?.lastName}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ ADMIN / MANAGER (unchanged) ============
function AdminHome({ data }: { data: any }) {
  const { data: revenueData } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: async () => {
      const res = await api.get('/dashboard/revenue-chart');
      return res.data.data;
    },
  });

  const metrics = data?.metrics || {};
  const upcomingBookings = data?.upcomingBookings || [];
  const topServices = data?.topServices || [];

  const statCards = [
    { label: 'Appointments', value: metrics.totalAppointments || 0, icon: Calendar, color: 'blue' },
    { label: 'Service Revenue', value: `₹${Number(metrics.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'green' },
    {
      label: 'Product Revenue',
      value: `₹${Number(metrics.productRevenue || 0).toLocaleString()}`,
      icon: ShoppingBag, color: 'pink',
      sub: `${metrics.productSales || 0} sales`,
    },
    { label: 'Sales Commissions', value: `₹${Number(metrics.salesCommissions || 0).toLocaleString()}`, icon: TrendingUp, color: 'purple' },
    { label: 'Customers', value: metrics.totalCustomers || 0, icon: Users, color: 'orange' },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    pink: 'bg-pink-100 text-pink-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your salon operations</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="card !p-3 sm:!p-4 min-w-0">
            {/* Label + tiny icon badge on the same row so the number owns the
                width below and never wraps. Icon shrinks on tighter widths. */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs sm:text-sm text-gray-500 truncate">{stat.label}</p>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[stat.color]}`}>
                <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold mt-1 tabular-nums whitespace-nowrap overflow-hidden text-ellipsis" title={String(stat.value)}>
              {stat.value}
            </p>
            {(stat as any).sub && <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{(stat as any).sub}</p>}
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Revenue Trend (Last 30 Days)</h2>
        {revenueData && revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No revenue data available</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No upcoming appointments</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {booking.customer?.profile?.firstName?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {booking.customer?.profile?.firstName} {booking.customer?.profile?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.service?.name} · {booking.startTime} · {booking.branch?.name}
                    </p>
                  </div>
                  <span className="text-xs font-medium bg-primary-100 text-primary-700 px-2 py-1 rounded">
                    {new Date(booking.bookingDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Top Services</h2>
          {topServices.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topServices}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="totalCount" fill="#dc2626" radius={[4, 4, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, icon, tone, sub }: { label: string; value: any; icon: React.ReactNode; tone: string; sub?: string }) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    pink: 'bg-pink-100 text-pink-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums break-all">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tones[tone] || tones.blue}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
