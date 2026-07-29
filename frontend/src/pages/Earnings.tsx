import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import api from '@/services/api';

export default function Earnings() {
  const { data, isLoading } = useQuery({
    queryKey: ['earnings'],
    queryFn: async () => (await api.get('/finance/earnings')).data,
  });

  const earnings = data?.data?.earnings || [];
  const summary = data?.data?.summary || { totalBase: 0, totalCommission: 0 };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Staff Earnings</h1>
        <p className="text-sm text-gray-500 mt-1">Commission tracking and payouts</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <p className="text-sm text-gray-500">Total Commissions</p>
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
              <p className="text-2xl font-bold mt-1">{data?.data?.total || 0}</p>
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
                <th className="text-left px-4 py-3 font-medium text-gray-700">Service</th>
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
                    <td className="px-4 py-3">{e.booking?.service?.name}</td>
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
  );
}
