import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import api from '@/services/api';

export default function Reviews() {
  const { data, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => (await api.get('/reviews')).data,
  });

  const reviews = data?.data?.reviews || [];
  const avg = data?.data?.averageRating || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">Customer feedback & ratings</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`w-5 h-5 ${n <= Math.round(avg) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">{Number(avg).toFixed(1)} average rating</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : reviews.length === 0 ? (
        <div className="card text-center py-12">
          <Star className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No reviews yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r: any) => (
            <div key={r.id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {r.booking?.customer?.profile?.firstName?.[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {r.booking?.customer?.profile?.firstName} {r.booking?.customer?.profile?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{r.booking?.service?.name}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-700 mt-2">{r.comment}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Staff: {r.booking?.staff?.user?.profile?.firstName} {r.booking?.staff?.user?.profile?.lastName}
                    </span>
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
