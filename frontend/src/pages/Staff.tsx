import { useQuery } from '@tanstack/react-query';
import { Plus, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';

export default function Staff() {
  const { data, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => (await api.get('/staff')).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-sm text-gray-500 mt-1">Manage salon staff and stylists</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> New Staff
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map((s: any) => (
            <div key={s.id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-medium text-primary-700">
                    {s.user?.profile?.firstName?.[0]}{s.user?.profile?.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <h3 className="font-semibold">
                      {s.user?.profile?.firstName} {s.user?.profile?.lastName}
                    </h3>
                    {s.isVerified && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                  <p className="text-xs text-gray-500">{s.designation}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.employeeCode}</p>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
