/**
 * Format a number as currency (USD).
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format a date string to a human-readable format.
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

/**
 * Format a decimal or percentage.
 */
export const formatPercent = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * Map expense categories to standard colors.
 */
export const getCategoryColor = (category) => {
  const colors = {
    food: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    dining: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    transport: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    transportation: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    travel: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    bills: 'bg-red-500/10 text-red-500 border-red-500/20',
    utilities: 'bg-red-500/10 text-red-500 border-red-500/20',
    shopping: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    entertainment: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    leisure: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    health: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    healthcare: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    others: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    other: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  };

  const key = category?.toLowerCase() || 'others';
  return colors[key] || 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
};
