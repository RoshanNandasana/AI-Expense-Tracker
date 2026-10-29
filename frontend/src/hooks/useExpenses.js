import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const DEFAULT_BUDGET = 2500;

const DEFAULT_PROFILE = {
  name: 'User',
  email: '',
  currency: 'USD',
  budget: DEFAULT_BUDGET,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  darkMode: true,
};

export const useExpenses = () => {
  const { isAuthenticated } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(false);

  // Re-fetch whenever auth state changes (login / logout)
  useEffect(() => {
    if (!isAuthenticated) {
      setExpenses([]);
      setProfile(DEFAULT_PROFILE);
      setLoading(false);
      return;
    }

    const loadBackendData = async () => {
      try {
        setLoading(true);
        // Fetch profile and expenses in parallel
        const [userProfile, list] = await Promise.all([
          api.getProfile(),
          api.getExpenses(),
        ]);

        setProfile((prev) => ({
          ...prev,
          name: userProfile.name || prev.name,
          email: userProfile.email || prev.email,
          id: userProfile.id,
        }));

        setExpenses(list);
      } catch (err) {
        console.error('Failed to load session data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBackendData();
  }, [isAuthenticated]);

  // Sync dark mode class on html element
  useEffect(() => {
    if (profile.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile.darkMode]);

  // ── CRUD Operations ───────────────────────────────────────────────────────

  const addExpense = async (expense) => {
    const saved = await api.addExpense(expense);
    setExpenses((prev) => [saved, ...prev]);
    return saved;
  };

  const deleteExpense = async (id) => {
    await api.deleteExpense(id);
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const updateProfile = async (updates) => {
    // Build only the fields the backend /users/me PUT accepts
    const apiPayload = {};
    if (updates.name) apiPayload.name = updates.name;
    if (updates.email) apiPayload.email = updates.email;
    if (updates.password) apiPayload.password = updates.password;

    // Only call the API if there's something for it to update
    if (Object.keys(apiPayload).length > 0) {
      const updatedUser = await api.updateProfile(apiPayload);
      setProfile((prev) => ({
        ...prev,
        name: updatedUser.name || prev.name,
        email: updatedUser.email || prev.email,
        // also apply any local-only keys from updates (budget, currency, avatar, darkMode)
        ...updates,
      }));
    } else {
      // local-only update (e.g. darkMode toggle, budget, currency, avatar)
      setProfile((prev) => ({ ...prev, ...updates }));
    }
  };

  const clearAllData = () => {
    // Auth context handles token removal; we just clear local state here
    setExpenses([]);
    setProfile(DEFAULT_PROFILE);
  };

  return {
    expenses,
    profile,
    loading,
    addExpense,
    deleteExpense,
    updateProfile,
    clearAllData,
  };
};
