/**
 * Customer-facing "Rate your visit" modal — opened from Payment History.
 * Posts to /reviews with { bookingId, rating, comment }; the backend infers
 * staff/branch from the booking and enforces one review per booking.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Star, X, Loader2 } from 'lucide-react';
import api from '@/services/api';

export default function MyReviewModal({ booking, onClose }: { booking: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const submit = useMutation({
    mutationFn: async () =>
      api.post('/reviews', {
        bookingId: booking.id,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Thanks for your review!');
      qc.invalidateQueries({ queryKey: ['my-reviews'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Could not submit review'),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Rate your visit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <p className="font-medium">{booking.service?.name}</p>
          <p className="text-xs text-gray-500">
            {new Date(booking.bookingDate).toLocaleDateString()} · {booking.branch?.name}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  n <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          className="input"
          rows={3}
          placeholder="Tell us about your experience (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            disabled={rating < 1 || submit.isPending}
            onClick={() => submit.mutate()}
            className="btn-primary inline-flex items-center gap-1 disabled:opacity-50"
          >
            {submit.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Submit
          </button>
        </div>
      </div>
    </div>
  );
}
