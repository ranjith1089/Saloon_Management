import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import api from '@/services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  product?: any | null;
}

export default function NewProductModal({ open, onClose, product }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      branchId: '',
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
      stock: 0,
      reorderLevel: 5,
      expiryDate: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        branchId: product.branchId || '',
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
        stock: product.stock || 0,
        reorderLevel: product.reorderLevel || 5,
        expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
        isActive: product.isActive ?? true,
      });
    } else if (open) {
      reset();
    }
  }, [product, open, reset]);

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

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        categoryId: data.categoryId || null,
        expiryDate: data.expiryDate || null,
        mrp: Number(data.mrp),
        buyPrice: Number(data.buyPrice),
        sellPrice: Number(data.sellPrice),
        memberPrice: data.memberPrice === '' || data.memberPrice === null ? null : Number(data.memberPrice),
        stock: Number(data.stock),
        reorderLevel: Number(data.reorderLevel),
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

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Product' : 'New Product'}
      description="Track MRP, buy/sell price, stock and expiry"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Branch *</label>
            <select className="input" {...register('branchId', { required: true })}>
              <option value="">-- Select branch --</option>
              {branches?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.branchId && <p className="text-xs text-red-600 mt-1">Required</p>}
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

        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 pt-2">Stock & Expiry</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Current Stock</label>
            <input type="number" min="0" className="input" {...register('stock')} />
          </div>
          <div>
            <label className="label">Low-Stock Alert Level</label>
            <input type="number" min="0" className="input" {...register('reorderLevel')} />
          </div>
          <div>
            <label className="label">Expiry Date</label>
            <input type="date" className="input" {...register('expiryDate')} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="prod-active" {...register('isActive')} className="w-4 h-4" />
          <label htmlFor="prod-active" className="text-sm">Active (available for sale)</label>
        </div>
      </form>
    </Modal>
  );
}
