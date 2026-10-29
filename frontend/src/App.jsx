import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { useExpenses } from './hooks/useExpenses';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AddExpense } from './pages/AddExpense';
import { ReceiptUpload } from './pages/ReceiptUpload';
import { Analytics } from './pages/Analytics';
import { Profile } from './pages/Profile';

// ---------------------------------------------------------------------------
// ProtectedRoute — redirects unauthenticated users to /login
// ---------------------------------------------------------------------------
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// ---------------------------------------------------------------------------
// AuthListener — listens for the 'auth:logout' event dispatched by api.js
// when a 401 is received, and forces a React-aware redirect to /login.
// ---------------------------------------------------------------------------
const AuthListener = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout, navigate]);

  return null;
};

// ---------------------------------------------------------------------------
// Inner app shell — needs to be inside BrowserRouter for hooks to work
// ---------------------------------------------------------------------------
function AppShell() {
  const { expenses, profile, addExpense, deleteExpense, updateProfile, clearAllData } = useExpenses();

  return (
    <>
      <AuthListener />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout profile={profile} updateProfile={updateProfile} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Dashboard
                expenses={expenses}
                deleteExpense={deleteExpense}
                profile={profile}
              />
            }
          />
          <Route
            path="add-expense"
            element={<AddExpense addExpense={addExpense} />}
          />
          <Route
            path="receipts"
            element={<ReceiptUpload addExpense={addExpense} />}
          />
          <Route
            path="analytics"
            element={<Analytics expenses={expenses} profile={profile} />}
          />
          <Route
            path="profile"
            element={
              <Profile
                profile={profile}
                updateProfile={updateProfile}
                clearAllData={clearAllData}
              />
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

// ---------------------------------------------------------------------------
// Root App
// ---------------------------------------------------------------------------
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
