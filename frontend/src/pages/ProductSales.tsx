import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search, Package, Plus, Minus, X, User, Building2, CreditCard,
  Receipt, Loader2, ShoppingCart, Ban, Crown, ChevronDown, ChevronUp,
  Banknote, Smartphone, ExternalLink, Percent, IndianRupee,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import Modal from '@/components/Modal';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useDefaultTaxRate } from '@/hooks/useDefaultTaxRate';

interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
  quantity: number;
  image?: string | null;
}

const QUICK_METHODS = [
  { key: 'Cash', label: 'Cash', icon: Banknote },
  { key: 'UPI', label: 'UPI', icon: Smartphone },
  { key: 'Card', label: 'Card', icon: CreditCard },
];

const cartKey = (branchId: string) => `pos.cart.${branchId}`;

export default function ProductSales() {
  const queryClient = useQueryClient();
  const { methods: paymentMethods } = usePaymentMethods();
  const { rate: gstRate, name: taxName } = useDefaultTaxRate();

  const [branchId, setBranchId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountMode, setDiscountMode] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [applyGst, setApplyGst] = useState(false);
  const [notes, setNotes] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [morePayment, setMorePayment] = useState<string>('Cash');
  const [moreRef, setMoreRef] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);

  const { data: branches } = useQuery({
    queryKey: ['branches-select'],
    queryFn: async () => (await api.get('/branches?limit=100')).data.data,
  });

  // Auto-pick the first branch on load so the terminal is ready.
  useEffect(() => {
    if (!branchId && branches && branches.length > 0) setBranchId(branches[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches]);

  const { data: products } = useQuery({
    queryKey: ['products-pos', branchId, search],
    queryFn: async () => {
      const params: any = { limit: 200, isActive: true, branchId };
      if (search) params.search = search;
      return (await api.get('/products', { params })).data.data as any[];
    },
    enabled: !!branchId,
  });

  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => (await api.get('/products/categories')).data.data,
  });

  const { data: activeMembership } = useQuery({
    queryKey: ['active-membership', customerId],
    queryFn: async () => (await api.get(`/memberships/active/${customerId}`)).data.data,
    enabled: !!customerId,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: async () => (await api.get('/customers?limit=500')).data.data,
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff-select-pos', branchId],
    queryFn: async () => (await api.get(`/staff?branchId=${branchId}&limit=100`)).data.data,
    enabled: !!branchId,
  });

  const { data: recentSales, refetch: refetchToday } = useQuery({
    queryKey: ['product-sales-recent', branchId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      return (await api.get('/product-sales', { params: { limit: 30, branchId, date: today } })).data;
    },
    enabled: !!branchId,
  });

  // Persist cart per branch across refreshes / tab switches.
  useEffect(() => {
    if (!branchId) return;
    const raw = localStorage.getItem(cartKey(branchId));
    if (raw) {
      try { setCart(JSON.parse(raw)); } catch { setCart([]); }
    } else {
      setCart([]);
    }
    // Also reset side selections so we don't carry a stale customer/staff across branches
    setCustomerId('');
    setStaffId('');
    setDiscountAmount(0);
    setNotes('');
  }, [branchId]);

  useEffect(() => {
    if (!branchId) return;
    if (cart.length === 0) localStorage.removeItem(cartKey(branchId));
    else localStorage.setItem(cartKey(branchId), JSON.stringify(cart));
  }, [cart, branchId]);

  // Auto-focus search when the terminal loads / after checkout.
  useEffect(() => {
    if (branchId) searchRef.current?.focus();
  }, [branchId]);

  const priceFor = (p: any) =>
    activeMembership && p.memberPrice !== null && p.memberPrice !== undefined
      ? Number(p.memberPrice)
      : Number(p.sellPrice);

  const addToCart = (p: any) => {
    if ((p.stock ?? 0) <= 0) {
      toast.error(`${p.name} is out of stock at this branch`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) {
          toast.error(`Only ${p.stock} in stock`);
          return prev;
        }
        return prev.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        { productId: p.id, name: p.name, unitPrice: priceFor(p), stock: p.stock, quantity: 1, image: p.image || null },
      ];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, quantity: Math.max(0, Math.min(l.stock, l.quantity + delta)) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  };
  const removeLine = (productId: string) => setCart((prev) => prev.filter((l) => l.productId !== productId));
  const clearCart = () => {
    setCart([]);
    setCustomerId('');
    setStaffId('');
    setDiscountAmount(0);
    setApplyGst(false);
    setNotes('');
    localStorage.removeItem(cartKey(branchId));
  };

  const repriceCart = () => {
    if (!products) return;
    setCart((prev) =>
      prev.map((l) => {
        const p = products.find((pp: any) => pp.id === l.productId);
        return p ? { ...l, unitPrice: priceFor(p) } : l;
      })
    );
  };

  const subtotal = useMemo(() => cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0), [cart]);
  const effectiveDiscount = discountMode === 'PERCENT'
    ? Math.min(subtotal, Math.round(subtotal * (discountAmount / 100) * 100) / 100)
    : Math.min(subtotal, discountAmount);
  const taxableBase = Math.max(0, subtotal - effectiveDiscount);
  const taxAmount = applyGst ? Math.round((taxableBase * gstRate) / 100 * 100) / 100 : 0;
  const total = Math.max(0, taxableBase + taxAmount);

  const activeBranch = (branches || []).find((b: any) => b.id === branchId);

  // Products already server-filtered by branch + search. Add category client-side.
  const shownProducts = useMemo(() => {
    const list = (products || []).filter((p: any) => p.isActive !== false);
    if (categoryFilter === 'all') return list;
    return list.filter((p: any) => p.categoryId === categoryFilter);
  }, [products, categoryFilter]);

  // Today's totals for the header banner
  const todayTotal = recentSales?.meta?.totalRevenue ?? 0;
  const todayCount = (recentSales?.data || []).filter((s: any) => !s.voidedAt).length;

  const checkout = useMutation({
    mutationFn: async ({ method, reference }: { method: string; reference?: string }) => {
      const payload = {
        branchId,
        customerId: customerId || undefined,
        staffId: staffId || undefined,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        discountAmount: effectiveDiscount,
        taxRate: applyGst ? gstRate : 0,
        paymentMethod: method,
        notes: [reference && `Ref: ${reference}`, notes].filter(Boolean).join(' · ') || undefined,
      };
      return (await api.post('/product-sales', payload)).data;
    },
    onSuccess: (res, vars) => {
      toast.success(`Sale ${res.data.saleNumber} · ${vars.method} · ₹${Number(res.data.totalAmount).toLocaleString()}`);
      clearCart();
      setMoreOpen(false);
      setMoreRef('');
      queryClient.invalidateQueries({ queryKey: ['product-sales-recent'] });
      queryClient.invalidateQueries({ queryKey: ['products-pos'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-home'] });
      refetchToday();
      setTimeout(() => searchRef.current?.focus(), 100);
    },
  });

  const voidMut = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/product-sales/${id}/void`, { reason }),
    onSuccess: () => {
      toast.success('Sale voided — stock restored');
      queryClient.invalidateQueries({ queryKey: ['product-sales-recent'] });
      queryClient.invalidateQueries({ queryKey: ['products-pos'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return (
    <div className="space-y-4">
      {/* Terminal header — branch + live today counter */}
      <div className="card !p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Selling at</div>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="text-lg font-bold bg-transparent border-0 focus:outline-none focus:ring-0 pr-8 -ml-1"
            >
              {(branches || []).map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-right">
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">Today's revenue</div>
            <div className="text-2xl font-bold tabular-nums text-green-700">
              ₹{Number(todayTotal).toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">Sales</div>
            <div className="text-2xl font-bold tabular-nums">{todayCount}</div>
          </div>
        </div>
      </div>

      {!branchId ? (
        <div className="card text-center py-16 text-gray-500">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p>No branch to sell from. Create a branch first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* LEFT — product picker */}
          <div className="lg:col-span-3 space-y-3">
            {/* Category chips */}
            {(categories || []).length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <ChipBtn active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
                  All ({products?.length || 0})
                </ChipBtn>
                {(categories || []).map((c: any) => {
                  const count = (products || []).filter((p: any) => p.categoryId === c.id).length;
                  if (count === 0) return null;
                  return (
                    <ChipBtn key={c.id} active={categoryFilter === c.id} onClick={() => setCategoryFilter(c.id)}>
                      {c.name} ({count})
                    </ChipBtn>
                  );
                })}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                className="input pl-9 !py-3 text-base"
                placeholder="Search or scan barcode…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2.5 p-1 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Product tiles */}
            {shownProducts.length === 0 ? (
              <div className="card text-center py-16">
                <Package className="w-14 h-14 mx-auto text-gray-300 mb-3" />
                {(products?.length ?? 0) === 0 ? (
                  <>
                    <p className="text-gray-700 font-medium">
                      No products at {activeBranch?.name || 'this branch'} yet
                    </p>
                    <p className="text-xs text-gray-500 mt-1 mb-4">
                      Stock a product at this branch to start selling.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Link
                        to={`/products?branchId=${branchId}`}
                        className="btn-primary text-sm inline-flex items-center gap-1"
                      >
                        <Package className="w-4 h-4" /> Add product to this branch
                      </Link>
                      <Link
                        to="/products"
                        className="btn-secondary text-sm inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" /> Manage all products
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-700 font-medium">No matches</p>
                    <p className="text-xs text-gray-500 mt-1">Try a different name or category.</p>
                    <button className="btn-secondary text-xs mt-3" onClick={() => { setSearch(''); setCategoryFilter('all'); }}>
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {shownProducts.map((p: any) => {
                  const out = (p.stock ?? 0) <= 0;
                  const low = !out && p.stock <= (p.reorderLevel ?? 5);
                  const useMember = activeMembership && p.memberPrice !== null && p.memberPrice !== undefined;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      disabled={out}
                      className={`relative card !p-2.5 text-left transition-all rounded-xl border-2 ${
                        out
                          ? 'opacity-40 cursor-not-allowed border-transparent'
                          : 'border-transparent hover:border-primary-400 hover:shadow-md active:scale-[0.98]'
                      }`}
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-2">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        ) : (
                          <Package className="w-10 h-10 text-gray-300" />
                        )}
                        {out && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                            <span className="text-white text-xs font-bold tracking-wider">SOLD OUT</span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium leading-tight line-clamp-2 min-h-[2.5em]">
                        {p.name}
                      </div>
                      {p.brand && <div className="text-[11px] text-gray-500 truncate">{p.brand}</div>}
                      <div className="flex items-baseline justify-between mt-1.5">
                        <div>
                          {useMember && (
                            <div className="text-[10px] text-amber-700 font-semibold leading-none">MEMBER</div>
                          )}
                          <div className="text-base font-bold text-primary-700 tabular-nums">
                            ₹{priceFor(p).toLocaleString()}
                          </div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          out ? 'bg-red-100 text-red-700'
                          : low ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-50 text-green-700'
                        }`}>
                          {out ? 'Out' : `${p.stock}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT — sticky cart */}
          <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start space-y-2">
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold">Cart</span>
                  {cart.length > 0 && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                      {cart.reduce((s, l) => s + l.quantity, 0)}
                    </span>
                  )}
                </div>
                {cart.length > 0 && (
                  <button onClick={clearCart} className="text-xs text-red-600 hover:underline">
                    Clear
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Tap a product to add it here</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    {cart.map((l) => (
                      <div key={l.productId} className="p-3 flex items-center gap-2">
                        {l.image ? (
                          <img src={l.image} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{l.name}</div>
                          <div className="text-xs text-gray-500 tabular-nums">
                            ₹{l.unitPrice.toLocaleString()} × {l.quantity} = ₹{(l.unitPrice * l.quantity).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button onClick={() => updateQty(l.productId, -1)} className="p-1 hover:bg-gray-100 rounded">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">{l.quantity}</span>
                          <button
                            onClick={() => updateQty(l.productId, 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                            disabled={l.quantity >= l.stock}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeLine(l.productId)}
                            className="p-1 hover:bg-red-50 rounded text-red-600 ml-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer / Staff */}
                  <div className="p-3 space-y-2 border-t border-gray-100 bg-gray-50/50">
                    <div>
                      <label className="text-[11px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3" /> Customer
                      </label>
                      <select
                        className="input !py-1.5 text-sm mt-0.5"
                        value={customerId}
                        onChange={(e) => {
                          setCustomerId(e.target.value);
                          setTimeout(repriceCart, 250);
                        }}
                      >
                        <option value="">Walk-in customer</option>
                        {customers?.map((c: any) => (
                          <option key={c.userId} value={c.userId}>
                            {c.user?.profile?.firstName} {c.user?.profile?.lastName}
                          </option>
                        ))}
                      </select>
                      {activeMembership && (
                        <div className="mt-1.5 flex items-center gap-1 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                          <Crown className="w-3 h-3" />
                          <span className="font-semibold">{activeMembership.plan?.name} member</span>
                          <span className="ml-auto">member prices applied</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 uppercase tracking-wider">Sold by</label>
                      <select
                        className="input !py-1.5 text-sm mt-0.5"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                      >
                        <option value="">— No staff attributed —</option>
                        {staffList?.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.user?.profile?.firstName} {s.user?.profile?.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Discount */}
                    <div>
                      <label className="text-[11px] text-gray-500 uppercase tracking-wider">Discount</label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <button
                          type="button"
                          onClick={() => setDiscountMode('AMOUNT')}
                          className={`px-2 py-1 text-xs rounded ${
                            discountMode === 'AMOUNT' ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <IndianRupee className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountMode('PERCENT')}
                          className={`px-2 py-1 text-xs rounded ${
                            discountMode === 'PERCENT' ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Percent className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={discountMode === 'PERCENT' ? 100 : subtotal}
                          className="input !py-1.5 text-sm flex-1 text-right tabular-nums"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Tax */}
                    <div>
                      <label className="text-[11px] text-gray-500 uppercase tracking-wider">Tax</label>
                      <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 mt-0.5 w-fit">
                        <button
                          type="button"
                          onClick={() => setApplyGst(false)}
                          className={`px-3 py-1 text-xs font-medium rounded-md ${
                            !applyGst ? 'bg-primary-50 text-primary-700' : 'text-gray-600'
                          }`}
                        >
                          Non GST
                        </button>
                        <button
                          type="button"
                          onClick={() => setApplyGst(true)}
                          className={`px-3 py-1 text-xs font-medium rounded-md ${
                            applyGst ? 'bg-primary-50 text-primary-700' : 'text-gray-600'
                          }`}
                        >
                          {taxName} {gstRate}%
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="p-3 border-t border-gray-100 space-y-1 text-sm tabular-nums">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    {effectiveDiscount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Discount</span>
                        <span>−₹{effectiveDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    {applyGst && taxAmount > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>{taxName} ({gstRate}%)</span>
                        <span>+₹{taxAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200 text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary-700">₹{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Quick-pay buttons */}
                  <div className="p-3 border-t border-gray-100 bg-gray-50 grid grid-cols-3 gap-2">
                    {QUICK_METHODS.map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.key}
                          onClick={() => checkout.mutate({ method: m.key })}
                          disabled={checkout.isPending}
                          className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-white border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Icon className="w-5 h-5 text-gray-700" />
                          <span className="text-xs font-semibold text-gray-800">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => setMoreOpen(true)}
                      className="text-xs text-gray-500 hover:text-primary-600 w-full text-center py-1"
                    >
                      Other payment method / add reference…
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Notes tucked below cart card so it doesn't clutter the pay area */}
            {cart.length > 0 && (
              <div className="card !p-2">
                <input
                  className="input !py-1.5 text-sm border-0 focus:ring-0"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note for this sale (optional)…"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today's sales — collapsed by default */}
      {branchId && (
        <div className="card p-0 overflow-hidden">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <Receipt className="w-4 h-4 text-gray-500" />
              <span className="font-semibold">Today's Sales</span>
              <span className="text-xs text-gray-500">
                · {todayCount} · ₹{Number(todayTotal).toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-gray-400">{historyOpen ? 'Hide' : 'Show'}</span>
          </button>
          {historyOpen && (
            <div className="border-t border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-semibold">#</th>
                    <th className="px-4 py-2 font-semibold">Time</th>
                    <th className="px-4 py-2 font-semibold">Items</th>
                    <th className="px-4 py-2 font-semibold">Customer</th>
                    <th className="px-4 py-2 font-semibold">Staff</th>
                    <th className="px-4 py-2 font-semibold text-right">Total</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(recentSales?.data || []).length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-6 text-gray-500">No sales yet today.</td></tr>
                  ) : (
                    recentSales?.data?.map((s: any) => (
                      <tr key={s.id} className={s.voidedAt ? 'opacity-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-2 font-mono text-xs">{s.saleNumber}</td>
                        <td className="px-4 py-2 text-xs">{new Date(s.createdAt).toLocaleTimeString()}</td>
                        <td className="px-4 py-2">{s.items?.length || 0}</td>
                        <td className="px-4 py-2">{s.customer?.profile?.firstName || 'Walk-in'}</td>
                        <td className="px-4 py-2">{s.staff?.user?.profile?.firstName || '—'}</td>
                        <td className="px-4 py-2 text-right font-medium tabular-nums">
                          {s.voidedAt && <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded mr-2">VOID</span>}
                          ₹{Number(s.totalAmount).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setDetailId(s.id)} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="View">
                              <Receipt className="w-4 h-4" />
                            </button>
                            {!s.voidedAt && (
                              <button
                                onClick={() => {
                                  const reason = prompt('Void reason?');
                                  if (reason) voidMut.mutate({ id: s.id, reason });
                                }}
                                className="p-1 hover:bg-red-50 rounded text-red-600" title="Void"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <SaleDetailModal id={detailId} onClose={() => setDetailId(null)} />

      {/* Other-method modal for less-common payments or when a ref is needed */}
      <Modal
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Complete sale"
        size="sm"
        footer={
          <>
            <button onClick={() => setMoreOpen(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => checkout.mutate({ method: morePayment, reference: moreRef || undefined })}
              disabled={checkout.isPending}
              className="btn-primary"
            >
              {checkout.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Collect ₹${total.toLocaleString()}`}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={morePayment} onChange={(e) => setMorePayment(e.target.value)}>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Reference / Transaction ID</label>
            <input
              className="input font-mono"
              value={moreRef}
              onChange={(e) => setMoreRef(e.target.value)}
              placeholder="Optional — UPI ref, card slip #, etc."
            />
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            {effectiveDiscount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>−₹{effectiveDiscount.toLocaleString()}</span></div>}
            {applyGst && <div className="flex justify-between text-gray-700"><span>{taxName} ({gstRate}%)</span><span>+₹{taxAmount.toLocaleString()}</span></div>}
            <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
              <span>Total</span><span className="text-primary-700">₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ChipBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
        active ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function SaleDetailModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['product-sale', id],
    queryFn: async () => (await api.get(`/product-sales/${id}`)).data.data,
    enabled: !!id,
  });

  return (
    <Modal open={!!id} onClose={onClose} title={data?.saleNumber || 'Sale'} size="md">
      {!data ? <div className="text-center py-6 text-gray-500">Loading…</div> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Date">{new Date(data.createdAt).toLocaleString()}</Field>
            <Field label="Payment">{data.paymentMethod || '—'}</Field>
            <Field label="Customer">{data.customer?.profile?.firstName ? `${data.customer.profile.firstName} ${data.customer.profile.lastName}` : 'Walk-in'}</Field>
            <Field label="Staff">{data.staff?.user?.profile?.firstName || '—'}</Field>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Item</th>
                  <th className="text-right px-3 py-2 font-medium">Qty</th>
                  <th className="text-right px-3 py-2 font-medium">Price</th>
                  <th className="text-right px-3 py-2 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items?.map((i: any) => (
                  <tr key={i.id}>
                    <td className="px-3 py-2">{i.product?.name}</td>
                    <td className="px-3 py-2 text-right">{i.quantity}</td>
                    <td className="px-3 py-2 text-right">₹{Number(i.unitPrice).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-medium">₹{Number(i.subtotal).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{Number(data.subtotal).toLocaleString()}</span></div>
            {Number(data.discountAmount) > 0 && (
              <div className="flex justify-between text-green-700"><span>Discount</span><span>−₹{Number(data.discountAmount).toLocaleString()}</span></div>
            )}
            {Number(data.taxAmount) > 0 && (
              <div className="flex justify-between text-gray-700"><span>Tax</span><span>+₹{Number(data.taxAmount).toLocaleString()}</span></div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
              <span>Total</span>
              <span className="text-primary-600">₹{Number(data.totalAmount).toLocaleString()}</span>
            </div>
          </div>
          {data.voidedAt && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-red-800">VOIDED</p>
              <p className="text-red-700 text-xs mt-0.5">{new Date(data.voidedAt).toLocaleString()}</p>
              {data.voidReason && <p className="text-red-700 text-xs mt-1">Reason: {data.voidReason}</p>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <div className="text-gray-900">{children}</div>
    </div>
  );
}
