import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/format';
import { Product } from '../../types';

export function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data));
  }, [id]);

  if (!product) return <div className="text-slate-400 text-sm">Loading…</div>;
  const low = product.currentStock <= product.minStock;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800">{product.name}</h1>
      <p className="text-sm text-slate-500 mb-6">SKU: {product.sku}</p>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-2 text-sm">
          <Row label="Category" value={product.category ?? '—'} />
          <Row label="Unit Price" value={formatCurrency(product.unitPrice)} />
          <Row label="Current Stock" value={String(product.currentStock)} />
          <Row label="Minimum Stock" value={String(product.minStock)} />
          <Row label="Warehouse" value={product.warehouse ?? '—'} />
          <Row label="Status" value={low ? 'Low Stock' : 'Healthy'} />
        </div>

        <div className="col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Stock Movement</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-5 py-2 font-medium">Type</th>
                <th className="px-5 py-2 font-medium">Qty</th>
                <th className="px-5 py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {(product.movements ?? []).map((m) => (
                <tr key={m.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-2 text-slate-500">{formatDate(m.createdAt)}</td>
                  <td className="px-5 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.movementType === 'IN' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {m.movementType}
                    </span>
                  </td>
                  <td className="px-5 py-2 text-slate-600">{m.quantityChanged > 0 ? `+${m.quantityChanged}` : m.quantityChanged}</td>
                  <td className="px-5 py-2 text-slate-500">{m.reason ?? '—'}</td>
                </tr>
              ))}
              {(!product.movements || product.movements.length === 0) && (
                <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-400">No movements yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}