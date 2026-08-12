import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Package, Plus, Search, Trash2, X } from 'lucide-react';
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
    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold flex items-center justify-center shrink-0">
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
  const [customerOpen, setCustomerOpen] = useState(false);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<'draft' | 'confirm' | null>(null);
  const [challanNumber, setChallanNumber] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'CONFIRMED' | 'CANCELLED'>('DRAFT');

  const itemSearchRef = useRef<HTMLDivElement>(null);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/customers', { params: { limit: 100 } })
      .then((res) => setCustomers(res.data.items))
      .catch(() => setError('Failed to load customers'));
    api.get('/products', { params: { limit: 100 } })
      .then((res) => setProducts(res.data.items))
      .catch(() => setError('Failed to load products'));
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

  // close open dropdowns on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (itemSearchRef.current && !itemSearchRef.current.contains(e.target as Node)) setItemSearchOpen(false);
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) setCustomerOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const productById = (pid: string) => products.find((p) => p.id === pid);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 6);
    const q = customerSearch.toLowerCase();
    return customers.filter((c) => (c.name ?? '').toLowerCase().includes(q) || (c.mobile ?? '').includes(q)).slice(0, 6);
  }, [customerSearch, customers]);

  // debounced server-side search — the first 100 products are only a "browse" cache;
  // catalogs bigger than that need a real query against the backend to be found
  useEffect(() => {
    const q = itemSearch.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      api.get('/products', { params: { search: q, limit: 20 } })
        .then((res) => {
          setSearchResults(res.data.items);
          // cache anything we find so productById can resolve it later even if it
          // wasn't in the initial 100-item preload
          setProducts((prev) => {
            const known = new Set(prev.map((p) => p.id));
            const fresh = res.data.items.filter((p: Product) => !known.has(p.id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [itemSearch]);

  // browse mode (empty box) shows the local cache; a typed query shows live server results
  const filteredProducts = useMemo(() => {
    if (!itemSearch.trim()) return products.slice(0, 8);
    return searchResults ?? [];
  }, [itemSearch, products, searchResults]);

  function selectCustomer(c: Customer) {
    setCustomerId(c.id);
    setCustomerSearch('');
    setCustomerOpen(false);
  }

  function addOrBumpLine(productId: string) {
    setLines((l) => {
      const existing = l.find((line) => line.productId === productId);
      if (existing) {
        return l.map((line) => (line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...l, { productId, quantity: 1 }];
    });
    setItemSearch('');
  }

  function updateQty(productId: string, quantity: number) {
    setLines((l) => l.map((line) => (line.productId === productId ? { ...line, quantity: Math.max(1, quantity || 1) } : line)));
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
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-xl font-semibold text-slate-800">{id ? 'Sales Challan' : 'New Sales Challan'}</h1>
        {challanNumber && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">{challanNumber}</span>}
        <StatusBadge status={status} />
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        {/* Left column */}
        <div className="space-y-4">
          {/* Customer Selection */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <StepBadge n={1} />
              <h2 className="font-semibold text-slate-800 text-sm">Customer Selection</h2>
            </div>

            <label className="block text-xs font-medium text-slate-500 mb-1.5">Search Customer</label>
            <div className="relative" ref={customerSearchRef}>
              {!selectedCustomer && (
                <>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={customerSearch}
                    onFocus={() => setCustomerOpen(true)}
                    onChange={(e) => { setCustomerSearch(e.target.value); setCustomerOpen(true); }}
                    placeholder="Search customer..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </>
              )}
              {customerOpen && !selectedCustomer && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-56 overflow-y-auto">
                  {filteredCustomers.map((c) => (
                    <button key={c.id} type="button" onClick={() => selectCustomer(c)} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between">
                      <span className="text-slate-700">{c.name}</span>
                      <span className="text-xs text-slate-400">{c.mobile}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="mt-2 flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-md p-3">
                <div className="w-8 h-8 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  <div className="font-medium text-slate-700">{selectedCustomer.name}</div>
                  {selectedCustomer.address && <div className="text-xs text-slate-400 mt-0.5">{selectedCustomer.address}</div>}
                  {selectedCustomer.gstNumber && <div className="text-xs text-slate-400">GST: {selectedCustomer.gstNumber}</div>}
                </div>
                <button type="button" onClick={() => { setCustomerId(''); setCustomerOpen(true); }} className="text-slate-400 hover:text-slate-600 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Internal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={4}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">Not saved yet — backend doesn't store notes on a challan.</p>
          </div>
        </div>

        {/* Right column: line items */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StepBadge n={2} />
              <h2 className="font-semibold text-slate-800 text-sm">Line Items</h2>
            </div>
            <div className="relative" ref={itemSearchRef}>
              <button
                type="button"
                onClick={() => setItemSearchOpen((v) => !v)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md px-3 py-1.5"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
              {itemSearchOpen && (
                <div className="absolute z-10 right-0 w-80 bg-white border border-slate-200 rounded-md shadow-lg mt-1.5">
                  <div className="relative p-2 border-b border-slate-100">
                    <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      autoFocus
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Search product or SKU..."
                      className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {searching ? (
                      <div className="px-3 py-4 text-sm text-slate-400 text-center">Searching…</div>
                    ) : filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => {
                        const alreadyIn = lines.some((l) => l.productId === p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addOrBumpLine(p.id)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between items-center"
                          >
                            <span>
                              <span className="text-slate-700">{p.name}</span>{' '}
                              <span className="text-xs text-slate-400">{p.sku}</span>
                            </span>
                            <span className="text-xs text-slate-400">
                              {alreadyIn ? 'In cart • Stock: ' : 'Stock: '}
                              {p.currentStock}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-4 text-sm text-slate-400 text-center">No products match "{itemSearch}"</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="py-2 font-medium w-8">#</th>
                <th className="py-2 font-medium">Product / SKU</th>
                <th className="py-2 font-medium">Price</th>
                <th className="py-2 font-medium">Qty</th>
                <th className="py-2 font-medium">Total</th>
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
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-slate-700 font-medium">{product.name}</div>
                          {insufficient ? (
                            <div className="text-xs text-red-600">⚠ Stock Error (Avail: {product.currentStock})</div>
                          ) : (
                            <div className="text-xs text-slate-400">{product.sku} • Stock: {product.currentStock}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-slate-600">{formatCurrency(product.unitPrice)}</td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => updateQty(line.productId, Number(e.target.value))}
                        className={`w-16 text-center border rounded-md px-1 py-1 text-sm ${insufficient ? 'border-red-300' : 'border-slate-200'}`}
                      />
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

              {lines.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                    No items yet — click "Add Product" to search your catalog
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {lines.length > 0 && (
            <div className="border-t border-slate-100 mt-2 pt-2.5 flex justify-end items-center gap-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Grand Total</span>
              <span className="text-base font-semibold text-indigo-600">{formatCurrency(grandTotal)}</span>
            </div>
          )}
        </div>
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
          <button onClick={() => save('draft')} disabled={!!saving} className="px-4 py-2 text-sm border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-60">
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