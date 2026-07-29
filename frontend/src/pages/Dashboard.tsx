import { useQuery } from '@tanstack/react-query';
import { Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '@/services/api';

interface Stats {
  metrics: {
    totalAppointments: number;
    totalRevenue: number;
    salesCommissions: number;
    totalCustomers: number;
  };
  upcomingBookings: any[];
  topServices: any[];
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data as Stats;
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: async () => {
      const res = await api.get('/dashboard/revenue-chart');
      return res.data.data;
    },
  });

  const statCards = [
    { label: 'Appointments', value: data?.metrics.totalAppointments || 0, icon: Calendar, color: 'blue' },
    { label: 'Total Revenue', value: `₹${Number(data?.metrics.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'green' },
    { label: 'Sales Commissions', value: `₹${Number(data?.metrics.salesCommissions || 0).toLocaleString()}`, icon: TrendingUp, color: 'purple' },
    { label: 'Customers', value: data?.metrics.totalCustomers || 0, icon: Users, color: 'orange' },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your salon operations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? '...' : stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[stat.color]}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
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
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No revenue data available</p>
        )}
      </div>

      {/* Upcoming Appointments & Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
          {data?.upcomingBookings.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No upcoming appointments</p>
          ) : (
            <div className="space-y-3">
              {data?.upcomingBookings.map((booking: any) => (
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
          {!data?.topServices || data.topServices.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.topServices}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="totalCount" fill="#6366f1" radius={[4, 4, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
