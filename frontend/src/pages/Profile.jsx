import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, DollarSign, ShieldAlert, Sparkles, Moon, Sun, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

export const Profile = ({ profile, updateProfile, clearAllData }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout } = useAuth();
  
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [budget, setBudget] = useState(profile.budget.toString());
  const [currency, setCurrency] = useState(profile.currency);
  const [avatar, setAvatar] = useState(profile.avatar);
  
  const [loading, setLoading] = useState(false);

  const currencies = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'INR', label: 'Indian Rupee (₹)' },
    { value: 'JPY', label: 'Japanese Yen (¥)' }
  ];

  const avatars = [
    { name: 'Professional Woman', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
    { name: 'Creative Designer', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
    { name: 'Tech Engineer', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' },
    { name: 'Financial Lead', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' }
  ];

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || parseFloat(budget) <= 0) {
      toast.error('Please enter valid profile and budget entries');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        budget: parseFloat(budget),
        currency,
        avatar,
      });
      toast.success('Profile parameters updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    const confirmed = window.confirm(
      'Are you absolutely sure you want to clear all transaction records and reset your preferences? This action is irreversible.'
    );
    if (confirmed) {
      clearAllData();
      logout();
      toast.warning('All transaction logs cleared. You have been signed out.');
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight my-0">
          Profile Settings
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Manage accounts, monthly spending caps, display configurations, and database registries
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Quick Summary */}
        <div className="space-y-6">
          <Card className="glass-card text-center">
            <CardContent className="p-8 space-y-4">
              <div className="relative inline-block mx-auto">
                <img
                  src={avatar}
                  alt={profile.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-xl"
                />
                <span className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-1.5 border border-white dark:border-slate-900 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{profile.name}</h3>
                <span className="text-xs text-slate-400 dark:text-slate-500 block mt-1.5 font-medium">{profile.email}</span>
              </div>
              <div className="bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold py-1.5 px-3 rounded-xl inline-block border border-indigo-500/15">
                Monthly Budget: {profile.currency} {profile.budget}
              </div>
            </CardContent>
          </Card>

          {/* Quick preference widget */}
          <Card className="glass-card">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Quick Preferences</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-600 dark:text-slate-300">System Theme</span>
                <button
                  onClick={() => updateProfile({ darkMode: !profile.darkMode })}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors duration-150 flex items-center space-x-1.5"
                >
                  {profile.darkMode ? (
                    <>
                      <Sun className="w-4 h-4" /> <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" /> <span>Dark</span>
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit inputs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card border-slate-200/50 dark:border-slate-850/40">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Full Name"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={User}
                    required
                  />

                  <Input
                    label="Email Address"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={Mail}
                    required
                  />

                  <Input
                    label="Monthly Budget Cap"
                    id="budget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    icon={DollarSign}
                    required
                  />

                  <Select
                    label="Currency Format"
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    options={currencies}
                  />
                </div>

                {/* Avatar Picker GRID */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Choose Display Avatar</span>
                  <div className="grid grid-cols-4 gap-3.5 pt-1.5">
                    {avatars.map((av) => (
                      <button
                        key={av.url}
                        type="button"
                        onClick={() => setAvatar(av.url)}
                        className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all duration-200 cursor-pointer active:scale-95 ${
                          avatar === av.url ? 'border-indigo-500 ring-4 ring-indigo-500/10 scale-[1.03]' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                        title={av.name}
                      >
                        <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save CTA */}
                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="font-semibold cursor-pointer px-6"
                    icon={Save}
                  >
                    {loading ? "Saving Settings..." : "Save Parameters"}
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>

          {/* Database Reset Action */}
          <Card className="glass-card border-red-500/15">
            <CardHeader className="bg-red-500/5">
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>Zone of High Risk / Data Registry</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">Flush Database Registries</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-1.5 max-w-md">
                  This will completely clear your browser's localStorage cache, wiping out all logged expenses and reset preference targets back to defaults.
                </p>
              </div>
              <Button
                onClick={handleClearData}
                variant="danger"
                size="sm"
                className="cursor-pointer font-bold"
                icon={Trash2}
              >
                Clear Database
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
