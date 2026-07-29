import { useQuery } from '@tanstack/react-query';
import { Plus, MapPin, Phone, Building2 } from 'lucide-react';
import api from '@/services/api';

export default function Branches() {
  const { data, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/branches')).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branches</h1>
          <p className="text-sm text-gray-500 mt-1">Manage salon locations</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> New Branch
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map((branch: any) => (
            <div key={branch.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${branch.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {branch.status ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="font-semibold text-lg">{branch.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{branch.description}</p>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3 h-3 mt-0.5" />
                  <span>{branch.address}, {branch.city?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  <span>{branch.phone}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold">{branch._count?.staff || 0}</p>
                  <p className="text-xs text-gray-500">Staff</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{branch._count?.bookings || 0}</p>
                  <p className="text-xs text-gray-500">Bookings</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
