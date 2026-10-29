// ---------------------------------------------------------------------------
// Centralized API client for AI Expense Tracker
// All responses are normalized so frontend always sees:
//   id, amount, category, vendor (← merchant), date (← expense_date),
//   notes (← description), paymentMethod (← payment_method)
//
// The Vite dev server proxies /api → http://localhost:8000 (see vite.config.js)
// so all fetch calls use relative paths — no CORS issues.
// ---------------------------------------------------------------------------

const API_URL = '/api';

/** Build request headers, injecting the JWT if present. */
const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/** Handle non-204 responses, throwing structured errors. */
const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('token');
    // Soft redirect — AuthContext / ProtectedRoute will handle the UI redirect
    window.dispatchEvent(new Event('auth:logout'));
    throw new Error('Session expired. Please log in again.');
  }
  if (res.status === 204) return null; // No Content (DELETE success)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
};

/** Normalize a backend expense doc to the frontend shape. */
const normalizeExpense = (exp) => ({
  id: exp.id,
  amount: Number(exp.amount),
  category: exp.category || '',
  vendor: exp.merchant || '',          // backend field: merchant
  date: exp.expense_date || '',        // backend field: expense_date
  notes: exp.description || '',        // backend field: description
  paymentMethod: exp.payment_method || 'Cash',
  createdAt: exp.created_at || null,
});

// ---------------------------------------------------------------------------

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────

  register: async (name, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res); // returns { access_token, token_type }
  },

  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res); // returns { access_token, token_type }
  },

  // ── User Profile ──────────────────────────────────────────────────────────

  getProfile: async () => {
    const res = await fetch(`${API_URL}/users/me`, { headers: getHeaders() });
    return handleResponse(res); // returns user object { id, name, email, ... }
  },

  updateProfile: async (updates) => {
    const res = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  // ── Expenses CRUD ─────────────────────────────────────────────────────────

  getExpenses: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    params.append('limit', '100');

    const res = await fetch(`${API_URL}/expenses?${params.toString()}`, {
      headers: getHeaders(),
    });
    const data = await handleResponse(res);
    return (data?.expenses || []).map(normalizeExpense);
  },

  addExpense: async (expense) => {
    const res = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        amount: parseFloat(expense.amount),
        category: expense.category,
        description: expense.notes || expense.description || '',
        payment_method: expense.paymentMethod || expense.payment_method || 'Cash',
        merchant: expense.vendor || expense.merchant || '',
        expense_date: expense.date || expense.expense_date,
      }),
    });
    const saved = await handleResponse(res);
    return normalizeExpense(saved);
  },

  updateExpense: async (id, expense) => {
    const body = {};
    if (expense.amount !== undefined) body.amount = parseFloat(expense.amount);
    if (expense.category !== undefined) body.category = expense.category;
    if (expense.notes !== undefined) body.description = expense.notes;
    if (expense.description !== undefined) body.description = expense.description;
    if (expense.paymentMethod !== undefined) body.payment_method = expense.paymentMethod;
    if (expense.payment_method !== undefined) body.payment_method = expense.payment_method;
    if (expense.vendor !== undefined) body.merchant = expense.vendor;
    if (expense.merchant !== undefined) body.merchant = expense.merchant;
    if (expense.date !== undefined) body.expense_date = expense.date;
    if (expense.expense_date !== undefined) body.expense_date = expense.expense_date;

    const res = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const updated = await handleResponse(res);
    return normalizeExpense(updated);
  },

  deleteExpense: async (id) => {
    const res = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res); // 204 → returns null
    return true;
  },

  // ── Receipt OCR Upload ────────────────────────────────────────────────────

  uploadReceipt: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/receipts/upload`, {
      method: 'POST',
      headers: getHeaders(true), // multipart — no Content-Type header
      body: formData,
    });
    return handleResponse(res);
  },

  // ── Analytics ─────────────────────────────────────────────────────────────

  getDashboardStats: async (budget = 2500) => {
    const res = await fetch(`${API_URL}/analytics/dashboard?budget=${budget}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getBudgetPrediction: async (budget = 2500) => {
    const res = await fetch(`${API_URL}/analytics/budget-prediction?budget=${budget}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // ── CSV Export ────────────────────────────────────────────────────────────
  /** Fetches filtered expenses as CSV and triggers a browser download. */
  exportExpenses: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);

    const res = await fetch(`${API_URL}/expenses/export?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  },
};
