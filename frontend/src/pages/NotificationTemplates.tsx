import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  MessageSquare, Plus, Edit2, Trash2, X, Loader2, Save, Info, Bell,
} from 'lucide-react';
import api from '@/services/api';
import Modal from '@/components/Modal';

const TYPES = [
  'BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_REMINDER',
  'BOOKING_CANCELLED', 'BOOKING_COMPLETED', 'PAYMENT_RECEIVED',
  'PROMOTION', 'GENERAL',
] as const;
const CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'PUSH'] as const;

export default function NotificationTemplates() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => (await api.get('/notifications/templates/all')).data.data as any[],
  });

  const del = useMutation({
    mutationFn: async (id: string) => api.delete(`/notifications/templates/${id}`),
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
  });

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (t: any) => { setEditing(t); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" /> Notification Templates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Edit the copy the app sends for booking confirmations, reminders, birthdays and more.
          </p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> New Template
        </button>
      </div>

      <div className="card bg-blue-50 border border-blue-100 flex items-start gap-2 text-sm text-blue-900">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Placeholders</p>
          <p className="text-xs mt-0.5">
            Use <code className="text-[11px] bg-white px-1 rounded">{'{{name}}'}</code>,{' '}
            <code className="text-[11px] bg-white px-1 rounded">{'{{service}}'}</code>,{' '}
            <code className="text-[11px] bg-white px-1 rounded">{'{{date}}'}</code>,{' '}
            <code className="text-[11px] bg-white px-1 rounded">{'{{time}}'}</code>,{' '}
            <code className="text-[11px] bg-white px-1 rounded">{'{{staff}}'}</code>,{' '}
            <code className="text-[11px] bg-white px-1 rounded">{'{{branch}}'}</code>. Any
            variable listed on a template is substituted at send-time; missing values render blank.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Template</th>
                <th className="text-left px-4 py-3 font-semibold">Type</th>
                <th className="text-left px-4 py-3 font-semibold">Channel</th>
                <th className="text-left px-4 py-3 font-semibold">Preview</th>
                <th className="text-left px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No templates yet.</p>
                  <button onClick={openNew} className="btn-primary text-sm mt-3">
                    <Plus className="w-4 h-4 mr-1" /> Add one
                  </button>
                </td></tr>
              ) : (
                data.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.subject || <span className="text-gray-400 italic">(no subject)</span>}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{t.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                        {t.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                        {t.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-md truncate">{t.body}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {t.isActive ? 'Active' : 'Off'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${t.name}"? This can't be undone.`)) {
                              del.mutate(t.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 rounded text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Automated sending on WhatsApp / SMS / Email is not yet wired — for now these templates
        drive in-app notifications only. The Growth page still supports one-tap manual sends.
      </p>

      <TemplateModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        template={editing}
      />
    </div>
  );
}

function TemplateModal({ open, onClose, template }: { open: boolean; onClose: () => void; template: any | null }) {
  const queryClient = useQueryClient();
  const isEdit = !!template;
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      type: 'GENERAL',
      channel: 'IN_APP',
      subject: '',
      body: '',
      variables: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (template) {
      reset({
        name: template.name || '',
        type: template.type || 'GENERAL',
        channel: template.channel || 'IN_APP',
        subject: template.subject || '',
        body: template.body || '',
        variables: (template.variables || []).join(', '),
        isActive: template.isActive ?? true,
      });
    } else if (open) {
      reset();
    }
  }, [template, open, reset]);

  const body = watch('body') || '';

  const save = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        variables: data.variables
          .split(',')
          .map((v: string) => v.trim())
          .filter(Boolean),
      };
      if (isEdit) return api.patch(`/notifications/templates/${template.id}`, payload);
      return api.post('/notifications/templates', payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Template saved' : 'Template created');
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Template' : 'New Template'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit((d) => save.mutate(d))}
            disabled={save.isPending}
            className="btn-primary"
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save</>}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="label">Name (internal) *</label>
            <input className="input font-mono text-sm" {...register('name', { required: true })} placeholder="booking_reminder_24h" />
            {errors.name && <p className="text-xs text-red-600 mt-1">Required</p>}
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" {...register('type')}>
              {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Channel</label>
            <select className="input" {...register('channel')}>
              {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Subject / Title</label>
          <input className="input" {...register('subject')} placeholder="Reminder: your appointment tomorrow" />
        </div>

        <div>
          <label className="label">Body *</label>
          <textarea
            className="input font-mono text-sm"
            rows={5}
            {...register('body', { required: true })}
            placeholder="Hi {{name}}, your booking for {{service}} on {{date}} at {{time}} with {{staff}} is confirmed."
          />
          <p className="text-[11px] text-gray-500 mt-1">
            {body.length} characters · placeholder syntax: <code>{'{{variable}}'}</code>
          </p>
        </div>

        <div>
          <label className="label">Variables (comma-separated)</label>
          <input
            className="input font-mono text-sm"
            {...register('variables')}
            placeholder="name, service, date, time, staff, branch"
          />
          <p className="text-[11px] text-gray-500 mt-1">Documented for internal reference — send code fills whatever it has.</p>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="tpl-active" {...register('isActive')} className="w-4 h-4" />
          <label htmlFor="tpl-active" className="text-sm">Active</label>
        </div>
      </form>
    </Modal>
  );
}
