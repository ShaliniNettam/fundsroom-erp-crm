import React from 'react';
import { CustomerStatus, CustomerType, ChallanStatus, MovementType } from '../types/index.js';

interface StatusBadgeProps {
  type: 'customerStatus' | 'customerType' | 'challanStatus' | 'movementType' | 'stockAlert';
  value: string;
  count?: number;
  minStockAlert?: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, count, minStockAlert }) => {
  if (type === 'customerStatus') {
    const val = value as CustomerStatus;
    const styles = {
      LEAD: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      INACTIVE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[val] || 'bg-slate-700 text-slate-300'}`}>
        {val}
      </span>
    );
  }

  if (type === 'customerType') {
    const val = value as CustomerType;
    const styles = {
      RETAIL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      WHOLESALE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      DISTRIBUTOR: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[val] || 'bg-slate-700 text-slate-300'}`}>
        {val}
      </span>
    );
  }

  if (type === 'challanStatus') {
    const val = value as ChallanStatus;
    const styles = {
      DRAFT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      CONFIRMED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[val] || 'bg-slate-700 text-slate-300'}`}>
        {val}
      </span>
    );
  }

  if (type === 'movementType') {
    const val = value as MovementType;
    return val === 'IN' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        ↓ IN
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
        ↑ OUT
      </span>
    );
  }

  if (type === 'stockAlert') {
    const current = count ?? 0;
    const minAlert = minStockAlert ?? 5;
    const isLow = current <= minAlert;

    return isLow ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
        Low Stock ({current})
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        In Stock ({current})
      </span>
    );
  }

  return null;
};
