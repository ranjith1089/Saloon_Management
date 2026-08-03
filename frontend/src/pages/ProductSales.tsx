import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search, Package, Plus, Minus, X, User, Building2, CreditCard,
  Receipt, Loader2, ShoppingCart, Ban, Crown,
} from 'lucide-react';
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
}

export default function ProductSales() {
  const queryClient = useQueryClient();
  const { methods: paymentMethods } = usePaymentMethods();
  const { rate: gstRate, name: taxName } = useDefaultTaxRate();
  const [branchId, setBranchId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [applyGst, setApplyGst] = useState(false);
  const [notes, setNotes] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: branches } = useQuery({
    queryKey: ['branches-select'],
    queryFn: async () => (await api.get('/branches?limit=100')).data.data,
  });

  const { data: products } = useQuery({
    queryKey: ['products-pos', branchId, search],
    queryFn: async () => {
      const params: any = { limit: 100, isActive: true };
      if (branchId) params.branchId = branchId;
      if (search) params.search = search;
      return (await api.get('/products', { params })).data.data;
    },
    enabled: !!branchId,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: async () => (await api.get('/customers?limit=200')).data.data,
  });

  const { data: activeMembership } = useQuery({
    queryKey: ['active-membership', customerId],
    queryFn: async () => (await api.get(`/memberships/active/${customerId}`)).data.data,
    enabled: !!customerId,
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff-select-pos', branchId],
    queryFn: async () => {
      const params = branchId ? `?branchId=${branchId}&limit=100` : '?limit=100';
      return (await api.get(`/staff${params}`)).data.data;
    },
    enabled: !!branchId,
  });

  const { data: recentSales } = useQuery({
    queryKey: ['product-sales-recent', branchId],
    queryFn: async () => {
      const params: any = { limit: 20 };
      if (branchId) params.branchId = branchId;
      const today = new Date().toISOString().split('T')[0];
      params.date = today;
      return (await api.get('/product-sales', { params })).data;
    },
  });

  const priceFor = (p: any) =>
    activeMembership && p.memberPrice !== null && p.memberPrice !== undefined
      ? Number(p.memberPrice)
      : Number(p.sellPrice);

  const addToCart = (p: any) => {
    if (p.stock <= 0) {
      toast.error(`${p.name} is out of stock`);
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
        { productId: p.id, name: p.name, unitPrice: priceFor(p), stock: p.stock, quantity: 1 },
      ];
    });
  };

  // When customer changes (and thus membership status), re-price everything in the cart.
  const repriceCart = () => {
    if (!products) return;
    setCart((prev) =>
      prev.map((l) => {
        const p = products.find((pp: any) => pp.id === l.productId);
        return p ? { ...l, unitPrice: priceFor(p) } : l;
      })
    );
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
  };

  const subtotal = useMemo(() => cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0), [cart]);
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = applyGst ? Math.round((taxableBase * gstRate) / 100 * 100) / 100 : 0;
  const total = Math.max(0, taxableBase + taxAmount);

  const checkout = useMutation({
    mutationFn: async () => {
      const payload = {
        branchId,
        customerId: customerId || undefined,
        staffId: staffId || undefined,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        discountAmount,
        taxRate: applyGst ? gstRate : 0,
        paymentMethod,
        notes: notes || undefined,
      };
      return (await api.post('/product-sales', payload)).data;
    },
    onSuccess: (res) => {
      toast.success(`Sale ${res.data.saleNumber} recorded — ₹${Number(res.data.totalAmount).toLocaleString()}`);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['product-sales-recent'] });
      queryClient.invalidateQueries({ queryKey: ['products-pos'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Product Sales</h1>
          <p className="text-sm text-gray-500 mt-1">Point-of-sale for retail products</p>
        </div>
        <select
          className="input max-w-xs"
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            clearCart();
          }}
        >
          <option value="">-- Select branch --</option>
          {branches?.map((b: any) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {!branchId ? (
        <div className="card text-center py-16 text-gray-500">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p>Select a branch to start selling.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT — product grid */}
          <div className="lg:col-span-3 space-y-4">
            <div className="card p-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  className="input pl-9"
                  placeholder="Search products by name, brand, SKU, barcode…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(products || []).length === 0 ? (
                <div className="col-span-full text-center py-10 text-sm text-gray-500">
                  <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  No products at this branch — add one from the Products page.
                </div>
              ) : (
                products.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0}
                    className={`card p-3 text-left transition-all hover:shadow-md hover:border-primary-300 ${
                      p.stock <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="w-full aspect-square bg-gray-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                      {p.image ? (
                        <img src={p.image} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      ) : (
                        <Package className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    {p.brand && <div className="text-xs text-gray-500 truncate">{p.brand}</div>}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold text-primary-600">₹{Number(p.sellPrice).toLocaleString()}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        p.stock <= 0 ? 'bg-red-100 text-red-700'
                        : p.stock <= p.reorderLevel ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                        {p.stock <= 0 ? 'Out' : `${p.stock} left`}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT — cart */}
          <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="card p-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="font-semibold flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Cart</h3>
                {cart.length > 0 && (
                  <button onClick={clearCart} className="text-xs text-red-600 hover:underline">Clear</button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-500">
                  <ShoppingCart className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  Cart is empty — tap a product to add.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {cart.map((l) => (
                    <div key={l.productId} className="p-3 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{l.name}</div>
                        <div className="text-xs text-gray-500">
                          ₹{l.unitPrice.toLocaleString()} × {l.quantity} = ₹{(l.unitPrice * l.quantity).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(l.productId, -1)} className="p-1 hover:bg-gray-100 rounded">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{l.quantity}</span>
                        <button onClick={() => updateQty(l.productId, 1)} className="p-1 hover:bg-gray-100 rounded" disabled={l.quantity >= l.stock}>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeLine(l.productId)} className="p-1 hover:bg-red-50 rounded text-red-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <>
                  <div className="p-4 space-y-3 border-t border-gray-100 bg-gray-50">
                    <div>
                      <label className="label text-xs flex items-center gap-1"><User className="w-3 h-3" /> Customer (optional)</label>
                      <select
                        className="input !py-1.5 text-sm"
                        value={customerId}
                        onChange={(e) => {
                          setCustomerId(e.target.value);
                          // Give the membership query a beat to refresh before repricing.
                          setTimeout(repriceCart, 250);
                        }}
                      >
                        <option value="">Walk-in</option>
                        {customers?.map((c: any) => (
                          <option key={c.userId} value={c.userId}>
                            {c.user?.profile?.firstName} {c.user?.profile?.lastName}
                          </option>
                        ))}
                      </select>
                      {activeMembership && (
                        <div className="mt-1.5 flex items-center gap-1 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                          <Crown className="w-3 h-3" />
                          <span className="font-medium">MEMBER</span>
                          <span>· {activeMembership.plan?.name}</span>
                          <span className="ml-auto">member prices applied</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="label text-xs">Sold by (staff, optional — earns commission)</label>
                      <select className="input !py-1.5 text-sm" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                        <option value="">— No staff attributed —</option>
                        {staffList?.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.user?.profile?.firstName} {s.user?.profile?.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label text-xs flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment</label>
                        <select className="input !py-1.5 text-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                          {paymentMethods.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">Discount ₹</label>
                        <input
                          type="number"
                          min="0"
                          max={subtotal}
                          className="input !py-1.5 text-sm"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label text-xs">Tax</label>
                      <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 w-fit">
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
                    <div>
                      <label className="label text-xs">Notes</label>
                      <input className="input !py-1.5 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-700"><span>Discount</span><span>−₹{discountAmount.toLocaleString()}</span></div>
                    )}
                    {applyGst && taxAmount > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>{taxName} ({gstRate}%)</span>
                        <span>+₹{taxAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-semibold">
                      <span>Total</span>
                      <span className="text-primary-600">₹{total.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => checkout.mutate()}
                      disabled={checkout.isPending || cart.length === 0}
                      className="btn-primary w-full mt-2"
                    >
                      {checkout.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Checkout ₹${total.toLocaleString()}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Today's sales */}
      {branchId && (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Today's Sales
              {recentSales?.meta?.totalRevenue !== undefined && (
                <span className="text-sm font-normal text-gray-500">
                  · ₹{Number(recentSales.meta.totalRevenue).toLocaleString()} total
                </span>
              )}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700">#</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Time</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Items</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Customer</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Staff</th>
                  <th className="px-4 py-2 font-medium text-gray-700 text-right">Total</th>
                  <th className="px-4 py-2 font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSales?.data?.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-500">No sales yet today.</td></tr>
                ) : (
                  recentSales?.data?.map((s: any) => (
                    <tr key={s.id} className={s.voidedAt ? 'opacity-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-2 font-mono text-xs">{s.saleNumber}</td>
                      <td className="px-4 py-2 text-xs">{new Date(s.createdAt).toLocaleTimeString()}</td>
                      <td className="px-4 py-2">{s.items?.length || 0}</td>
                      <td className="px-4 py-2">{s.customer?.profile?.firstName || 'Walk-in'}</td>
                      <td className="px-4 py-2">{s.staff?.user?.profile?.firstName || '—'}</td>
                      <td className="px-4 py-2 text-right font-medium">
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
        </div>
      )}

      <SaleDetailModal id={detailId} onClose={() => setDetailId(null)} />
    </div>
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
