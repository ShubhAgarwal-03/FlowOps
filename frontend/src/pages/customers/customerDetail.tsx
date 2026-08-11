import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { StatusBadge } from '../../components/statusBadge';
import { formatDate } from '../../lib/format';
import { Customer } from '../../types';

export function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get(`/customers/${id}`);
    setCustomer(data);
  }

  useEffect(() => { load(); }, [id]);

  async function addFollowup(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      await api.post(`/customers/${id}/followups`, { note, followUpDate: followUpDate || undefined });
      setNote('');
      setFollowUpDate('');
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (!customer) return <div className="text-slate-400 text-sm">Loading…</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-semibold text-slate-800">{customer.name}</h1>
        <StatusBadge status={customer.status} />
      </div>
      <p className="text-sm text-slate-500 mb-6">{customer.customerType} {customer.businessName ? `• ${customer.businessName}` : ''}</p>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 text-sm mb-3">Contact</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Mobile" value={customer.mobile} />
            <Row label="Email" value={customer.email ?? '—'} />
            <Row label="GST Number" value={customer.gstNumber ?? '—'} />
            <Row label="Address" value={customer.address ?? '—'} />
            <Row label="Notes" value={customer.notes ?? '—'} />
          </dl>
        </div>

        <div className="col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 text-sm mb-1">CRM Follow-ups</h2>
          <p className="text-xs text-slate-400 mb-4">Next follow-up: {formatDate(customer.followUpDate)}</p>

          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {(customer.followups ?? []).map((f) => (
              <div key={f.id} className="border-b border-slate-50 pb-2">
                <div className="text-sm text-slate-700">{f.note}</div>
                <div className="text-xs text-slate-400">
                  {formatDate(f.createdAt)}{f.followUpDate ? ` • next: ${formatDate(f.followUpDate)}` : ''}
                </div>
              </div>
            ))}
            {(!customer.followups || customer.followups.length === 0) && (
              <div className="text-sm text-slate-400">No follow-ups recorded yet.</div>
            )}
          </div>

          <form onSubmit={addFollowup} className="border-t border-slate-100 pt-3 space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a follow-up note..."
              rows={2}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-2">
              <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="border border-slate-200 rounded-md px-3 py-1.5 text-sm" />
              <button type="submit" disabled={saving} className="ml-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md disabled:opacity-60">
                {saving ? 'Saving…' : '+ Add Follow-up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-700 text-right max-w-[60%]">{value}</dd>
    </div>
  );
}