import React from 'react';

export const Skeleton = ({ className = '', variant = 'rect' }) => {
  const baseStyle = 'animate-pulse bg-slate-200 dark:bg-slate-800/60';
  
  const variants = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-md h-4 w-full',
  };

  return <div className={`${baseStyle} ${variants[variant]} ${className}`} />;
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-6 space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>

      {/* Main Breakdown Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-56 w-full rounded-full" />
        </div>
      </div>

      {/* Transactions Area */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <Skeleton className="h-5 w-1/5" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="flex space-x-3 items-center w-1/2">
                <Skeleton variant="circle" className="h-10 h-10 w-10 flex-shrink-0" />
                <div className="space-y-1.5 w-full">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
