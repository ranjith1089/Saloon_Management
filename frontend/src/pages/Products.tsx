import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus, Package, Search, AlertTriangle, Clock, Edit2, Trash2, Filter, Building2,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import api from '@/services/api';
import NewProductModal from '@/components/NewProductModal';

const DAY_MS = 24 * 60 * 60 * 1000;

function expiryTone(dateStr?: string | null): 'expired' | 'soon' | 'ok' | 'none' {
  if (!dateStr) return 'none';
  const now = Date.now();
  const t = new Date(dateStr).getTime();
  const daysLeft = (t - now) / DAY_MS;
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'soon';
  return 'ok';
}

export default function Products() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, branchFilter, categoryFilter],
    queryFn: async () => {
      const params: any = { limit: 200 };
      if (search) params.search = search;
      if (branchFilter) params.branchId = branchFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      return (await api.get('/products', { params })).data;
    },
  });

  const { data: branches } = useQuery({
    queryKey: ['branches-select'],
    queryFn: async () => (await api.get('/branches?limit=100')).data.data,
  });
  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => (await api.get('/products/categories')).data.data,
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success('Product deactivated');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const products = data?.data || [];
  const isBranchScoped = !!branchFilter;

  // With a branch filter, `stock` on each product is that branch's stock and
  // `reorderLevel` too — the backend enriches it. Without a filter, we work
  // against totalStock across all branches for the low-stock toggle to be
  // meaningful.
  const filtered = useMemo(() => {
    if (!lowStockOnly) return products;
    return (products as any[]).filter((p) => {
      if (isBranchScoped) return p.stock <= (p.reorderLevel ?? 5);
      return (p.branchStocks || []).some((bs: any) => bs.stock <= bs.reorderLevel);
    });
  }, [products, lowStockOnly, isBranchScoped]);

  const summary = useMemo(() => {
    let totalStockValue = 0;
    let lowStockRows = 0;
    let expiring = 0;
    (products as any[]).forEach((p) => {
      if (isBranchScoped) totalStockValue += Number(p.buyPrice) * (p.stock || 0);
      else totalStockValue += Number(p.buyPrice) * (p.totalStock || 0);
      const low = isBranchScoped
        ? p.stock <= (p.reorderLevel ?? 5)
        : (p.branchStocks || []).some((bs: any) => bs.stock <= bs.reorderLevel);
      if (low) lowStockRows++;
      if (p.expiryDate) {
        const tone = expiryTone(p.expiryDate);
        if (tone === 'expired' || tone === 'soon') expiring++;
      }
    });
    return { totalStockValue, lowStock: lowStockRows, expiring, total: products.length };
  }, [products, isBranchScoped]);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Shared catalog — stock is tracked per branch
          </p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> New Product
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Products" value={summary.total} icon={<Package className="w-5 h-5" />} tone="blue" />
        <StatCard
          label={isBranchScoped ? 'Stock value (this branch)' : 'Stock value (all branches)'}
          value={`₹${summary.totalStockValue.toLocaleString()}`}
          icon={<Package className="w-5 h-5" />}
          tone="green"
        />
        <StatCard label="Low stock" value={summary.lowStock} icon={<AlertTriangle className="w-5 h-5" />} tone="yellow" />
        <StatCard label="Expiring / expired" value={summary.expiring} icon={<Clock className="w-5 h-5" />} tone="red" />
      </div>

      <div className="card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, brand, SKU, barcode…"
              className="input pl-9"
            />
          </div>
          <select className="input max-w-[200px]" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
            <option value="">All branches</option>
            {branches?.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select className="input max-w-[200px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => setLowStockOnly((v) => !v)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border inline-flex items-center gap-1 ${
              lowStockOnly ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            <Filter className="w-3.5 h-3.5" /> Low stock only
          </button>
        </div>
        <p className="text-[11px] text-gray-500 mt-2 pl-1">
          {isBranchScoped
            ? 'Showing this branch\'s stock. Click a row to see the per-branch breakdown.'
            : 'Showing total stock across all branches. Filter by branch to see one branch\'s counts.'}
        </p>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-6"></th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Category</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">MRP</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Buy</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Sell</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Member</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">
                  {isBranchScoped ? 'Stock' : 'Stock (total)'}
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Expiry</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Branches</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={11} className="text-center py-8 text-gray-500">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-10 text-gray-500">
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No products found</p>
                  <button onClick={openNew} className="btn-primary mt-3"><Plus className="w-4 h-4 mr-1" />Add Product</button>
                </td></tr>
              ) : (
                filtered.map((p: any) => {
                  const tone = expiryTone(p.expiryDate);
                  const branchStocks: any[] = p.branchStocks || [];
                  const anyLow = isBranchScoped
                    ? p.stock <= (p.reorderLevel ?? 5)
                    : branchStocks.some((bs) => bs.stock <= bs.reorderLevel);
                  const isExpanded = expanded[p.id];
                  return (
                    <>
                      <tr key={p.id} className={`hover:bg-gray-50 ${!p.isActive ? 'opacity-60' : ''}`}>
                        <td className="px-2 py-3">
                          <button
                            onClick={() => setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))}
                            className="p-1 text-gray-400 hover:text-gray-700"
                            disabled={branchStocks.length === 0}
                            title="Toggle per-branch stock"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img src={p.image} alt="" className="w-9 h-9 rounded object-cover bg-gray-100" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            ) : (
                              <div className="w-9 h-9 rounded bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{p.name}</div>
                              {p.brand && <div className="text-xs text-gray-500">{p.brand}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.category?.name || '—'}</td>
                        <td className="px-4 py-3 text-right text-gray-500 line-through">₹{Number(p.mrp).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">₹{Number(p.buyPrice).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-semibold text-primary-600">₹{Number(p.sellPrice).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          {p.memberPrice !== null && p.memberPrice !== undefined ? (
                            <span className="font-semibold text-amber-700">₹{Number(p.memberPrice).toLocaleString()}</span>
                          ) : (
                            <span className="text-xs text-gray-400">same</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded font-medium ${anyLow ? 'bg-yellow-100 text-yellow-800' : 'text-gray-700'}`}>
                            {isBranchScoped ? p.stock : p.totalStock ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.expiryDate ? (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              tone === 'expired' ? 'bg-red-100 text-red-700'
                              : tone === 'soon' ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                            }`}>
                              {new Date(p.expiryDate).toLocaleDateString()}
                            </span>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {branchStocks.length === 0 ? (
                            <span className="text-xs text-red-600">not stocked</span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {branchStocks.length} branch{branchStocks.length === 1 ? '' : 'es'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deactivate "${p.name}"? Historical sales are preserved.`)) {
                                  deleteMut.mutate(p.id);
                                }
                              }}
                              className="p-1.5 hover:bg-red-50 rounded text-red-600"
                              title="Deactivate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && branchStocks.length > 0 && (
                        <tr key={p.id + '-detail'} className="bg-gray-50/60">
                          <td></td>
                          <td colSpan={10} className="px-4 py-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {branchStocks.map((bs) => {
                                const low = bs.stock <= bs.reorderLevel;
                                return (
                                  <div
                                    key={bs.branchId}
                                    className={`px-3 py-2 rounded-lg border text-xs ${
                                      low ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div className="font-medium truncate">{bs.branch?.name || bs.branchId}</div>
                                    <div className="flex items-baseline justify-between mt-1">
                                      <span className={low ? 'font-semibold text-yellow-800' : 'font-semibold'}>
                                        {bs.stock}
                                      </span>
                                      <span className="text-[10px] text-gray-500">alert ≤ {bs.reorderLevel}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewProductModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} product={editing} />
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: any; icon: React.ReactNode; tone: 'blue' | 'green' | 'yellow' | 'red' }) {
  const tones = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums break-all">{value}</p>
        </div>
        <div className={`w-12 h-12 ${tones[tone]} rounded-xl flex items-center justify-center flex-shrink-0`}>{icon}</div>
      </div>
    </div>
  );
}
