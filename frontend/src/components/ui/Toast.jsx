import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Render Area */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastCard = ({ toast, onClose }) => {
  const { message, type } = toast;
  
  const styles = {
    success: 'bg-white dark:bg-slate-900 border-l-4 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xl',
    error: 'bg-white dark:bg-slate-900 border-l-4 border-red-500 text-red-800 dark:text-red-300 shadow-xl',
    warning: 'bg-white dark:bg-slate-900 border-l-4 border-amber-500 text-amber-800 dark:text-amber-300 shadow-xl',
    info: 'bg-white dark:bg-slate-900 border-l-4 border-indigo-500 text-indigo-800 dark:text-indigo-300 shadow-xl',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />,
  };

  return (
    <div
      className={`pointer-events-auto flex items-start space-x-3.5 p-4 rounded-xl glass-card backdrop-blur-lg border border-slate-200/40 dark:border-slate-800/40 transition-all duration-300 animate-slide-in ${styles[type]}`}
      role="alert"
    >
      {icons[type]}
      <div className="flex-1 text-sm font-medium pr-2 leading-relaxed break-words">
        {message}
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer active:scale-90 transition-all duration-150 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
