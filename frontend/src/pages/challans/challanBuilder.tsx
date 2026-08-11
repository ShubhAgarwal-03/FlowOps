import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { StatusBadge } from '../../components/statusBadge';
import { formatCurrency } from '../../lib/format';
import { Customer, Product } from '../../types';

interface DraftLine {
  productId: string;
  quantity: number;
}

function StepBadge({ n }: { n: number }) {
  return (
    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
      {n}
    </div>
  );
}

export function ChallanBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [rowSearch, setRowSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<'draft' | 'confirm' | null>(null);
  const [challanNumber, setChallanNumber] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'CONFIRMED' | 'CANCELLED'>('DRAFT');

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
      setStatus(c.status);
      setLines(c.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })));
    });
  }, [id]);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const productById = (pid: string) => products.find((p) => p.id === pid);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    const q = customerSearch.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);
  }, [customerSearch, customers]);

  const filteredProducts = useMemo(() => {
    if (!rowSearch) return [];
    const q = rowSearch.toLowerCase();
    return products
      .filter((p) => !lines.some((l) => l.productId === p.id))
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 6);
  }, [rowSearch, products, lines]);

  function selectCustomer(c: Customer) {
    setCustomerId(c.id);
    setCustomerSearch('');
  }

  function addLine(productId: string) {
    setLines((l) => [...l, { productId, quantity: 1 }]);
    setRowSearch('');
  }

  function updateQty(productId: string, quantity: number) {
    setLines((l) => l.map((line) => (line.productId === productId ? { ...line, quantity: Math.max(1, quantity) } : line)));
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
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-semibold text-slate-800">{id ? 'Sales Challan' : 'New Sales Challan'}</h1>
        {challanNumber && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">{challanNumber}</span>}
        <StatusBadge status={status} />
      </div>
      <p className="text-sm text-slate-500 mb-4">Build a challan, review stock, then confirm to dispatch.</p>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      {/* Step 1: Customer Selection */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <StepBadge n={1} />
          <h2 className="font-semibold text-slate-800 text-sm">Customer Selection</h2>
        </div>

        {!selectedCustomer ? (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search customer..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm"
            />
            {filteredCustomers.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-56 overflow-y-auto">
                {filteredCustomers.map((c) => (
                  <button key={c.id} type="button" onClick={() => selectCustomer(c)} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm">
                    {c.name} <span className="text-xs text-slate-400">{c.mobile}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start justify-between bg-slate-50 rounded-md p-3 max-w-md">
            <div className="text-sm">
              <div className="font-medium text-slate-700">{selectedCustomer.name}</div>
              {selectedCustomer.address && <div className="text-slate-500 text-xs mt-1">{selectedCustomer.address}</div>}
              {selectedCustomer.gstNumber && <div className="text-slate-500 text-xs">GST: {selectedCustomer.gstNumber}</div>}
            </div>
            <button type="button" onClick={() => setCustomerId('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Line Items */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StepBadge n={2} />
            <h2 className="font-semibold text-slate-800 text-sm">Line Items</h2>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="py-2 font-medium w-8">#</th>
              <th className="py-2 font-medium">Product / SKU</th>
              <th className="py-2 font-medium">Unit Price</th>
              <th className="py-2 font-medium">Quantity</th>
              <th className="py-2 font-medium">Subtotal</th>
              <th className="py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => {
              const product = productById(line.productId);
              if (!product) return null;
              const insufficient = line.quantity > product.currentStock;
              return (
                <tr key={line.productId} className={`border-b border-slate-50 last:border-0 ${insufficient ? 'bg-red-50' : ''}`}>
                  <td className="py-2 text-slate-400">{idx + 1}</td>
                  <td className="py-2">
                    <div className="text-slate-700 font-medium">{product.name}</div>
                    {insufficient ? (
                      <div className="text-xs text-red-600 flex items-center gap-1">⚠ Stock Error (Avail: {product.currentStock})</div>
                    ) : (
                      <div className="text-xs text-slate-400">{product.sku} • In Stock: {product.currentStock}</div>
                    )}
                  </td>
                  <td className="py-2 text-slate-600">{formatCurrency(product.unitPrice)}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => updateQty(line.productId, line.quantity - 1)} className="w-6 h-6 border border-slate-200 rounded text-slate-500 hover:bg-slate-50">−</button>
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => updateQty(line.productId, Number(e.target.value))}
                        className={`w-14 text-center border rounded-md px-1 py-1 text-sm ${insufficient ? 'border-red-300' : 'border-slate-200'}`}
                      />
                      <button type="button" onClick={() => updateQty(line.productId, line.quantity + 1)} className="w-6 h-6 border border-slate-200 rounded text-slate-500 hover:bg-slate-50">+</button>
                    </div>
                  </td>
                  <td className="py-2 text-slate-700 font-medium">{formatCurrency(parseFloat(product.unitPrice) * line.quantity)}</td>
                  <td className="py-2">
                    <button type="button" onClick={() => removeLine(line.productId)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* inline search row for adding the next product */}
            <tr>
              <td className="py-2 text-slate-400">{lines.length + 1}</td>
              <td className="py-2 relative" colSpan={5}>
                <div className="relative max-w-sm">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    value={rowSearch}
                    onChange={(e) => setRowSearch(e.target.value)}
                    placeholder="Search product..."
                    className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded-md text-sm text-slate-500"
                  />
                  {filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-72 bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-56 overflow-y-auto">
                      {filteredProducts.map((p) => (
                        <button key={p.id} type="button" onClick={() => addLine(p.id)} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between">
                          <span>{p.name} <span className="text-xs text-slate-400">{p.sku}</span></span>
                          <span className="text-xs text-slate-400">Stock: {p.currentStock}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-2">Internal Notes / Delivery Instructions</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
          rows={2}
          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
        />
      </div>

      {/* Sticky summary bar */}
      <div className="fixed bottom-0 left-60 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex gap-8 text-sm">
          <div>
            <div className="text-slate-400 text-xs">Total Items</div>
            <div className="font-semibold text-slate-800">{lines.length} / {totalQty} qty</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Grand Total</div>
            <div className="font-semibold text-slate-800">{formatCurrency(grandTotal)}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => save('draft')} disabled={!!saving} className="px-4 py-2 text-sm border border-slate-200 rounded-md disabled:opacity-60">
            {saving === 'draft' ? 'Saving…' : 'Save as Draft'}
          </button>
          <button onClick={() => save('confirm')} disabled={!!saving} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-60">
            {saving === 'confirm' ? 'Confirming…' : 'Confirm & Reduce Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}