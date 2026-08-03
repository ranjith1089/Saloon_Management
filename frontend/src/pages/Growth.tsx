import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Sparkles, Search, MessageCircle, Phone, Copy, Cake, Clock, AlertTriangle,
  User, TrendingDown,
} from 'lucide-react';
import api from '@/services/api';

type Tab = 'rebook' | 'winback' | 'birthdays';

// ---------- Deep-link helpers ----------
// India-first: strip non-digits, prepend "91" if missing country code.
function normalisePhone(raw: string | null | undefined) {
  if (!raw) return '';
  let digits = String(raw).replace(/[^\d]/g, '');
  if (digits.length === 10) digits = '91' + digits;
  return digits;
}
function waLink(phone: string, text: string) {
  const p = normalisePhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}
function smsLink(phone: string, text: string) {
  return `sms:${phone}?body=${encodeURIComponent(text)}`;
}

// ---------- Default message templates (editable inline per campaign) ----------
const DEFAULT_TEMPLATES: Record<Tab, string> = {
  rebook:
    "Hi {name}! It's been {days} days since your last {service} — hope you enjoyed it 💇. Would you like to book your next visit? Reply YES and we'll set it up.",
  winback:
    "Hey {name}, we've missed you at the salon! It's been {days} days. Come back this week and enjoy 20% off any service on us. Reply YES to book.",
  birthdays:
    "🎉 Happy {when}, {name}! From all of us at the salon — treat yourself to a service this week and enjoy 25% off with code BDAY. See you soon!",
};

function fillTemplate(tpl: string, vars: Record<string, string | number | undefined | null>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined || vars[k] === null ? '' : String(vars[k])));
}

export default function Growth() {
  const [tab, setTab] = useState<Tab>('rebook');
  const [search, setSearch] = useState('');
  const [templates, setTemplates] = useState<Record<Tab, string>>(DEFAULT_TEMPLATES);

  const { data: rebook = [], isLoading: rl } = useQuery({
    queryKey: ['growth-rebook'],
    queryFn: async () => (await api.get('/marketing/rebook-due')).data.data as any[],
  });
  const { data: winback = [], isLoading: wl } = useQuery({
    queryKey: ['growth-winback'],
    queryFn: async () => (await api.get('/marketing/win-back')).data.data as any[],
  });
  const { data: birthdays = [], isLoading: bl } = useQuery({
    queryKey: ['growth-birthdays'],
    queryFn: async () => (await api.get('/marketing/birthdays')).data.data as any[],
  });

  const activeList = tab === 'rebook' ? rebook : tab === 'winback' ? winback : birthdays;
  const isLoading = tab === 'rebook' ? rl : tab === 'winback' ? wl : bl;

  const filtered = useMemo(() => {
    if (!search) return activeList;
    const q = search.toLowerCase();
    return activeList.filter((r: any) => {
      const hay = `${r.firstName || ''} ${r.lastName || ''} ${r.email || ''} ${r.phone || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeList, search]);

  const currentTemplate = templates[tab];
  const setTemplate = (t: string) => setTemplates((prev) => ({ ...prev, [tab]: t }));

  const renderMessage = (row: any) => {
    const vars: Record<string, any> = {
      name: row.firstName || 'there',
      days: row.daysSinceLastVisit,
      service: row.lastService || 'service',
      staff: row.lastStaff || '',
      when:
        tab === 'birthdays'
          ? row.daysUntilBirthday === 0
            ? 'Birthday today'
            : row.daysUntilBirthday === 1
              ? 'Birthday tomorrow'
              : `Birthday coming up`
          : 'visit',
    };
    return fillTemplate(currentTemplate, vars);
  };

  const copyMessage = async (row: any) => {
    try {
      await navigator.clipboard.writeText(renderMessage(row));
      toast.success('Message copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6" /> Growth
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          One-tap outreach to customers who need a nudge. Uses WhatsApp / SMS on the device — no
          extra setup needed.
        </p>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryTile
          active={tab === 'rebook'}
          onClick={() => setTab('rebook')}
          label="Ready to rebook"
          sub="visited 30–89 days ago"
          value={rebook.length}
          icon={<Clock className="w-4 h-4" />}
          tone="blue"
        />
        <SummaryTile
          active={tab === 'winback'}
          onClick={() => setTab('winback')}
          label="Lapsed (win-back)"
          sub="no visit in 90+ days"
          value={winback.length}
          icon={<TrendingDown className="w-4 h-4" />}
          tone="red"
        />
        <SummaryTile
          active={tab === 'birthdays'}
          onClick={() => setTab('birthdays')}
          label="Birthdays this week"
          sub="upcoming 7 days"
          value={birthdays.length}
          icon={<Cake className="w-4 h-4" />}
          tone="pink"
        />
      </div>

      {/* Search + template editor */}
      <div className="card p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <label className="text-[11px] text-gray-500 uppercase tracking-wider">
            Message template — click a customer's WhatsApp / SMS to open the app with this text
            filled in
          </label>
          <textarea
            className="input mt-1 text-sm"
            rows={2}
            value={currentTemplate}
            onChange={(e) => setTemplate(e.target.value)}
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Variables: <code>{'{name}'}</code>{' '}
            {tab !== 'birthdays' && <><code>{'{days}'}</code> <code>{'{service}'}</code> <code>{'{staff}'}</code>{' '}</>}
            {tab === 'birthdays' && <><code>{'{when}'}</code>{' '}</>}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Customer</th>
                <th className="text-left px-4 py-3 font-semibold">
                  {tab === 'birthdays' ? 'Birthday' : 'Last visit'}
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  {tab === 'birthdays' ? 'Contact' : 'Last service / staff'}
                </th>
                <th className="text-left px-4 py-3 font-semibold">Loyalty</th>
                <th className="text-right px-4 py-3 font-semibold">Message via</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-4">
                    <div className="animate-pulse h-4 bg-gray-100 rounded" />
                  </td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16">
                  {tab === 'birthdays' ? (
                    <Cake className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  ) : (
                    <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  )}
                  <p className="text-gray-600 font-medium">
                    {activeList.length === 0
                      ? tab === 'birthdays'
                        ? 'No birthdays this week 🎂'
                        : 'Nothing to nudge — customer base is fresh 🎉'
                      : 'No matches'}
                  </p>
                </td></tr>
              ) : (
                filtered.map((row: any) => {
                  const hasPhone = !!row.phone;
                  return (
                    <tr key={row.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {row.firstName} {row.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{row.email}</div>
                        {row.phone && (
                          <div className="text-xs text-gray-500 font-mono">{row.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {tab === 'birthdays' ? (
                          <>
                            <div>{new Date(row.birthdayOn).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}</div>
                            <div className="text-xs text-gray-500">
                              {row.daysUntilBirthday === 0
                                ? 'Today 🎂'
                                : row.daysUntilBirthday === 1
                                  ? 'Tomorrow'
                                  : `in ${row.daysUntilBirthday} days`}
                            </div>
                          </>
                        ) : (
                          <>
                            <div>{new Date(row.lastVisit).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <div className="text-xs text-gray-500">{row.daysSinceLastVisit} days ago</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {tab === 'birthdays' ? (
                          <span className="text-gray-500">{row.email}</span>
                        ) : (
                          <>
                            <div>{row.lastService || '—'}</div>
                            <div className="text-xs text-gray-500">{row.lastStaff || ''}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          {row.loyaltyPoints} pts
                        </span>
                        <div className="text-[11px] text-gray-500 mt-0.5 tabular-nums">
                          ₹{Number(row.totalSpent).toLocaleString()} lifetime
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {hasPhone ? (
                            <>
                              <a
                                href={waLink(row.phone, renderMessage(row))}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 font-medium"
                                title="Open WhatsApp with the message pre-filled"
                              >
                                <MessageCircle className="w-3 h-3" /> WhatsApp
                              </a>
                              <a
                                href={smsLink(row.phone, renderMessage(row))}
                                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium"
                                title="Open your SMS app with the message pre-filled"
                              >
                                <Phone className="w-3 h-3" /> SMS
                              </a>
                            </>
                          ) : (
                            <span className="text-[11px] text-amber-600 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> no phone
                            </span>
                          )}
                          <button
                            onClick={() => copyMessage(row)}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                            title="Copy the message to clipboard"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>
          <strong>How this works:</strong> WhatsApp / SMS buttons open the messaging app on your
          device with the customer's number and the message pre-filled — you just tap Send. No
          third-party provider setup required.
        </p>
        <p>
          When you're ready to automate (nightly reminders, cron sends), we can wire up the Meta
          WhatsApp Cloud API and an SMS provider so the app sends on its own.
        </p>
      </div>
    </div>
  );
}

function SummaryTile({ label, sub, value, icon, tone, active, onClick }: {
  label: string; sub: string; value: number; icon: React.ReactNode;
  tone: 'blue' | 'red' | 'pink'; active: boolean; onClick: () => void;
}) {
  const tones = {
    blue: { icon: 'bg-blue-100 text-blue-600', ring: 'ring-blue-400' },
    red: { icon: 'bg-red-100 text-red-600', ring: 'ring-red-400' },
    pink: { icon: 'bg-pink-100 text-pink-600', ring: 'ring-pink-400' },
  };
  return (
    <button
      onClick={onClick}
      className={`card text-left w-full transition-all ${active ? `ring-2 ${tones[tone].ring}` : 'hover:border-primary-300'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone].icon}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
        </div>
      </div>
    </button>
  );
}
