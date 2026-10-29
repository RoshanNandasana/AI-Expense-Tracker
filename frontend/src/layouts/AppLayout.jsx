import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

export const AppLayout = ({ profile, updateProfile }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex relative overflow-hidden transition-colors duration-300">
      
      {/* Decorative Glowing Aesthetic Orbs (Premium Design Detail) */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none z-0"></div>
      
      {/* Sidebar - Collapsible */}
      <Sidebar profile={profile} />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 overflow-hidden">
        
        {/* Top Navbar */}
        <Navbar profile={profile} updateProfile={updateProfile} />
        
        {/* Page Inner Container */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
