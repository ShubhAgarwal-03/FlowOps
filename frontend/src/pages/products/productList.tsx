import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { SearchInput } from '../../components/searchInput';
import { Pagination } from '../../components/pagination';
import { KpiCard } from '../../components/kpiCard';
import { formatCurrency } from '../../lib/format';
import { Product } from '../../types';
import { useAuth } from '../../context/authContext';
import { AddProductModal } from './addProductModal';
import { StockInModal } from './stockInModal';

export function ProductList() {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [stockInProduct, setStockInProduct] = useState<Product | null>(null);
  const limit = 20;

  const canManage = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  async function load() {
    const { data } = await api.get('/products', { params: { search: search || undefined, lowStock: lowStockOnly || undefined, page, limit } });
    setItems(data.items);
    setTotal(data.total);
  }

  useEffect(() => { load(); }, [page, search, lowStockOnly]);

  const lowStockCount = items.filter((p) => p.currentStock <= p.minStock).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-slate-800">Product & Inventory Master</h1>
        {canManage && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md px-3 py-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-4">Manage catalog and monitor stock levels.</p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <KpiCard label="Total Products" value={total} accent="slate" />
        <KpiCard label="Low Stock Alerts" value={lowStockCount} accent="red" />
        <KpiCard label="Page" value={`${page}`} accent="indigo" />
      </div>

      <div className="flex gap-3 mb-4">
        <div className="w-80">
          <SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search by name or SKU..." />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => { setPage(1); setLowStockOnly(e.target.checked); }} />
          Low stock only
        </label>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="px-5 py-3 font-medium">SKU / Name</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Unit Price</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Status</th>
              {canManage && <th className="px-5 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const low = p.currentStock <= p.minStock;
              return (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link to={`/products/${p.id}`} className="text-slate-800 font-medium">{p.name}</Link>
                    <div className="text-xs text-slate-400">{p.sku}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.category ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{formatCurrency(p.unitPrice)}</td>
                  <td className="px-5 py-3 text-slate-600">{p.currentStock}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${low ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-green-50 text-green-700 ring-1 ring-green-200'}`}>
                      {low ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-5 py-3">
                      <button onClick={() => setStockInProduct(p)} className="text-indigo-600 text-xs font-medium">Stock In</button>
                    </td>
                  )}
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No products found</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-5 py-3">
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        </div>
      </div>

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
      {stockInProduct && (
        <StockInModal
          product={stockInProduct}
          onClose={() => setStockInProduct(null)}
          onSaved={() => { setStockInProduct(null); load(); }}
        />
      )}
    </div>
  );
}