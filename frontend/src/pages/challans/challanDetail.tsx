import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { StatusBadge } from '../../components/statusBadge';
import { formatCurrency, formatDate } from '../../lib/format';
import { Challan } from '../../types';

export function ChallanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  async function load() {
    const { data } = await api.get(`/challans/${id}`);
    setChallan(data);
  }

  useEffect(() => { load(); }, [id]);

  async function confirm() {
    setConfirming(true);
    setError('');
    try {
      await api.post(`/challans/${id}/confirm`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to confirm challan');
    } finally {
      setConfirming(false);
    }
  }

  if (!challan) return <div className="text-slate-400 text-sm">Loading…</div>;

  const grandTotal = challan.items.reduce((sum, i) => sum + parseFloat(i.unitPrice) * i.quantity, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-800">{challan.challanNumber}</h1>
          <StatusBadge status={challan.status} />
        </div>
        {challan.status === 'DRAFT' && (
          <div className="flex gap-2">
            <button onClick={() => navigate(`/challans/${challan.id}/edit`)} className="px-4 py-2 text-sm border border-slate-200 rounded-md">Edit</button>
            <button onClick={confirm} disabled={confirming} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-60">
              {confirming ? 'Confirming…' : 'Confirm Challan'}
            </button>
          </div>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Customer: <Link to={`/customers/${challan.customerId}`} className="text-indigo-600">{challan.customer?.name}</Link>
        {' • '}{formatDate(challan.createdAt)}
      </p>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">SKU</th>
              <th className="px-5 py-3 font-medium">Qty</th>
              <th className="px-5 py-3 font-medium">Unit Price</th>
              <th className="px-5 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {challan.items.map((i) => (
              <tr key={i.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 text-slate-700">{i.productName}</td>
                <td className="px-5 py-3 text-slate-500">{i.sku}</td>
                <td className="px-5 py-3 text-slate-600">{i.quantity}</td>
                <td className="px-5 py-3 text-slate-600">{formatCurrency(i.unitPrice)}</td>
                <td className="px-5 py-3 text-slate-700 font-medium">{formatCurrency(parseFloat(i.unitPrice) * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end gap-8 px-5 py-4 border-t border-slate-100 text-sm">
          <div>
            <div className="text-slate-400 text-xs">Total Quantity</div>
            <div className="font-semibold text-slate-800">{challan.totalQuantity}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Grand Total</div>
            <div className="font-semibold text-slate-800">{formatCurrency(grandTotal)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}