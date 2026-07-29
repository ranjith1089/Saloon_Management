import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Ticket, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import NewCouponModal from '@/components/NewCouponModal';

export default function Coupons() {
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => (await api.get('/coupons')).data,
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupons & Promotions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage discount codes and offers</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Coupon
        </button>
      </div>

      <NewCouponModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map((c: any) => {
            const isExpired = new Date(c.validTo) < new Date();
            const usagePercent = c.usageLimit ? (c.usageCount / c.usageLimit) * 100 : 0;
            return (
              <div key={c.id} className="card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary-100 rounded-bl-full opacity-50"></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <Ticket className="w-8 h-8 text-primary-600" />
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      !c.isActive ? 'bg-gray-100 text-gray-700' :
                      isExpired ? 'bg-red-100 text-red-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {!c.isActive ? 'Inactive' : isExpired ? 'Expired' : 'Active'}
                    </span>
                  </div>

                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{c.description}</p>

                  <button
                    onClick={() => copyCode(c.code)}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-mono w-full justify-between"
                  >
                    <span className="font-bold">{c.code}</span>
                    <Copy className="w-3 h-3" />
                  </button>

                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Discount:</span>
                      <span className="font-semibold text-primary-600">
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                      </span>
                    </div>
                    {c.minOrderAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Min Order:</span>
                        <span>₹{c.minOrderAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valid Till:</span>
                      <span>{new Date(c.validTo).toLocaleDateString()}</span>
                    </div>
                    {c.usageLimit && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Usage:</span>
                          <span>{c.usageCount}/{c.usageLimit}</span>
                        </div>
                        <div className="bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary-500 h-full" style={{ width: `${usagePercent}%` }}></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
