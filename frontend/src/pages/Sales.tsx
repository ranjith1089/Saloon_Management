/**
 * Unified POS — sells products AND services on one ticket, and collects
 * payment for existing pending bookings. Replaces the old /product-sales +
 * /service-payment-collection pages (they redirect here).
 *
 * Flow:
 *   1. Pick branch (auto-picks first)
 *   2. Left panel toggles between [Products] and [Services]; tapping a tile
 *      adds a line to the shared cart on the right
 *   3. "Attach pending booking" side widget prefills a service line + customer
 *      from an existing PENDING booking; on checkout that booking flips to
 *      COMPLETED + PAID via /bookings/:id/collect-payment
 *   4. Checkout fires sequentially:
 *        - one POST /product-sales with all product lines (if any)
 *        - one POST /bookings/quick-sale per unattached service line
 *        - one POST /bookings/:id/collect-payment per attached service line
 *   5. On success a printable Receipt modal appears
 *
 * Cart persists in localStorage per branch as `sales.cart.<branchId>`.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search, Package, Plus, Minus, X, User, Building2, CreditCard,
  Loader2, ShoppingCart, Scissors, Banknote, Smartphone,
  Link2, Printer, IndianRupee,
} from 'lucide-react';
import api from '@/services/api';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useDefaultTaxRate } from '@/hooks/useDefaultTaxRate';
import Receipt, { ReceiptData } from '@/components/Receipt';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ProductLine = {
  kind: 'PRODUCT';
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
  quantity: number;
  image?: string | null;
};
type ServiceLine = {
  kind: 'SERVICE';
  lineId: string;                  // client-side id for keying
  serviceId: string;
  name: string;
  unitPrice: number;
  duration: number;
  staffId?: string;                // required for unattached (quick-sale)
  staffName?: string;              // display-only, resolved when line is added
  attachedBookingId?: string;      // if set, pays that pending booking
};
type CartLine = ProductLine | ServiceLine;

const QUICK_METHODS = [
  { key: 'Cash', label: 'Cash', icon: Banknote },
  { key: 'UPI', label: 'UPI', icon: Smartphone },
  { key: 'Card', label: 'Card', icon: CreditCard },
];

const cartKey = (branchId: string) => `sales.cart.${branchId}`;
const uid = () => Math.random().toString(36).slice(2, 10);
const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Sales() {
  const queryClient = useQueryClient();
  const { methods: paymentMethods } = usePaymentMethods();
  const { rate: gstRate } = useDefaultTaxRate();

  const [branchId, setBranchId] = useState('');
  const [tab, setTab] = useState<'products' | 'services'>('products');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [applyGst, setApplyGst] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // -------------------------- Data --------------------------
  const { data: branches } = useQuery({
    queryKey: ['branches-select'],
    queryFn: async () => (await api.get('/branches?limit=100')).data.data as any[],
  });
  useEffect(() => {
    if (!branchId && branches && branches.length > 0) setBranchId(branches[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches]);

  const { data: products } = useQuery({
    queryKey: ['sales-products', branchId, search],
    queryFn: async () => {
      const params: any = { limit: 200, isActive: true, branchId };
      if (search) params.search = search;
      return (await api.get('/products', { params })).data.data as any[];
    },
    enabled: !!branchId && tab === 'products',
  });

  const { data: services } = useQuery({
    queryKey: ['sales-services', branchId, search],
    queryFn: async () => {
      const params: any = { limit: 200, status: true };
      if (search) params.search = search;
      return (await api.get('/services', { params })).data.data as any[];
    },
    enabled: !!branchId && tab === 'services',
  });

  const { data: staff } = useQuery({
    queryKey: ['sales-staff', branchId],
    queryFn: async () => (await api.get('/staff', { params: { branchId, limit: 200 } })).data.data as any[],
    enabled: !!branchId,
  });

  const { data: pendingBookings } = useQuery({
    queryKey: ['sales-pending', branchId],
    queryFn: async () => {
      const t = new Date().toISOString().split('T')[0];
      return (await api.get('/bookings', {
        params: { branchId, status: 'PENDING,CONFIRMED', startDate: t, endDate: t, limit: 50 },
      })).data.data as any[];
    },
    enabled: !!branchId,
    staleTime: 30_000,
  });

  const branch = useMemo(() => branches?.find((b: any) => b.id === branchId), [branches, branchId]);

  // -------------------------- Cart persistence --------------------------
  useEffect(() => {
    if (!branchId) return;
    const raw = localStorage.getItem(cartKey(branchId));
    if (raw) { try { setCart(JSON.parse(raw)); } catch { setCart([]); } } else setCart([]);
    setWalkInName(''); setWalkInPhone(''); setCustomerId(''); setStaffId('');
  }, [branchId]);
  useEffect(() => {
    if (!branchId) return;
    localStorage.setItem(cartKey(branchId), JSON.stringify(cart));
  }, [cart, branchId]);

  // -------------------------- Cart mutators --------------------------
  const addProduct = (p: any) => {
    setCart((c) => {
      const existing = c.find((l) => l.kind === 'PRODUCT' && l.productId === p.id) as ProductLine | undefined;
      if (existing) {
        if (existing.quantity >= (p.stock ?? 0)) {
          toast.error('Out of stock');
          return c;
        }
        return c.map((l) => l.kind === 'PRODUCT' && l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      if ((p.stock ?? 0) <= 0) { toast.error('Out of stock'); return c; }
      return [...c, {
        kind: 'PRODUCT', productId: p.id, name: p.name,
        unitPrice: Number(p.sellPrice ?? 0),
        stock: p.stock ?? 0, quantity: 1, image: p.image,
      }];
    });
  };

  const addService = (s: any, attachedBookingId?: string) => {
    const pickedStaff = staff?.find((x: any) => x.id === staffId);
    const staffName = pickedStaff
      ? [pickedStaff.user?.profile?.firstName, pickedStaff.user?.profile?.lastName].filter(Boolean).join(' ')
      : undefined;
    setCart((c) => [...c, {
      kind: 'SERVICE',
      lineId: uid(),
      serviceId: s.id,
      name: s.name,
      unitPrice: Number(s.price ?? 0),
      duration: s.duration ?? 30,
      staffId: staffId || undefined,
      staffName,
      attachedBookingId,
    }]);
  };

  const removeLine = (idx: number) => setCart((c) => c.filter((_, i) => i !== idx));
  const bumpQty = (idx: number, delta: number) => {
    setCart((c) => c.map((l, i) => {
      if (i !== idx || l.kind !== 'PRODUCT') return l;
      const next = l.quantity + delta;
      if (next < 1) return l;
      if (next > l.stock) { toast.error('At stock limit'); return l; }
      return { ...l, quantity: next };
    }));
  };
  const clearCart = () => setCart([]);

  // Attach an existing PENDING booking → add service line + set customer.
  // Guards against attaching the same booking twice (would create two
  // collect-payment calls on the same record) and populates every visible
  // field so the operator can see what's on the ticket at a glance.
  const attachBooking = (b: any) => {
    const already = cart.some((l) => l.kind === 'SERVICE' && l.attachedBookingId === b.id);
    if (already) {
      toast.error('That booking is already on the ticket');
      return;
    }

    // Resolve customer name/phone for display — works for both registered
    // customers (via profile) and walk-ins.
    const customerName = b.customer?.profile
      ? [b.customer.profile.firstName, b.customer.profile.lastName].filter(Boolean).join(' ')
      : b.walkInName || '';
    const customerPhone = b.customer?.profile?.phone || b.walkInPhone || '';

    if (b.customer?.id) setCustomerId(b.customer.id);
    if (customerName) setWalkInName(customerName);
    if (customerPhone) setWalkInPhone(customerPhone);

    const staffName = b.staff
      ? [b.staff.user?.profile?.firstName, b.staff.user?.profile?.lastName].filter(Boolean).join(' ')
      : undefined;

    setCart((c) => [...c, {
      kind: 'SERVICE',
      lineId: uid(),
      serviceId: b.service.id,
      name: b.service.name,
      unitPrice: Number(b.totalAmount ?? b.service.price),
      duration: b.service.duration,
      staffId: b.staff?.id,
      staffName,
      attachedBookingId: b.id,
    }]);
    toast.success(`Attached: ${b.service.name}${customerName ? ' · ' + customerName : ''}`);
    setAttachOpen(false);
  };

  // -------------------------- Totals --------------------------
  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * (l.kind === 'PRODUCT' ? l.quantity : 1), 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = applyGst ? Math.round(afterDiscount * (gstRate / 100) * 100) / 100 : 0;
  const total = afterDiscount + tax;

  // -------------------------- Checkout --------------------------
  const checkout = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error('Cart is empty');
      // If there are unattached service lines, they need a staffId.
      const unattachedService = cart.find((l): l is ServiceLine =>
        l.kind === 'SERVICE' && !l.attachedBookingId && !l.staffId
      );
      if (unattachedService) throw new Error('Pick a staff member for services');

      const productLines = cart.filter((l): l is ProductLine => l.kind === 'PRODUCT');
      const serviceLines = cart.filter((l): l is ServiceLine => l.kind === 'SERVICE');

      const results: { kind: string; id?: string; number?: string; amount: number; error?: string }[] = [];

      // 1. Product ticket (all product lines in one sale)
      if (productLines.length > 0) {
        try {
          const productSubtotal = productLines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
          const productShare = subtotal > 0 ? productSubtotal / subtotal : 1;
          const res = await api.post('/product-sales', {
            branchId,
            customerId: customerId || undefined,
            staffId: staffId || undefined,
            items: productLines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
            discountAmount: Math.round(discount * productShare * 100) / 100,
            taxRate: applyGst ? gstRate : 0,
            paymentMethod,
            notes: notes || undefined,
          });
          results.push({
            kind: 'PRODUCT',
            id: res.data?.data?.id,
            number: res.data?.data?.saleNumber,
            amount: Number(res.data?.data?.totalAmount || 0),
          });
        } catch (e: any) {
          results.push({ kind: 'PRODUCT', amount: 0, error: e?.response?.data?.message || 'Product sale failed' });
        }
      }

      // 2. Service lines — one call each
      for (const line of serviceLines) {
        try {
          if (line.attachedBookingId) {
            const res = await api.post(`/bookings/${line.attachedBookingId}/collect-payment`, {
              method: paymentMethod,
              amount: Number(line.unitPrice),
              taxRate: applyGst ? gstRate : 0,
              markCompleted: true,
            });
            results.push({
              kind: 'SERVICE',
              id: res.data?.data?.id,
              number: res.data?.data?.bookingNumber,
              amount: Number(res.data?.data?.totalAmount || line.unitPrice),
            });
          } else {
            const payload: any = {
              branchId,
              serviceId: line.serviceId,
              staffId: line.staffId,
              amount: Number(line.unitPrice),
              taxRate: applyGst ? gstRate : 0,
              paymentMethod,
              notes: notes || undefined,
            };
            if (customerId) payload.customerId = customerId;
            else {
              payload.walkInName = walkInName?.trim() || 'Walk-in customer';
              payload.walkInPhone = walkInPhone || undefined;
            }
            const res = await api.post('/bookings/quick-sale', payload);
            results.push({
              kind: 'SERVICE',
              id: res.data?.data?.id,
              number: res.data?.data?.bookingNumber,
              amount: Number(res.data?.data?.totalAmount || line.unitPrice),
            });
          }
        } catch (e: any) {
          results.push({ kind: 'SERVICE', amount: 0, error: e?.response?.data?.message || 'Service sale failed' });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const failures = results.filter((r) => r.error);
      if (failures.length === 0) {
        toast.success(`Sale · ${money(total)}`);
      } else if (failures.length === results.length) {
        toast.error(failures[0].error || 'All lines failed');
        return;
      } else {
        toast(`${results.length - failures.length}/${results.length} lines saved. Check receipt.`);
      }

      // One receipt id per checkout — the individual booking / product-sale
      // numbers are still visible on the Bookings and Products pages.
      const receiptData: ReceiptData = {
        salonName: branch?.name || 'Salon',
        salonAddress: branch?.address || '',
        salonPhone: branch?.phone || '',
        receiptNumber: `R${Date.now().toString().slice(-10)}`,
        date: new Date().toISOString(),
        customerName: walkInName || (customerId ? '(Registered customer)' : 'Walk-in customer'),
        customerPhone: walkInPhone || '',
        paymentMethod,
        lines: cart.map((l) => ({
          name: l.name + (l.kind === 'PRODUCT' && l.quantity > 1 ? ` × ${l.quantity}` : ''),
          type: l.kind,
          amount: l.unitPrice * (l.kind === 'PRODUCT' ? l.quantity : 1),
        })),
        subtotal,
        discount,
        taxRate: applyGst ? gstRate : 0,
        tax,
        total,
        notes,
        errors: failures.map((f) => f.error!).filter(Boolean),
      };
      setReceipt(receiptData);

      clearCart();
      setDiscount(0);
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales-products'] });
      queryClient.invalidateQueries({ queryKey: ['sales-pending'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-home'] });
      setTimeout(() => searchRef.current?.focus(), 100);
    },
    onError: (e: any) => toast.error(e?.message || 'Checkout failed'),
  });

  // -------------------------- Render --------------------------
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card !p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">Sales</h1>
            <p className="text-xs text-gray-500">Products, services, and payment collection — one ticket</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            {branches?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT — Add items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card !p-3">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setTab('products')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'products' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Package className="w-4 h-4 inline mr-1" /> Products
              </button>
              <button
                onClick={() => setTab('services')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'services' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Scissors className="w-4 h-4 inline mr-1" /> Services
              </button>
              <div className="ml-auto relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${tab}`}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Tiles */}
            {tab === 'products' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {(products || []).map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => addProduct(p)}
                    disabled={(p.stock ?? 0) <= 0}
                    className="border border-gray-200 rounded-xl p-3 hover:border-primary-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
                  >
                    <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                      {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-gray-400" />}
                    </div>
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-primary-700">{money(p.sellPrice)}</span>
                      <span className={`text-xs ${(p.stock ?? 0) <= 0 ? 'text-red-600' : (p.stock ?? 0) < 5 ? 'text-amber-600' : 'text-gray-500'}`}>×{p.stock ?? 0}</span>
                    </div>
                  </button>
                ))}
                {(products?.length ?? 0) === 0 && <p className="col-span-full text-center text-sm text-gray-500 py-6">No products.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(services || []).map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => addService(s)}
                    className="border border-gray-200 rounded-xl p-3 hover:border-primary-500 hover:bg-primary-50 transition-colors text-left flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.duration}m · {s.category?.name || 'Service'}</div>
                    </div>
                    <span className="text-sm font-bold text-primary-700 ml-3">{money(s.price)}</span>
                  </button>
                ))}
                {(services?.length ?? 0) === 0 && <p className="col-span-full text-center text-sm text-gray-500 py-6">No services.</p>}
              </div>
            )}
          </div>

          {/* Attach pending booking */}
          <div className="card !p-3">
            <button
              onClick={() => setAttachOpen((v) => !v)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
            >
              <span className="flex items-center gap-2"><Link2 className="w-4 h-4" /> Collect from a pending booking</span>
              <span className="text-xs text-gray-500">{pendingBookings?.length || 0} pending today</span>
            </button>
            {attachOpen && (
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
                {(pendingBookings || []).length === 0 && <p className="text-xs text-gray-500 text-center py-3">No pending bookings today.</p>}
                {(pendingBookings || []).map((b: any) => {
                  const attached = cart.some((l) => l.kind === 'SERVICE' && l.attachedBookingId === b.id);
                  const staffFullName = b.staff
                    ? [b.staff.user?.profile?.firstName, b.staff.user?.profile?.lastName].filter(Boolean).join(' ')
                    : '';
                  const customerFullName = b.customer?.profile
                    ? `${b.customer.profile.firstName || ''} ${b.customer.profile.lastName || ''}`.trim()
                    : b.walkInName || 'Walk-in';
                  return (
                    <button
                      key={b.id}
                      onClick={() => attachBooking(b)}
                      disabled={attached}
                      className={`w-full text-left border rounded-lg p-2 flex items-center justify-between transition-colors ${
                        attached
                          ? 'border-green-300 bg-green-50 opacity-70 cursor-not-allowed'
                          : 'border-gray-200 hover:border-primary-500'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {customerFullName}
                          <span className="text-xs text-gray-500 ml-2">{b.startTime}</span>
                          {attached && <span className="text-xs text-green-700 ml-2 font-semibold">✓ Added</span>}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {b.service.name}{staffFullName ? ' · with ' + staffFullName : ''}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary-700 ml-3">{money(b.totalAmount)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Cart / Checkout */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <div className="card !p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Cart</h2>
              {cart.length > 0 && <button onClick={clearCart} className="text-xs text-red-600 hover:underline">Clear</button>}
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Tap a product or service to add.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {cart.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 border-b border-gray-100 pb-2 last:border-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${l.kind === 'PRODUCT' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                      {l.kind === 'PRODUCT' ? 'P' : 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{l.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {money(l.unitPrice)}
                        {l.kind === 'SERVICE' && l.staffName && ` · with ${l.staffName}`}
                        {l.kind === 'SERVICE' && l.attachedBookingId && ' · attached'}
                      </div>
                    </div>
                    {l.kind === 'PRODUCT' ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => bumpQty(i, -1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm w-6 text-center">{l.quantity}</span>
                        <button onClick={() => bumpQty(i, 1)} className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      </div>
                    ) : null}
                    <button onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Staff picker — required for unattached service lines */}
            {cart.some((l) => l.kind === 'SERVICE' && !l.attachedBookingId) && (
              <div className="mt-3">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Staff (for services)</label>
                <select value={staffId} onChange={(e) => {
                  const nextId = e.target.value;
                  const picked = staff?.find((x: any) => x.id === nextId);
                  const nextName = picked
                    ? [picked.user?.profile?.firstName, picked.user?.profile?.lastName].filter(Boolean).join(' ')
                    : undefined;
                  setStaffId(nextId);
                  setCart((c) => c.map((l) => l.kind === 'SERVICE' && !l.attachedBookingId ? { ...l, staffId: nextId, staffName: nextName } : l));
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">— Choose staff —</option>
                  {(staff || []).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.user?.profile?.firstName} {s.user?.profile?.lastName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Customer */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input value={walkInName} onChange={(e) => setWalkInName(e.target.value)} placeholder="Customer name (optional)" className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)} placeholder="Phone (optional)" className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>

            {/* Discount + GST */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="relative">
                <IndianRupee className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" min={0} value={discount || ''} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} placeholder="Discount" className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer">
                <input type="checkbox" checked={applyGst} onChange={(e) => setApplyGst(e.target.checked)} />
                GST {gstRate}%
              </label>
            </div>

            {/* Totals */}
            <div className="mt-3 space-y-1 text-sm border-t border-gray-100 pt-3">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>−{money(discount)}</span></div>}
              {applyGst && <div className="flex justify-between text-gray-600"><span>GST</span><span>{money(tax)}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-1 border-t border-gray-100"><span>Total</span><span className="text-primary-700">{money(total)}</span></div>
            </div>

            {/* Payment method */}
            <div className="mt-3">
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Payment method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {(paymentMethods && paymentMethods.length > 0 ? paymentMethods.map((m: any) => m.name) : ['Cash', 'UPI', 'Card']).map((m: string) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Quick pay */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {QUICK_METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => { setPaymentMethod(m.key); checkout.mutate(); }}
                  disabled={checkout.isPending || cart.length === 0 || total <= 0}
                  className="flex flex-col items-center gap-1 border-2 border-primary-200 hover:border-primary-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 transition-colors"
                >
                  <m.icon className="w-5 h-5 text-primary-700" />
                  <span className="text-xs font-semibold">{m.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => checkout.mutate()}
              disabled={checkout.isPending || cart.length === 0 || total <= 0}
              className="mt-3 w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {checkout.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Printer className="w-4 h-4" /> Checkout · {money(total)}</>}
            </button>
          </div>
        </div>
      </div>

      {receipt && <Receipt data={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
