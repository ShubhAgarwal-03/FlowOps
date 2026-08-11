import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';
import { Modal } from '../../components/modal';

export function AddProductModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', sku: '', category: '', unitPrice: '', currentStock: '0', minStock: '0', warehouse: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/products', {
        ...form,
        unitPrice: Number(form.unitPrice),
        currentStock: Number(form.currentStock),
        minStock: Number(form.minStock),
      });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add Product" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" required value={form.name} onChange={(v) => set('name', v)} />
          <Field label="SKU" required value={form.sku} onChange={(v) => set('sku', v)} />
          <Field label="Category" value={form.category} onChange={(v) => set('category', v)} />
          <Field label="Warehouse" value={form.warehouse} onChange={(v) => set('warehouse', v)} />
          <Field label="Unit Price" required type="number" value={form.unitPrice} onChange={(v) => set('unitPrice', v)} />
          <Field label="Opening Stock" type="number" value={form.currentStock} onChange={(v) => set('currentStock', v)} />
          <Field label="Minimum Stock" type="number" value={form.minStock} onChange={(v) => set('minStock', v)} />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-md">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-md">
            {saving ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, value, onChange, required, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}{required && ' *'}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" />
    </div>
  );
}