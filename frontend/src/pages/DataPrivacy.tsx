/**
 * Data & Privacy — Ship 6.
 * Owner-facing controls for DPDPA compliance: download all data as JSON,
 * request deletion of the organization. Sits under /data-privacy in the
 * Finance / Settings area of the sidebar.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, Trash2, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useOrganization } from '@/hooks/useOrganization';

export default function DataPrivacy() {
  const nav = useNavigate();
  const { organization: org, isLoading } = useOrganization();
  const { logout } = useAuthStore();
  const [exporting, setExporting]   = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmSlug, setConfirmSlug] = useState('');

  const download = async () => {
    setExporting(true);
    try {
      const res = await api.get('/organizations/me/export');
      const bundle = res.data?.data;
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${org?.slug || 'salon'}-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const requestDeletion = async () => {
    if (!org) return;
    if (confirmSlug !== org.slug) {
      toast.error(`Type "${org.slug}" exactly to confirm`);
      return;
    }
    setDeleting(true);
    try {
      await api.post('/organizations/me/request-deletion');
      toast.success('Deletion requested — you will be logged out.');
      setTimeout(() => { logout(); nav('/login', { replace: true }); }, 1200);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not request deletion');
      setDeleting(false);
    }
  };

  if (isLoading || !org) {
    return <div className="p-6"><Loader2 className="w-5 h-5 animate-spin inline" /> Loading…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary-600" />
          <div className="text-xs uppercase font-semibold tracking-widest text-primary-700">Data &amp; Privacy</div>
        </div>
        <h1 className="text-2xl font-bold">Your data, your rules.</h1>
        <p className="text-sm text-gray-500 mt-1">
          Download a copy of everything or delete your salon entirely. Per India's DPDPA rules.
        </p>
      </div>

      {/* Export */}
      <div className="card !p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Download all your data</div>
            <p className="text-sm text-gray-600 mt-1">
              A machine-readable JSON bundle with every row your salon owns —
              users, bookings, customers, sales, memberships, invoices.
            </p>
            <button
              onClick={download}
              disabled={exporting}
              className="mt-3 btn-primary text-sm"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download export
            </button>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card !p-6 border-red-200 bg-red-50/40">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-red-800">Delete your salon</div>
            <p className="text-sm text-red-700 mt-1">
              Your account will be marked <strong>DELETED</strong> immediately and everyone
              on your team will be locked out. Data is retained for 14 days in case you
              change your mind — after that it's permanently purged.
            </p>
            <div className="mt-3">
              <label className="block text-xs font-semibold uppercase tracking-widest text-red-700 mb-1">
                Type "{org.slug}" to confirm
              </label>
              <input
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
                placeholder={org.slug}
                className="w-full max-w-sm px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                onClick={requestDeletion}
                disabled={deleting || confirmSlug !== org.slug || org.slug === 'default'}
                className="mt-3 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg text-sm"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete my salon
              </button>
              {org.slug === 'default' && (
                <p className="text-xs text-red-700 mt-2">The Default Organization can't be deleted.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
