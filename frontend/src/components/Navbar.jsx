import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ profile, updateProfile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Fintech Dashboard';
      case '/add-expense':
        return 'Record Expense';
      case '/receipts':
        return 'AI Receipt Scanner';
      case '/analytics':
        return 'Spending Intelligence';
      case '/profile':
        return 'Profile Preferences';
      default:
        return 'AI Expense Tracker';
    }
  };

  const toggleDarkMode = () => {
    updateProfile({ darkMode: !profile.darkMode });
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const notifications = [
    { id: 1, text: "💡 AI Insight: You are spending 15% less than last month!" },
    { id: 2, text: "🚨 Budget Alert: Bills category is at 85% limit." },
    { id: 3, text: "✨ Receipt Scanned: Whole Foods receipt processed successfully." }
  ];

  return (
    <header className="h-16 border-b border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between px-6 bg-white/30 dark:bg-slate-950/20 backdrop-blur-md relative z-10">
      
      {/* Title block */}
      <div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight my-0 py-0 leading-none">
          {getPageTitle()}
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
          Welcome back, {profile.name.split(' ')[0]}!
        </p>
      </div>

      {/* Action block */}
      <div className="flex items-center space-x-4">
        {/* Modern Search */}
        <div className="relative hidden md:block w-64">
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full bg-slate-100/60 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200/40 dark:border-slate-800/40 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none rounded-xl py-2 pl-10 pr-4 text-xs transition-all duration-200"
          />
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-all duration-200 cursor-pointer active:scale-90"
          title="Toggle Dark/Light Mode"
        >
          {profile.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-all duration-200 relative cursor-pointer active:scale-90"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full border border-white dark:border-slate-950 shadow-md animate-pulse"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 glass-card rounded-2xl shadow-xl overflow-hidden z-50 border border-slate-200/60 dark:border-slate-800/60 animate-slide-in">
              <div className="px-4 py-3 border-b border-slate-200/40 dark:border-slate-800/30 flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Alerts & Insights</span>
                <span className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold">New</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors duration-150">
                    {notif.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Logout Quick-Button */}
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-all duration-200 cursor-pointer active:scale-90"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
