import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';
import { Modal } from '../../components/modal';

export function AddCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', mobile: '', email: '', businessName: '', gstNumber: '',
    customerType: 'RETAIL', address: '', status: 'LEAD', notes: '',
  });
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
      await api.post('/customers', form);
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add Customer" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" required value={form.name} onChange={(v) => set('name', v)} />
          <Field label="Mobile" required value={form.mobile} onChange={(v) => set('mobile', v)} />
          <Field label="Email" value={form.email} onChange={(v) => set('email', v)} />
          <Field label="Business Name" value={form.businessName} onChange={(v) => set('businessName', v)} />
          <Field label="GST Number" value={form.gstNumber} onChange={(v) => set('gstNumber', v)} />
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
            <select value={form.customerType} onChange={(e) => set('customerType', e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm">
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="DISTRIBUTOR">Distributor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm">
              <option value="LEAD">Lead</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
        <Field label="Address" value={form.address} onChange={(v) => set('address', v)} />
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-md">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-md">
            {saving ? 'Saving…' : 'Save Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}{required && ' *'}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" />
    </div>
  );
}