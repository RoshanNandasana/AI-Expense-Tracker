import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ScanLine,
  TrendingUp,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

export const Sidebar = ({ profile }) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Add Expense', path: '/add-expense', icon: PlusCircle },
    { name: 'Receipt Scanner', path: '/receipts', icon: ScanLine },
    { name: 'Analytics', path: '/analytics', icon: TrendingUp },
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  return (
    <aside
      className={`glass-panel border-r border-slate-200/40 dark:border-slate-800/40 min-h-screen text-slate-800 dark:text-slate-200 transition-all duration-300 flex flex-col relative z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/30 dark:border-slate-800/20">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="bg-indigo-600 p-2 rounded-xl text-white flex-shrink-0 shadow-lg shadow-indigo-600/30">
            <TrendingDown className="w-5 h-5" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 bg-clip-text text-transparent truncate">
              Antigravity Pay
            </span>
          )}
        </div>
        
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-md hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 font-medium group relative cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
            {!collapsed && <span className="text-sm truncate">{item.name}</span>}
            
            {/* Tooltip on collapse */}
            {collapsed && (
              <div className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-md z-30">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer User display */}
      <div className="p-4 border-t border-slate-200/30 dark:border-slate-800/20">
        <div className="flex items-center space-x-3 overflow-hidden">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20"
          />
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {profile.name}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                {profile.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
