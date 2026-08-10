import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { LogOut, User as UserIcon, Shield, Layers } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const roleColors = {
    ADMIN: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    SALES: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    WAREHOUSE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    ACCOUNTS: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-base leading-tight tracking-tight">
            Mini ERP <span className="text-blue-400">+ CRM</span>
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Operations Portal</p>
        </div>
      </div>

      {/* User Profile & Actions */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 py-1.5 px-3 rounded-full">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-medium text-slate-200">{user.name}</p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                roleColors[user.role] || 'bg-slate-700 text-slate-300'
              }`}
            >
              <Shield className="w-2.5 h-2.5 inline mr-1" />
              {user.role}
            </span>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 text-xs font-medium border border-slate-700/60 transition-all duration-200"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
