import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { SearchInput } from '../../components/searchInput';
import { StatusBadge } from '../../components/statusBadge';
import { Pagination } from '../../components/pagination';
import { formatDate, initials } from '../../lib/format';
import { Customer } from '../../types';
import { AddCustomerModal } from './addCustomerModal';

export function CustomerList() {
  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const limit = 20;

  async function load() {
    const { data } = await api.get('/customers', { params: { search: search || undefined, status: status || undefined, page, limit } });
    setItems(data.items);
    setTotal(data.total);
  }

  useEffect(() => { load(); }, [page, search, status]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-slate-800">Customer Directory</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">Manage and view client relationships.</p>

      <div className="flex gap-3 mb-4">
        <div className="w-80">
          <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search by name, mobile, or email..." />
        </div>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="border border-slate-200 rounded-md text-sm px-3">
          <option value="">All Statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="px-5 py-3 font-medium">Customer Name</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Mobile</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link to={`/customers/${c.id}`} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                      {initials(c.name)}
                    </div>
                    <div>
                      <div className="text-slate-800 font-medium">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.businessName ?? c.email ?? '—'}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{c.customerType}</td>
                <td className="px-5 py-3 text-slate-600">{c.mobile}</td>
                <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-3 text-slate-500">{formatDate(c.followUpDate)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No customers found</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-5 py-3">
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </div>
      </div>

      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}