import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Clock } from 'lucide-react';
import api from '@/services/api';
import NewServiceModal from '@/components/NewServiceModal';

export default function Services() {
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await api.get('/services')).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-sm text-gray-500 mt-1">All available salon services</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Service
        </button>
      </div>

      <NewServiceModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Service Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Price</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Duration</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Branches</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : (
                data?.data?.map((service: any) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{service.name}</td>
                    <td className="px-4 py-3">
                      {service.category?.parent?.name ? `${service.category.parent.name} > ` : ''}
                      {service.category?.name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary-600">₹{Number(service.price).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Clock className="w-3 h-3" />
                        {service.duration} min
                      </span>
                    </td>
                    <td className="px-4 py-3">{service.branches?.length || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${service.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {service.status ? 'Active' : 'Inactive'}
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
