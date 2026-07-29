import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Calendar, Users, DollarSign } from 'lucide-react';
import api from '@/services/api';

type ReportTab = 'daily' | 'overall' | 'payouts' | 'services';

export default function Reports() {
  const [tab, setTab] = useState<ReportTab>('overall');

  const { data, isLoading } = useQuery({
    queryKey: ['report', tab],
    queryFn: async () => {
      const endpoints: Record<ReportTab, string> = {
        daily: '/reports/daily-bookings',
        overall: '/reports/overall-bookings',
        payouts: '/reports/staff-payouts',
        services: '/reports/staff-services',
      };
      return (await api.get(endpoints[tab])).data;
    },
  });

  const tabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: 'overall', label: 'Overall Bookings', icon: BarChart3 },
    { id: 'daily', label: 'Daily Bookings', icon: Calendar },
    { id: 'payouts', label: 'Staff Payouts', icon: DollarSign },
    { id: 'services', label: 'Staff Services', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Business insights and performance metrics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-4">
          {tab === 'overall' && <OverallView data={data?.data} />}
          {tab === 'daily' && <DailyView data={data?.data} />}
          {tab === 'payouts' && <PayoutsView data={data?.data} />}
          {tab === 'services' && <ServicesView data={data?.data} />}
        </div>
      )}
    </div>
  );
}

function OverallView({ data }: any) {
  if (!data) return null;
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={data.totalBookings} />
        <StatCard label="Total Revenue" value={`₹${Number(data.revenue?.total || 0).toLocaleString()}`} />
        <StatCard label="Tax Collected" value={`₹${Number(data.revenue?.tax || 0).toLocaleString()}`} />
        <StatCard label="Total Discounts" value={`₹${Number(data.revenue?.discount || 0).toLocaleString()}`} />
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Booking Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(data.statusBreakdown || {}).map(([status, count]: any) => (
            <div key={status} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">{status}</p>
              <p className="text-lg font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {data.branchStats?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Branch Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 font-medium text-gray-700">Branch</th>
                  <th className="text-left py-2 font-medium text-gray-700">Bookings</th>
                  <th className="text-left py-2 font-medium text-gray-700">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.branchStats.map((b: any) => (
                  <tr key={b.branchId}>
                    <td className="py-2">{b.branchName}</td>
                    <td className="py-2">{b.totalBookings}</td>
                    <td className="py-2 font-semibold">₹{Number(b.totalRevenue).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function DailyView({ data }: any) {
  if (!data) return null;
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Bookings" value={data.totalBookings} />
        <StatCard label="Revenue" value={`₹${Number(data.revenue?.total || 0).toLocaleString()}`} />
        <StatCard label="Date" value={new Date(data.date).toLocaleDateString()} />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Service</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Staff</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.bookings?.map((b: any) => (
                <tr key={b.id}>
                  <td className="px-4 py-3">{b.startTime}</td>
                  <td className="px-4 py-3">{b.customer?.profile?.firstName}</td>
                  <td className="px-4 py-3">{b.service?.name}</td>
                  <td className="px-4 py-3">{b.staff?.user?.profile?.firstName}</td>
                  <td className="px-4 py-3 font-semibold">₹{Number(b.totalAmount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function PayoutsView({ data }: any) {
  if (!data) return null;
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Staff" value={data.summary?.totalStaff || 0} />
        <StatCard label="Total Earnings" value={`₹${Number(data.summary?.totalEarnings || 0).toLocaleString()}`} />
        <StatCard label="Paid" value={`₹${Number(data.summary?.totalPaid || 0).toLocaleString()}`} />
        <StatCard label="Pending" value={`₹${Number(data.summary?.totalPending || 0).toLocaleString()}`} />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Staff</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Branch</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Bookings</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Total Earned</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Paid</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.report?.map((r: any) => (
                <tr key={r.staffId}>
                  <td className="px-4 py-3 font-medium">{r.staffName}</td>
                  <td className="px-4 py-3">{r.branch}</td>
                  <td className="px-4 py-3">{r.totalBookings}</td>
                  <td className="px-4 py-3 font-semibold">₹{Number(r.totalEarned).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">₹{Number(r.paidAmount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-yellow-600">₹{Number(r.pendingAmount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ServicesView({ data }: any) {
  if (!data) return null;
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Staff</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Service</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Bookings</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.report?.map((r: any, i: number) => (
              <tr key={i}>
                <td className="px-4 py-3 font-medium">{r.staffName}</td>
                <td className="px-4 py-3">{r.serviceName}</td>
                <td className="px-4 py-3">{r.totalBookings}</td>
                <td className="px-4 py-3 font-semibold">₹{Number(r.totalRevenue).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
