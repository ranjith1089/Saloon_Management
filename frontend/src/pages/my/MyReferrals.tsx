import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Users, Copy, Gift, MessageCircle, Phone, Award, CheckCircle2, Clock,
} from 'lucide-react';
import api from '@/services/api';

// India-first phone helper (matches Growth page).
function waLink(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
function smsLink(text: string) {
  return `sms:?body=${encodeURIComponent(text)}`;
}

export default function MyReferrals() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-referrals'],
    queryFn: async () => (await api.get('/referrals/me')).data.data,
  });

  const code = data?.code || '';
  const shareUrl = code
    ? `${window.location.origin}/register?ref=${encodeURIComponent(code)}`
    : '';
  const shareMessage = code
    ? `Hey! I love the service at Studie'o — sign up with my link and we both get 100 loyalty points on your first visit. ${shareUrl}`
    : '';

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" /> Refer Friends & Earn
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Share your link — when a friend signs up and completes their first visit,
          you both earn <strong>100 loyalty points</strong>.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : (
        <>
          {/* Share card */}
          <div className="card border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Your code</p>
                <p className="text-3xl font-black font-mono text-primary-700 tabular-nums">
                  {code}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Your link</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  readOnly
                  value={shareUrl}
                  className="input font-mono text-xs !py-2"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button onClick={() => copy(shareUrl, 'Link')} className="btn-secondary text-xs inline-flex items-center gap-1 !py-2">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={waLink(shareMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm inline-flex items-center gap-1 !bg-green-600 hover:!bg-green-700"
              >
                <MessageCircle className="w-4 h-4" /> Share on WhatsApp
              </a>
              <a
                href={smsLink(shareMessage)}
                className="btn-secondary text-sm inline-flex items-center gap-1"
              >
                <Phone className="w-4 h-4" /> Share via SMS
              </a>
              <button
                onClick={() => copy(shareMessage, 'Message')}
                className="btn-secondary text-sm inline-flex items-center gap-1"
              >
                <Copy className="w-4 h-4" /> Copy message
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Total referred" value={data?.counts?.total ?? 0} icon={<Users className="w-4 h-4" />} tone="blue" />
            <StatTile label="Signed up (pending)" value={data?.counts?.pending ?? 0} icon={<Clock className="w-4 h-4" />} tone="yellow" />
            <StatTile label="Completed" value={data?.counts?.completed ?? 0} icon={<CheckCircle2 className="w-4 h-4" />} tone="green" />
            <StatTile label="Points earned" value={data?.rewardEarned ?? 0} icon={<Award className="w-4 h-4" />} tone="pink" />
          </div>

          {/* Referral list */}
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold">Friends you've referred</h2>
            </div>
            {(data?.referrals || []).length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-500">
                <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                Nobody yet — share your link with a friend!
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.referrals.map((r: any) => (
                  <div key={r.id} className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      r.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {r.referee?.profile?.firstName} {r.referee?.profile?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Signed up {new Date(r.createdAt).toLocaleDateString()}
                        {r.completedAt && (
                          <> · Completed {new Date(r.completedAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                        r.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {r.status === 'COMPLETED' ? '✓ Earned' : 'Waiting for first visit'}
                      </div>
                      {r.status === 'COMPLETED' && (
                        <p className="text-[10px] text-gray-500 mt-1">+{r.rewardOwner} pts</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value, icon, tone }: {
  label: string; value: number; icon: React.ReactNode; tone: 'blue' | 'yellow' | 'green' | 'pink';
}) {
  const tones = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-600',
    pink: 'bg-pink-100 text-pink-600',
  };
  return (
    <div className="card !p-3">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tones[tone]}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider truncate">{label}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}
