import React from 'react';

export const Card = ({
  children,
  className = '',
  onClick,
  glass = true,
  glow = false,
}) => {
  const baseStyle = 'rounded-2xl transition-all duration-300';
  
  const glassStyle = glass
    ? 'glass-card backdrop-blur-md'
    : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm';
    
  const glowStyle = glow 
    ? 'animate-glow' 
    : '';

  const clickableStyle = onClick 
    ? 'hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/40 cursor-pointer active:scale-[0.99]' 
    : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${glassStyle} ${glowStyle} ${clickableStyle} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-slate-100/50 dark:border-slate-800/30 flex items-center justify-between ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-slate-800 dark:text-slate-100 ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);
