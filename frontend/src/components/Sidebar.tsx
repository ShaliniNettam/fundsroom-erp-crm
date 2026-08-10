import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeftRight,
  FileSpreadsheet,
  PlusCircle,
} from 'lucide-react';
import { UserRole } from '../types/index.js';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
    {
      name: 'Customer CRM',
      path: '/customers',
      icon: Users,
      roles: ['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'],
    },
    {
      name: 'Product Catalog',
      path: '/products',
      icon: Package,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
    {
      name: 'Inventory & Stock Logs',
      path: '/inventory',
      icon: ArrowLeftRight,
      roles: ['ADMIN', 'WAREHOUSE', 'ACCOUNTS', 'SALES'],
    },
    {
      name: 'Sales Challans',
      path: '/sales-challans',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Quick Action Button for Admin / Sales */}
        {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <NavLink
            to="/sales-challans/new"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition-all duration-200"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Challan</span>
          </NavLink>
        )}

        {/* Navigation List */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Navigation
          </p>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Role Banner Info */}
      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-400 text-xs">
        <p className="font-semibold text-slate-300 mb-1">Active Role: {user?.role}</p>
        <p className="text-[11px] text-slate-400">
          {user?.role === 'ADMIN' && 'Full administrative access across all ERP/CRM modules.'}
          {user?.role === 'SALES' && 'Manage CRM, Create & Confirm Sales Challans.'}
          {user?.role === 'WAREHOUSE' && 'Manage Products & Stock Movement IN/OUT.'}
          {user?.role === 'ACCOUNTS' && 'View Customers, Invoices, and Challans.'}
        </p>
      </div>
    </aside>
  );
};
