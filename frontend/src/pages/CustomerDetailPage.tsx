import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import { Customer } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { useAuth } from '../context/AuthContext.js';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  Send,
  FileCheck2,
  Receipt,
} from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAddNote = hasRole(['ADMIN', 'SALES']);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${id}`);
      if (res.data.success) {
        setCustomer(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;

    try {
      setAddingNote(true);
      const res = await api.post(`/customers/${id}/notes`, { note: newNote });
      if (res.data.success) {
        setNewNote('');
        fetchCustomerDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Loading Customer Profile & Timeline...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8 space-y-4">
        <Link to="/customers" className="text-xs text-blue-400 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error || 'Customer not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Link */}
      <Link
        to="/customers"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Customer Directory</span>
      </Link>

      {/* Profile Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{customer.name}</h1>
              <StatusBadge type="customerType" value={customer.customerType} />
              <StatusBadge type="customerStatus" value={customer.status} />
            </div>
            <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-slate-300">{customer.businessName}</span>
              {customer.gstNumber && (
                <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs border border-slate-700 font-mono">
                  GSTIN: {customer.gstNumber}
                </span>
              )}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Next Scheduled Follow-up</p>
            <p className="text-sm font-semibold text-amber-400 flex items-center gap-1 justify-end mt-0.5">
              <Calendar className="w-4 h-4" />
              {customer.followUpDate
                ? new Date(customer.followUpDate).toLocaleDateString()
                : 'No follow-up set'}
            </p>
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 block mb-1">Email Contact</span>
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              {customer.email}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 block mb-1">Phone / Mobile</span>
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              {customer.mobile}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 block mb-1">Registered Address</span>
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              {customer.address}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Notes & Challan History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CRM Follow-up Notes Timeline */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-slate-100">CRM Follow-Up Timeline & Notes</h2>
          </div>

          {/* Add Note Form */}
          {canAddNote && (
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows={2}
                required
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log discussion notes, client feedback, or follow-up details..."
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingNote}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{addingNote ? 'Adding Note...' : 'Post Follow-Up Note'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Timeline Stream */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {!customer.customerNotes || customer.customerNotes.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No follow-up notes recorded yet.</p>
            ) : (
              customer.customerNotes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      {note.createdBy?.name || 'System User'}{' '}
                      <span className="text-[10px] text-slate-400">({note.createdBy?.role})</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{note.note}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Customer Sales Challans History */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Customer Sales Challans</h2>
          </div>

          {!customer.salesChallans || customer.salesChallans.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No sales challans generated for this customer yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-3 py-2.5">Challan #</th>
                    <th className="px-3 py-2.5">Total Qty</th>
                    <th className="px-3 py-2.5">Total Amount</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {customer.salesChallans.map((ch) => (
                    <tr key={ch.id} className="hover:bg-slate-800/40 transition-colors text-xs">
                      <td className="px-3 py-2.5 font-mono font-bold text-blue-400">{ch.challanNumber}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-200">{ch.totalQuantity}</td>
                      <td className="px-3 py-2.5 font-semibold text-emerald-400">${ch.totalAmount.toFixed(2)}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge type="challanStatus" value={ch.status} />
                      </td>
                      <td className="px-3 py-2.5 text-slate-400">
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
    </div>
  );
};
