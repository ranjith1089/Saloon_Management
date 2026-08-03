import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2, Building2 } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  product?: any | null;
}

interface BranchStockDraft {
  branchId: string;
  branchName: string;
  enabled: boolean;
  stock: number;
  reorderLevel: number;
}

export default function NewProductModal({ open, onClose, product }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      categoryId: '',
      name: '',
      brand: '',
      sku: '',
      barcode: '',
      description: '',
      image: '',
      mrp: 0,
      buyPrice: 0,
      sellPrice: 0,
      memberPrice: '' as any,
      expiryDate: '',
      isActive: true,
    },
  });

  // Per-branch stock rows live outside react-hook-form because they're a
  // dynamic list keyed by branch.
  const [branchStocks, setBranchStocks] = useState<BranchStockDraft[]>([]);

  const { data: branches } = useQuery({
    queryKey: ['branches-select'],
    queryFn: async () => (await api.get('/branches?limit=100')).data.data,
    enabled: open,
  });

  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => (await api.get('/products/categories')).data.data,
    enabled: open,
  });

  // Seed / re-seed the per-branch table whenever the modal opens or the
  // product / branches list changes.
  useEffect(() => {
    if (!open) return;
    const allBranches: any[] = branches || [];
    const existingByBranch: Record<string, any> = {};
    (product?.branchStocks || []).forEach((bs: any) => (existingByBranch[bs.branchId] = bs));
    const rows: BranchStockDraft[] = allBranches.map((b) => {
      const ex = existingByBranch[b.id];
      return {
        branchId: b.id,
        branchName: b.name,
        enabled: !!ex,
        stock: ex ? Number(ex.stock ?? 0) : 0,
        reorderLevel: ex ? Number(ex.reorderLevel ?? 5) : 5,
      };
    });
    setBranchStocks(rows);
  }, [open, product, branches]);

  useEffect(() => {
    if (product) {
      reset({
        categoryId: product.categoryId || '',
        name: product.name || '',
        brand: product.brand || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        description: product.description || '',
        image: product.image || '',
        mrp: Number(product.mrp || 0),
        buyPrice: Number(product.buyPrice || 0),
        sellPrice: Number(product.sellPrice || 0),
        memberPrice: product.memberPrice !== null && product.memberPrice !== undefined ? Number(product.memberPrice) : '',
        expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
        isActive: product.isActive ?? true,
      });
    } else if (open) {
      reset();
    }
  }, [product, open, reset]);

  const toggleBranch = (branchId: string) => {
    setBranchStocks((rows) => rows.map((r) =>
      r.branchId === branchId ? { ...r, enabled: !r.enabled } : r
    ));
  };
  const setField = (branchId: string, field: 'stock' | 'reorderLevel', value: number) => {
    setBranchStocks((rows) => rows.map((r) =>
      r.branchId === branchId ? { ...r, [field]: value } : r
    ));
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const enabledRows = branchStocks.filter((b) => b.enabled).map((b) => ({
        branchId: b.branchId,
        stock: Number(b.stock) || 0,
        reorderLevel: Number(b.reorderLevel) || 5,
      }));
      const payload = {
        ...data,
        categoryId: data.categoryId || null,
        expiryDate: data.expiryDate || null,
        mrp: Number(data.mrp),
        buyPrice: Number(data.buyPrice),
        sellPrice: Number(data.sellPrice),
        memberPrice: data.memberPrice === '' || data.memberPrice === null ? null : Number(data.memberPrice),
        branchStocks: enabledRows,
      };
      if (isEdit) return api.patch(`/products/${product.id}`, payload);
      return api.post('/products', payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated' : 'Product created');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleClose();
    },
  });

  const handleClose = () => { reset(); setBranchStocks([]); onClose(); };

  const enabledCount = branchStocks.filter((b) => b.enabled).length;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Product' : 'New Product'}
      description="Shared catalog item — stock is tracked per branch"
      size="lg"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit((d) => mutation.mutate(d))}
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save' : 'Create Product'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Basics</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" {...register('name', { required: true })} />
            {errors.name && <p className="text-xs text-red-600 mt-1">Required</p>}
          </div>
          <div>
            <label className="label">Brand</label>
            <input className="input" {...register('brand')} placeholder="e.g. L'Oréal" />
          </div>
        </div>

        <div>
          <label className="label">Category</label>
          <select className="input" {...register('categoryId')}>
            <option value="">— Uncategorised —</option>
            {categories?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">SKU</label>
            <input className="input font-mono" {...register('sku')} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Barcode</label>
            <input className="input font-mono" {...register('barcode')} placeholder="Optional" />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} {...register('description')} />
        </div>

        <div>
          <label className="label">Image URL</label>
          <input className="input" {...register('image')} placeholder="https://…" />
        </div>

        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 pt-2">Pricing</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">MRP *</label>
            <input type="number" min="0" step="0.01" className="input" {...register('mrp', { required: true, min: 0 })} />
          </div>
          <div>
            <label className="label">Buy Price *</label>
            <input type="number" min="0" step="0.01" className="input" {...register('buyPrice', { required: true, min: 0 })} />
          </div>
          <div>
            <label className="label">Sell Price *</label>
            <input type="number" min="0" step="0.01" className="input" {...register('sellPrice', { required: true, min: 0 })} />
          </div>
          <div>
            <label className="label">Member Price</label>
            <input type="number" min="0" step="0.01" className="input" {...register('memberPrice')} placeholder="blank" />
            <p className="text-[11px] text-gray-500 mt-1">Blank = same as sell</p>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 pt-2 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Stock per Branch
          <span className="ml-auto text-xs text-gray-500 font-normal">
            {enabledCount} of {branchStocks.length} selected
          </span>
        </h3>

        {branchStocks.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No branches yet — add a branch first.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {branchStocks.map((b) => (
              <div key={b.branchId} className={`p-3 ${b.enabled ? 'bg-primary-50/30' : 'bg-white'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={b.enabled}
                    onChange={() => toggleBranch(b.branchId)}
                    className="w-4 h-4"
                  />
                  <span className="flex-1 text-sm font-medium">{b.branchName}</span>
                  {b.enabled ? (
                    <>
                      <label className="text-xs text-gray-500 inline-flex items-center gap-1">
                        Stock
                        <input
                          type="number"
                          min={0}
                          value={b.stock}
                          onChange={(e) => setField(b.branchId, 'stock', Number(e.target.value))}
                          className="input !py-1 !w-20 text-sm text-right"
                        />
                      </label>
                      <label className="text-xs text-gray-500 inline-flex items-center gap-1">
                        Alert ≤
                        <input
                          type="number"
                          min={0}
                          value={b.reorderLevel}
                          onChange={(e) => setField(b.branchId, 'reorderLevel', Number(e.target.value))}
                          className="input !py-1 !w-16 text-sm text-right"
                        />
                      </label>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">not stocked here</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-gray-500">
          Tick the branches that carry this product. Untick to remove it from that branch's inventory (won't affect past sales).
        </p>

        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 pt-2">Expiry & Status</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Expiry Date</label>
            <input type="date" className="input" {...register('expiryDate')} />
            <p className="text-[11px] text-gray-500 mt-1">Product-level (same across branches)</p>
          </div>
          <div className="flex items-end gap-2">
            <input type="checkbox" id="prod-active" {...register('isActive')} className="w-4 h-4" defaultChecked />
            <label htmlFor="prod-active" className="text-sm mb-2">Active (available for sale)</label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
