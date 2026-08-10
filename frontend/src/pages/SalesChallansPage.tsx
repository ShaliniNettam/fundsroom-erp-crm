import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { SalesChallan, ChallanStatus, Pagination } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Modal } from '../components/Modal.js';
import { useAuth } from '../context/AuthContext.js';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Calendar,
  UserCheck,
  Receipt,
} from 'lucide-react';

export const SalesChallansPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal & Action State
  const [selectedChallan, setSelectedChallan] = useState<SalesChallan | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const canEdit = hasRole(['ADMIN', 'SALES']);

  useEffect(() => {
    fetchChallans();
  }, [page, search, statusFilter]);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/sales-challans', { params });
      if (res.data.success) {
        setChallans(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch sales challans:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = async (challanId: string) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      const res = await api.get(`/sales-challans/${challanId}`);
      if (res.data.success) {
        setSelectedChallan(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load challan details');
    }
  };

  const handleUpdateStatus = async (challanId: string, newStatus: ChallanStatus) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      setActionLoading(true);

      const res = await api.patch(`/sales-challans/${challanId}/status`, {
        status: newStatus,
      });

      if (res.data.success) {
        setActionSuccess(`Challan status successfully updated to ${newStatus}.`);
        fetchChallans();
        // Refresh selected challan
        openDetailModal(challanId);
      }
    } catch (err: any) {
      setActionError(
        err.response?.data?.message || `Failed to update status to ${newStatus}`
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-400" />
            Sales Challans Operations
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Generate, confirm, and manage customer dispatch sales challans with transactional stock control.</p>
        </div>

        {canEdit && (
          <Link
            to="/sales-challans/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sales Challan</span>
          </Link>
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
            placeholder="Search Challan # (SCH-...), customer name, business..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">All Challan Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed (Stock Reduced)</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading Sales Challans...</div>
        ) : challans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No sales challans recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Challan #</th>
                  <th className="px-4 py-3.5">Customer & Business</th>
                  <th className="px-4 py-3.5">Total Qty</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Created Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {challans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-blue-400">
                      {ch.challanNumber}
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-100">{ch.customer?.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        {ch.customer?.businessName}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-200">
                      {ch.totalQuantity} items
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-emerald-400">
                      ${ch.totalAmount.toFixed(2)}
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge type="challanStatus" value={ch.status} />
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openDetailModal(ch.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
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
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Sales Challans)
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

      {/* View Challan Detail Modal (with Product Snapshot View & Stock Transaction Action) */}
      <Modal
        isOpen={!!selectedChallan}
        onClose={() => setSelectedChallan(null)}
        title={`Sales Challan Details: ${selectedChallan?.challanNumber || ''}`}
        maxWidth="2xl"
      >
        {selectedChallan && (
          <div className="space-y-6">
            {/* Status & Error Banners */}
            {actionError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Transaction Aborted (Stock Control Guard)</p>
                  <p>{actionError}</p>
                </div>
              </div>
            )}

            {actionSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p>{actionSuccess}</p>
              </div>
            )}

            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                  Challan Status
                </span>
                <StatusBadge type="challanStatus" value={selectedChallan.status} />
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                  Customer Profile
                </span>
                <p className="font-semibold text-slate-100 text-xs">{selectedChallan.customer?.name}</p>
                <p className="text-[11px] text-slate-400">{selectedChallan.customer?.businessName}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                  Issued Date & User
                </span>
                <p className="text-xs text-slate-200 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {new Date(selectedChallan.createdAt).toLocaleDateString()}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-slate-500" />
                  {selectedChallan.createdBy?.name}
                </p>
              </div>
            </div>

            {/* Product Snapshot Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-blue-400" />
                  Product Snapshot Items (Immutable Record)
                </h3>
                <span className="text-xs text-slate-400">Total Items: {selectedChallan.totalQuantity}</span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5">Snapshot Product</th>
                      <th className="px-3 py-2.5">SKU</th>
                      <th className="px-3 py-2.5">Unit Price</th>
                      <th className="px-3 py-2.5">Qty</th>
                      <th className="px-3 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedChallan.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 font-medium text-slate-100">
                          {item.productName}
                          {item.product && (
                            <span className="block text-[10px] text-slate-400">
                              (Current Warehouse Stock: {item.product.currentStock} units)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-400">{item.sku}</td>
                        <td className="px-3 py-2.5 text-slate-200">${item.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-100">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-400">
                          ${item.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-800/60 font-semibold text-slate-200 border-t border-slate-800">
                    <tr>
                      <td colSpan={3} className="px-3 py-3 text-right">Grand Total Amount:</td>
                      <td className="px-3 py-3 font-bold">{selectedChallan.totalQuantity}</td>
                      <td className="px-3 py-3 text-right text-sm font-bold text-emerald-400">
                        ${selectedChallan.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {selectedChallan.status === 'DRAFT' && 'Confirming this challan will deduct stock for all items.'}
                {selectedChallan.status === 'CONFIRMED' && 'Stock has been deducted for this confirmed sales challan.'}
              </span>

              <div className="flex items-center gap-2">
                {canEdit && selectedChallan.status === 'DRAFT' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedChallan.id, 'CONFIRMED')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{actionLoading ? 'Verifying Stock...' : 'Confirm Challan & Reduce Stock'}</span>
                  </button>
                )}

                {canEdit && selectedChallan.status === 'CONFIRMED' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedChallan.id, 'CANCELLED')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-medium disabled:opacity-50 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Challan & Restore Stock</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedChallan(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
