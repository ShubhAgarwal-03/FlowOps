import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';
import { Modal } from '../../components/modal';
import { Product } from '../../types';

export function StockInModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/inventory/stock-in', { productId: product.id, quantity: Number(quantity), reason });
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to record stock');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Stock In — ${product.name}`} onClose={onClose} width="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="text-xs text-slate-400">Current stock: {product.currentStock}</div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Quantity *</label>
          <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Reason *</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="e.g. Restock, PO #1234" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-md">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-md">
            {saving ? 'Saving…' : 'Add Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
}