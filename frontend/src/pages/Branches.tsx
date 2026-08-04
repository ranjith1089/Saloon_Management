import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, MapPin, Phone, Building2, Link as LinkIcon, Copy, Check, ExternalLink, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import NewBranchModal from '@/components/NewBranchModal';

export default function Branches() {
  const [modalOpen, setModalOpen] = useState(false);
  const [shareBranch, setShareBranch] = useState<any | null>(null);

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
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Branch
        </button>
      </div>

      <NewBranchModal open={modalOpen} onClose={() => setModalOpen(false)} />

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
              <button
                onClick={() => setShareBranch(branch)}
                className="mt-3 w-full flex items-center justify-center gap-2 text-sm font-medium bg-primary-50 hover:bg-primary-100 text-primary-700 py-2 rounded-lg transition-colors"
                title="Get the public booking link for this branch"
              >
                <LinkIcon className="w-4 h-4" /> Booking link
              </button>
            </div>
          ))}
        </div>
      )}

      {shareBranch && <ShareLinkModal branch={shareBranch} onClose={() => setShareBranch(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Booking-link share modal — copy URL / embed snippet / open preview
// ---------------------------------------------------------------------------
function ShareLinkModal({ branch, onClose }: { branch: any; onClose: () => void }) {
  const url = `${window.location.origin}/book/${branch.id}`;
  const iframe = `<iframe src="${url}?embed=1" width="100%" height="720" frameborder="0" style="border:0;border-radius:12px"></iframe>`;
  const [copied, setCopied] = useState<'url' | 'embed' | null>(null);

  const copy = async (text: string, kind: 'url' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success('Copied');
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">Booking link · {branch.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Share this link on your Instagram bio, website, or WhatsApp status.
              Customers can book without creating an account.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        {/* Public URL */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Public URL</label>
          <div className="flex gap-2">
            <input readOnly value={url} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm" />
            <button onClick={() => copy(url, 'url')} className="btn-secondary text-sm">
              {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <a href={url} target="_blank" rel="noreferrer" className="btn-secondary text-sm" title="Preview in a new tab">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="flex gap-2 mt-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Book your appointment: ${url}`)}`}
              target="_blank" rel="noreferrer"
              className="text-xs text-green-700 hover:underline"
            >
              Share on WhatsApp
            </a>
            <span className="text-xs text-gray-300">·</span>
            <button
              onClick={() => copy(`Book your appointment at ${branch.name}: ${url}`, 'url')}
              className="text-xs text-primary-700 hover:underline"
            >
              Copy Instagram-bio message
            </button>
          </div>
        </div>

        {/* Embed code */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 flex items-center gap-1">
            <Code2 className="w-3 h-3" /> Embed on your website
          </label>
          <textarea readOnly value={iframe} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs font-mono" />
          <button onClick={() => copy(iframe, 'embed')} className="btn-secondary text-sm mt-1">
            {copied === 'embed' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            Copy embed code
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            Bookings from this widget appear in <strong>Bookings</strong> as <em>PENDING</em>.
            Confirm or reschedule from there — the customer gets a WhatsApp update automatically
            (if WhatsApp is configured under Settings → Messaging).
          </p>
        </div>
      </div>
    </div>
  );
}
