import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { DashboardStats } from '../types/index.js';
import { MetricCard } from '../components/MetricCard.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  Users,
  Package,
  AlertTriangle,
  FileCheck2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Loading Dashboard Operations...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error || 'Failed to load statistics'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Operations Overview</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time status of customers, products, stock levels, and sales challans.</p>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Customers"
          value={stats.summary.totalCustomers}
          subtitle="Registered CRM Leads & Clients"
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Product Catalog"
          value={stats.summary.totalProducts}
          subtitle="Active SKUs in Inventory"
          icon={Package}
          color="purple"
        />
        <MetricCard
          title="Low Stock Alerts"
          value={stats.summary.lowStockCount}
          subtitle="Products below minimum threshold"
          icon={AlertTriangle}
          color={stats.summary.lowStockCount > 0 ? 'rose' : 'emerald'}
        />
        <MetricCard
          title="Confirmed Sales"
          value={`$${stats.summary.confirmedChallanAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle={`${stats.summary.confirmedChallansCount} Confirmed Challans`}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Low Stock Alert Table */}
      {stats.lowStockProducts.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Low Stock Inventory Warnings</h2>
                <p className="text-xs text-rose-400/90">Immediate stock replenishment recommended</p>
              </div>
            </div>
            <Link
              to="/products?lowStock=true"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>View All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Current Stock</th>
                  <th className="px-4 py-3">Min Alert Level</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stats.lowStockProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-100">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.location}</td>
                    <td className="px-4 py-3 font-bold text-rose-400">{p.currentStock}</td>
                    <td className="px-4 py-3 text-slate-400">{p.minStockAlert}</td>
                    <td className="px-4 py-3">
                      <StatusBadge type="stockAlert" value="" count={p.currentStock} minStockAlert={p.minStockAlert} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Challans List */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Recent Sales Challans</h2>
              <p className="text-xs text-slate-400">Latest generated dispatch challans</p>
            </div>
          </div>
          <Link
            to="/sales-challans"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Challans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentChallans.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No sales challans recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Challan #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total Qty</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stats.recentChallans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-400">{ch.challanNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-100">{ch.customer?.name}</p>
                      <p className="text-xs text-slate-400">{ch.customer?.businessName}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{ch.totalQuantity} items</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">${ch.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge type="challanStatus" value={ch.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
