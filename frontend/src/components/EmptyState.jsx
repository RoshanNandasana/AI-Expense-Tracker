import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './ui/Button';

export const EmptyState = ({
  title = "No expenses found",
  description = "Get started by adding your first expense manually or scanning a receipt.",
  actionText,
  onAction,
  icon: Icon = Inbox,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/20 dark:bg-slate-900/10 backdrop-blur-sm max-w-md mx-auto my-6">
      <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-full text-slate-400 dark:text-slate-500 mb-4 animate-bounce-slow">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
        {description}
      </p>
      {actionText && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} variant="primary" size="sm">
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
