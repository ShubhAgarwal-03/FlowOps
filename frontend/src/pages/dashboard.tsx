import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, AlertTriangle, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { KpiCard } from '../components/kpiCard';
import { StatusBadge } from '../components/statusBadge';
import { SalesOverviewChart } from '../components/salesOverviewChart';
import { formatCurrency, formatDate } from '../lib/format';
import { Challan, Product } from '../types';
import { useAuth } from '../context/authContext';

export function Dashboard() {
  const { user } = useAuth();
  const [customerCount, setCustomerCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [challanCount, setChallanCount] = useState(0);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentChallans, setRecentChallans] = useState<Challan[]>([]);
  const [salesOverview, setSalesOverview] = useState<{ date: string; label: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const canSeeCustomers = user && ['ADMIN', 'SALES', 'ACCOUNTS'].includes(user.role);

  useEffect(() => {
    async function load() {
      const results = await Promise.allSettled([
        canSeeCustomers ? api.get('/customers', { params: { limit: 1 } }) : Promise.resolve(null),
        api.get('/products', { params: { limit: 1 } }),
        api.get('/challans', { params: { limit: 5 } }),
        api.get('/products', { params: { lowStock: true, limit: 5 } }),
        api.get('/dashboard/sales-overview'),
      ]);

      const [customersRes, productsRes, challansRes, lowStockRes, overviewRes] = results;

      if (customersRes.status === 'fulfilled' && customersRes.value) {
        setCustomerCount(customersRes.value.data.total);
      }
      if (productsRes.status === 'fulfilled') setProductCount(productsRes.value.data.total);
      if (challansRes.status === 'fulfilled') {
        setChallanCount(challansRes.value.data.total);
        setRecentChallans(challansRes.value.data.items);
      }
      if (lowStockRes.status === 'fulfilled') setLowStock(lowStockRes.value.data.items);
      if (overviewRes.status === 'fulfilled') setSalesOverview(overviewRes.value.data);

      setLoading(false);
    }
    load();
  }, [canSeeCustomers]);

  if (loading) return <div className="text-slate-400 text-sm">Loading dashboard…</div>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800">Operations Overview</h1>
      <p className="text-sm text-slate-500 mb-6">Real-time snapshot across CRM, inventory, and sales.</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {canSeeCustomers && (
          <KpiCard label="Total Customers" value={customerCount} icon={<Users className="w-4 h-4" />} accent="indigo" />
        )}
        <KpiCard label="Total Products" value={productCount} icon={<Package className="w-4 h-4" />} accent="slate" />
        <KpiCard label="Low Stock Alerts" value={lowStock.length} icon={<AlertTriangle className="w-4 h-4" />} accent="red" sublabel={lowStock.length > 0 ? 'Requires reorder' : undefined} />
        <KpiCard label="Total Challans" value={challanCount} icon={<FileText className="w-4 h-4" />} accent="amber" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2">
          <SalesOverviewChart data={salesOverview} />
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Low Stock</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {lowStock.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-700">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.currentStock} / min {p.minStock}</div>
                </div>
                <span className="text-xs font-medium text-red-600">{formatCurrency(p.unitPrice)}</span>
              </div>
            ))}
            {lowStock.length === 0 && <div className="px-5 py-6 text-center text-slate-400 text-sm">All stock healthy</div>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">Recent Challans</h2>
          <Link to="/challans" className="text-xs text-indigo-600">View all</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Challan #</th>
              <th className="px-5 py-2 font-medium">Customer</th>
              <th className="px-5 py-2 font-medium">Date</th>
              <th className="px-5 py-2 font-medium">Qty</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentChallans.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-5 py-3"><Link to={`/challans/${c.id}`} className="text-indigo-600 font-medium">{c.challanNumber}</Link></td>
                <td className="px-5 py-3 text-slate-600">{c.customer?.name}</td>
                <td className="px-5 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                <td className="px-5 py-3 text-slate-600">{c.totalQuantity}</td>
                <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
            {recentChallans.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-400">No challans yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}