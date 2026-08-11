import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/format';
import { Customer, Product } from '../../types';

interface DraftLine {
  productId: string;
  quantity: number;
}

export function ChallanBuilder() {
  const { id } = useParams(); // present when editing an existing draft
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<'draft' | 'confirm' | null>(null);
  const [challanNumber, setChallanNumber] = useState('');

  useEffect(() => {
    api.get('/customers', { params: { limit: 100 } }).then((res) => setCustomers(res.data.items));
    api.get('/products', { params: { limit: 200 } }).then((res) => setProducts(res.data.items));
  }, []);

  useEffect(() => {
    if (!id) return;
    api.get(`/challans/${id}`).then((res) => {
      const c = res.data;
      setCustomerId(c.customerId);
      setChallanNumber(c.challanNumber);
      setLines(c.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })));
    });
  }, [id]);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const productById = (pid: string) => products.find((p) => p.id === pid);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 6);
  }, [productSearch, products]);

  function addLine(productId: string) {
    if (lines.some((l) => l.productId === productId)) return;
    setLines((l) => [...l, { productId, quantity: 1 }]);
    setProductSearch('');
  }

  function updateQty(productId: string, quantity: number) {
    setLines((l) => l.map((line) => (line.productId === productId ? { ...line, quantity } : line)));
  }

  function removeLine(productId: string) {
    setLines((l) => l.filter((line) => line.productId !== productId));
  }

  const totalQty = lines.reduce((sum, l) => sum + (l.quantity || 0), 0);
  const grandTotal = lines.reduce((sum, l) => {
    const product = productById(l.productId);
    return sum + (product ? parseFloat(product.unitPrice) * l.quantity : 0);
  }, 0);

  async function save(action: 'draft' | 'confirm') {
    setError('');
    if (!customerId) return setError('Select a customer first');
    if (lines.length === 0) return setError('Add at least one line item');

    setSaving(action);
    try {
      let challanId = id;
      const payload = { customerId, items: lines };

      if (challanId) {
        await api.put(`/challans/${challanId}`, payload);
      } else {
        const { data } = await api.post('/challans', payload);
        challanId = data.id;
      }

      if (action === 'confirm') {
        await api.post(`/challans/${challanId}/confirm`);
      }

      navigate(`/challans/${challanId}`);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Something went wrong');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-xs text-slate-400">Sales &gt; New Challan</div>
          <h1 className="text-xl font-semibold text-slate-800">
            Sales Challan Builder {challanNumber && <span className="text-sm text-slate-400 font-normal">({challanNumber})</span>}
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => save('draft')} disabled={!!saving} className="px-4 py-2 text-sm border border-slate-200 rounded-md disabled:opacity-60">
            {saving === 'draft' ? 'Saving…' : 'Save as Draft'}
          </button>
          <button onClick={() => save('confirm')} disabled={!!saving} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-60">
            {saving === 'confirm' ? 'Confirming…' : 'Confirm Challan'}
          </button>
        </div>
      </div>

      {error && <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 text-sm mb-3">Customer Details</h2>
          <label className="block text-xs font-medium text-slate-500 mb-1">Select Customer</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mb-4">
            <option value="">Choose a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {selectedCustomer && (
            <div className="bg-slate-50 rounded-md p-3 text-sm">
              <div className="font-medium text-slate-700">{selectedCustomer.name}</div>
              {selectedCustomer.address && <div className="text-slate-500 text-xs mt-1">{selectedCustomer.address}</div>}
              {selectedCustomer.gstNumber && <div className="text-slate-500 text-xs">GST: {selectedCustomer.gstNumber}</div>}
            </div>
          )}
        </div>

        <div className="col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 text-sm">Line Items</h2>
          </div>

          <div className="relative mb-3">
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product by name or SKU..."
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
            {filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-56 overflow-y-auto">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addLine(p.id)}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between"
                  >
                    <span>{p.name} <span className="text-xs text-slate-400">{p.sku}</span></span>
                    <span className="text-xs text-slate-400">Stock: {p.currentStock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="py-2 font-medium">Product</th>
                <th className="py-2 font-medium">Available</th>
                <th className="py-2 font-medium">Qty</th>
                <th className="py-2 font-medium">Unit Price</th>
                <th className="py-2 font-medium">Total</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const product = productById(line.productId);
                if (!product) return null;
                const insufficient = line.quantity > product.currentStock;
                return (
                  <tr key={line.productId} className={`border-b border-slate-50 last:border-0 ${insufficient ? 'bg-red-50' : ''}`}>
                    <td className="py-2">
                      <div className="text-slate-700 font-medium">{product.name}</div>
                      <div className="text-xs text-slate-400">{product.sku}</div>
                    </td>
                    <td className="py-2 text-slate-500">{product.currentStock}</td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => updateQty(line.productId, Number(e.target.value))}
                        className={`w-20 border rounded-md px-2 py-1 text-sm ${insufficient ? 'border-red-300' : 'border-slate-200'}`}
                      />
                      {insufficient && <div className="text-xs text-red-600 mt-0.5">Exceeds stock</div>}
                    </td>
                    <td className="py-2 text-slate-600">{formatCurrency(product.unitPrice)}</td>
                    <td className="py-2 text-slate-700 font-medium">{formatCurrency(parseFloat(product.unitPrice) * line.quantity)}</td>
                    <td className="py-2">
                      <button onClick={() => removeLine(line.productId)} type="button" className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">Search and add products above</td></tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-end gap-8 mt-4 pt-3 border-t border-slate-100 text-sm">
            <div>
              <div className="text-slate-400 text-xs">Total Quantity</div>
              <div className="font-semibold text-slate-800">{totalQty}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Grand Total</div>
              <div className="font-semibold text-slate-800">{formatCurrency(grandTotal)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}