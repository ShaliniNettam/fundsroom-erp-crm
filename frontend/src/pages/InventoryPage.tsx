import React, { useEffect, useState } from 'react';
import api from '../api/client.js';
import { StockMovement, Product, MovementType, Pagination } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Modal } from '../components/Modal.js';
import { useAuth } from '../context/AuthContext.js';
import {
  ArrowLeftRight,
  Search,
  Plus,
  Filter,
  Package,
  FileText,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [logs, setLogs] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Adjustment Form Data
  const [adjustData, setAdjustData] = useState({
    productId: '',
    quantity: 1,
    movementType: 'IN' as MovementType,
    reason: '',
  });

  const canAdjust = hasRole(['ADMIN', 'WAREHOUSE']);

  useEffect(() => {
    fetchLogs();
    fetchProducts();
  }, [page, search, movementFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (movementFilter) params.movementType = movementFilter;

      const res = await api.get('/stock-movements', { params });
      if (res.data.success) {
        setLogs(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch stock movement logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { limit: 100 } });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch product list for dropdown:', err);
    }
  };

  const openAdjustModal = () => {
    setAdjustData({
      productId: products[0]?.id || '',
      quantity: 1,
      movementType: 'IN',
      reason: '',
    });
    setFormError(null);
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await api.post('/stock-movements', {
        ...adjustData,
        quantity: Number(adjustData.quantity),
      });

      if (res.data.success) {
        setIsAdjustModalOpen(false);
        fetchLogs();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to record stock movement');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === adjustData.productId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-amber-400" />
            Inventory & Stock Movement Logs
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Audit log of all IN/OUT stock adjustments, purchase inward receipts, and sales challan dispatches.</p>
        </div>

        {canAdjust && (
          <button
            onClick={openAdjustModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-sm shadow-md shadow-amber-500/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Record Manual Stock Adjustment</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search reason, product name, SKU..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Movement Type Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <select
            value={movementFilter}
            onChange={(e) => {
              setMovementFilter(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="">All Movement Types (IN & OUT)</option>
            <option value="IN">Stock IN (Inward)</option>
            <option value="OUT">Stock OUT (Dispatched)</option>
          </select>
        </div>
      </div>

      {/* Movement Log Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading Stock Movement Logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No stock movement logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Product Details</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Quantity</th>
                  <th className="px-4 py-3.5">Reason / Source</th>
                  <th className="px-4 py-3.5">Logged By</th>
                  <th className="px-4 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-100">{log.product?.name}</p>
                      <p className="text-xs text-slate-400 font-mono">SKU: {log.product?.sku}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge type="movementType" value={log.movementType} />
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-100">
                      {log.movementType === 'IN' ? '+' : '-'}{log.quantity} units
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        {log.reason}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        {log.createdBy?.name} ({log.createdBy?.role})
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Log Entries)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Record Stock IN / OUT Adjustment"
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>{formError}</div>
          </div>
        )}

        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Product *</label>
            <select
              required
              value={adjustData.productId}
              onChange={(e) => setAdjustData({ ...adjustData, productId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available Stock: {p.currentStock} units
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Movement Type *</label>
              <select
                value={adjustData.movementType}
                onChange={(e) => setAdjustData({ ...adjustData, movementType: e.target.value as MovementType })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="IN">IN (+) Stock Receipt / Inward</option>
                <option value="OUT">OUT (-) Stock Reduction / Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={adjustData.quantity}
                onChange={(e) => setAdjustData({ ...adjustData, quantity: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {selectedProduct && adjustData.movementType === 'OUT' && (
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 flex justify-between items-center">
              <span>Current Stock: <strong className="text-slate-100">{selectedProduct.currentStock}</strong></span>
              <span>Stock After Reduction: <strong className={selectedProduct.currentStock - adjustData.quantity < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{selectedProduct.currentStock - adjustData.quantity}</strong></span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Reference *</label>
            <input
              type="text"
              required
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              placeholder="e.g. Purchase Receipt PO #88, Physical Count Adjustment, Damaged Stock"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Stock Movement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
