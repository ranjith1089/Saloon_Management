import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail, Search, X, Loader2, Trash2 } from 'lucide-react';
import api from '@/services/api';

type Status = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'SPAM';

const STATUS_COLORS: Record<Status, string> = {
  NEW: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-700',
  SPAM: 'bg-gray-200 text-gray-700',
};

export default function Inquiries() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['inquiries', status, search],
    queryFn: async () => {
      const params: any = { limit: 200 };
      if (status !== 'ALL') params.status = status;
      if (search) params.search = search;
      return (await api.get('/inquiries', { params })).data;
    },
    refetchInterval: 60_000,
  });

  const inquiries = data?.data || [];
  const newCount = data?.meta?.newCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6" /> Inquiries
          </h1>
          <p className="text-sm text-gray-500 mt-1">Leads from the contact form and other sources</p>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-red-600">{newCount}</span> new
        </div>
      </div>

      <div className="card p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, subject, message…"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['ALL', 'NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                status === s ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600'
              }`}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">From</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Received</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading…</td></tr>
              ) : inquiries.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  No inquiries yet.
                </td></tr>
              ) : (
                inquiries.map((i: any) => (
                  <tr
                    key={i.id}
                    className={`hover:bg-gray-50 cursor-pointer ${i.status === 'NEW' ? 'font-medium' : ''}`}
                    onClick={() => setOpenId(i.id)}
                  >
                    <td className="px-4 py-3">
                      <div>{i.name}</div>
                      <div className="text-xs text-gray-500">{i.email}</div>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{i.subject || <span className="text-gray-400">(no subject)</span>}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {new Date(i.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[i.status as Status]}`}>
                        {i.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-primary-600 hover:underline">Open</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InquiryDrawer
        id={openId}
        onClose={() => setOpenId(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['inquiries'] })}
      />
    </div>
  );
}

function InquiryDrawer({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const { data: inquiry } = useQuery({
    queryKey: ['inquiry', id],
    queryFn: async () => (await api.get(`/inquiries/${id}`)).data.data,
    enabled: !!id,
  });

  // Reset local note whenever a different inquiry loads.
  useState(() => setNote(inquiry?.internalNote || ''));

  const save = useMutation({
    mutationFn: async (patch: { status?: string; internalNote?: string }) =>
      api.patch(`/inquiries/${id}`, patch),
    onSuccess: () => {
      toast.success('Saved');
      queryClient.invalidateQueries({ queryKey: ['inquiry', id] });
      onSaved();
    },
  });

  const del = useMutation({
    mutationFn: async () => api.delete(`/inquiries/${id}`),
    onSuccess: () => {
      toast.success('Deleted');
      onSaved();
      onClose();
    },
  });

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full shadow-xl flex flex-col animate-in slide-in-from-right">
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold">{inquiry?.subject || 'Inquiry'}</h2>
            {inquiry?.status && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inquiry.status as Status]}`}>
                {inquiry.status.replace('_', ' ')}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {!inquiry ? (
            <div className="text-gray-500">Loading…</div>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-500 uppercase">From</p>
                <p className="font-medium">{inquiry.name}</p>
                <p className="text-xs text-gray-600">{inquiry.email}{inquiry.phone ? ` · ${inquiry.phone}` : ''}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(inquiry.createdAt).toLocaleString()}
                  {inquiry.source && <> · via {inquiry.source}</>}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Message</p>
                <div className="bg-gray-50 rounded-lg p-3 whitespace-pre-wrap text-sm">
                  {inquiry.message}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase">Internal note</label>
                <textarea
                  rows={4}
                  className="input mt-1"
                  defaultValue={inquiry.internalNote || ''}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What did we do about this? (only staff sees this)"
                />
                <button
                  onClick={() => save.mutate({ internalNote: note })}
                  disabled={save.isPending}
                  className="btn-secondary text-xs mt-2"
                >
                  {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save note'}
                </button>
              </div>

              {inquiry.respondedAt && (
                <p className="text-xs text-gray-500">
                  Last touched: {new Date(inquiry.respondedAt).toLocaleString()}
                </p>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-100 p-4 flex flex-wrap gap-2">
          {(['NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM'] as Status[])
            .filter((s) => s !== inquiry?.status)
            .map((s) => (
              <button
                key={s}
                onClick={() => save.mutate({ status: s })}
                className="btn-secondary text-xs"
              >
                Mark as {s.replace('_', ' ')}
              </button>
            ))}
          <button
            onClick={() => {
              if (confirm('Delete this inquiry?')) del.mutate();
            }}
            className="btn-danger text-xs ml-auto inline-flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
