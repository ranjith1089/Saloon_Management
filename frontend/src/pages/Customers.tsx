import { useQuery } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import api from '@/services/api';

export default function Customers() {
  const { data, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await api.get('/customers')).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer database</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> New Customer
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Visits</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Total Spent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  No customers yet
                </td></tr>
              ) : (
                data?.data?.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                          {c.user?.profile?.firstName?.[0]}{c.user?.profile?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {c.user?.profile?.firstName} {c.user?.profile?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{c.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{c.user?.profile?.phone || '-'}</td>
                    <td className="px-4 py-3">{c.totalVisits}</td>
                    <td className="px-4 py-3 font-medium">₹{Number(c.totalSpent).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                        {c.loyaltyPoints} pts
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
