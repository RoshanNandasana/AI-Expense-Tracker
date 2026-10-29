import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, TrendingDown } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, skip login page
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.login(email, password);
      login(data.access_token); // updates AuthContext + localStorage
      toast.success('Successfully signed in! Welcome back.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Visual background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-emerald-600/10 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3.5 rounded-2xl text-white shadow-xl shadow-indigo-600/30 mb-4 animate-bounce-slow">
            <TrendingDown className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Antigravity Pay
          </h2>
          <p className="text-sm text-slate-400 mt-1.5 font-medium">
            AI-powered spending tracking and intelligence
          </p>
        </div>

        {/* Auth Panel */}
        <Card glass={true} className="border border-white/5 shadow-2xl">
          <CardContent className="p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white">
                Sign in to your account
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Enter your credentials or click "Sign In" with prefilled credentials to view the dashboard instantly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                required
                className="text-white placeholder-slate-600"
              />

              <Input
                label="Password"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                required
                className="text-white placeholder-slate-600"
              />

              <div className="flex items-center justify-between text-xs font-semibold py-1">
                <label className="flex items-center text-slate-400 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mr-2 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-600"
                  />
                  Remember me
                </label>
                <a href="#forgot" className="text-indigo-400 hover:text-indigo-300">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full mt-2 cursor-pointer"
                icon={LogIn}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-slate-400 text-sm mt-6 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};
