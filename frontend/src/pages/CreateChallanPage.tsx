import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import { Customer, Product, ChallanStatus } from '../types/index.js';
import {
  FileSpreadsheet,
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Save,
  Building2,
  DollarSign,
} from 'lucide-react';

interface SelectedItem {
  productId: string;
  quantity: number;
}

export const CreateChallanPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers', { params: { limit: 100 } }),
        api.get('/products', { params: { limit: 100 } }),
      ]);

      if (custRes.data.success) setCustomers(custRes.data.data);
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
        if (custRes.data.data.length > 0) setCustomerId(custRes.data.data[0].id);
        if (prodRes.data.data.length > 0) {
          setItems([{ productId: prodRes.data.data[0].id, quantity: 1 }]);
        }
      }
    } catch (err) {
      console.error('Failed to load initial data for challan form:', err);
    } finally {
      setLoading(false);
    }
  };

  const productMap = new Map(products.map((p) => [p.id, p]));

  const addItemRow = () => {
    if (products.length === 0) return;
    setItems([...items, { productId: products[0].id, quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SelectedItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Calculations & Validation
  let grandTotalQuantity = 0;
  let grandTotalAmount = 0;
  let hasInsufficientStockWarning = false;

  items.forEach((item) => {
    const prod = productMap.get(item.productId);
    if (prod) {
      grandTotalQuantity += item.quantity;
      grandTotalAmount += prod.unitPrice * item.quantity;
      if (item.quantity > prod.currentStock) {
        hasInsufficientStockWarning = true;
      }
    }
  });

  const handleSubmit = async (status: ChallanStatus) => {
    setFormError(null);
    if (!customerId) {
      setFormError('Please select a customer.');
      return;
    }
    if (items.length === 0) {
      setFormError('Please add at least one product item.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerId,
        status,
        items,
      };

      const res = await api.post('/sales-challans', payload);
      if (res.data.success) {
        navigate('/sales-challans');
      }
    } catch (err: any) {
      setFormError(
        err.response?.data?.message || 'Failed to generate sales challan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Loading Customer & Product Masters...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        to="/sales-challans"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Sales Challans Directory</span>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-blue-400" />
          Create New Sales Challan
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Generate auto-numbered dispatch challan with real-time stock verification.</p>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-300">Transaction Aborted</p>
            <p className="mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* Customer Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-400" />
            Select Customer *
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.businessName} ({c.customerType})
              </option>
            ))}
          </select>
        </div>

        {/* Multi-Product Items Picker */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Challan Line Items
            </h2>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const selectedProd = productMap.get(item.productId);
              const lineTotal = selectedProd ? selectedProd.unitPrice * item.quantity : 0;
              const isInsufficient = selectedProd ? item.quantity > selectedProd.currentStock : false;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-all ${
                    isInsufficient
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-slate-800/50 border-slate-800'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Product Dropdown */}
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity Input */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, 'quantity', parseInt(e.target.value, 10) || 1)
                        }
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Price preview */}
                    <div className="sm:col-span-3">
                      <span className="block text-[10px] text-slate-400 uppercase mb-1">Line Total</span>
                      <span className="font-bold text-emerald-400 text-xs block pt-1">
                        ${lineTotal.toFixed(2)}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          (${selectedProd?.unitPrice.toFixed(2)}/unit)
                        </span>
                      </span>
                    </div>

                    {/* Delete button */}
                    <div className="sm:col-span-1 text-right pt-4 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        disabled={items.length <= 1}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stock Availability Info */}
                  {selectedProd && (
                    <div className="mt-2 text-xs flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <span className="text-slate-400 text-[11px]">
                        Available Warehouse Stock: <strong className="text-slate-200">{selectedProd.currentStock} units</strong>
                      </span>
                      {isInsufficient && (
                        <span className="text-rose-400 text-[11px] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Exceeds available stock! Direct confirmation will fail.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Footer */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400">Total Quantity: <strong className="text-slate-100">{grandTotalQuantity} units</strong></span>
          </div>

          <div>
            <span className="text-xs text-slate-400">Grand Total Amount: <strong className="text-emerald-400 text-lg font-bold ml-1">${grandTotalAmount.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('DRAFT')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>Save as Draft (No Stock Change)</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('CONFIRMED')}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 ${
              hasInsufficientStockWarning
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Processing Transaction...' : 'Direct Confirm & Reduce Stock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
