import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { StatusBadge } from '../../components/statusBadge';
import { Pagination } from '../../components/pagination';
import { formatDate } from '../../lib/format';
import { Challan } from '../../types';

export function ChallanList() {
  const [items, setItems] = useState<Challan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const limit = 20;

  useEffect(() => {
    api.get('/challans', { params: { status: status || undefined, page, limit } }).then((res) => {
      setItems(res.data.items);
      setTotal(res.data.total);
    });
  }, [page, status]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-slate-800">Sales Challans</h1>
        <Link to="/challans/new" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md px-3 py-2">
          + New Challan
        </Link>
      </div>
      <p className="text-sm text-slate-500 mb-4">Track draft and confirmed sales challans.</p>

      <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="border border-slate-200 rounded-md text-sm px-3 py-2 mb-4">
        <option value="">All Statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="px-5 py-3 font-medium">Challan #</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Qty</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link to={`/challans/${c.id}`} className="text-indigo-600 font-medium">{c.challanNumber}</Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{c.customer?.name}</td>
                <td className="px-5 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                <td className="px-5 py-3 text-slate-600">{c.totalQuantity}</td>
                <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No challans found</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-5 py-3">
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}