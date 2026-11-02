import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { LogIn, AlertCircle, ArrowRight, ShieldCheck, ShoppingBag, Bike } from 'lucide-react';

interface LoginPageProps {
  setCurrentTab: (tab: string) => void;
  defaultRole?: UserRole;
}

export const LoginPage: React.FC<LoginPageProps> = ({ setCurrentTab, defaultRole = 'customer' }) => {
  const { login, switchDemo } = useAuth();
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState('aarav.sharma@gmail.com');
  const [password, setPassword] = useState('customer123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setError(null);
    if (newRole === 'customer') {
      setEmail('aarav.sharma@gmail.com');
      setPassword('customer123');
    } else if (newRole === 'runner') {
      setEmail('rohan.runner@mpartner.com');
      setPassword('runner123');
    } else if (newRole === 'admin') {
      setEmail('admin@mpartner.com');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login(email, password, role);
    setLoading(false);

    if (res.success) {
      setCurrentTab('dashboard');
    } else {
      setError(res.error || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-bold text-xl mx-auto">
            M
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-black">Sign in to M-PARTNER</h2>
          <p className="text-xs text-neutral-500">
            Powered by <strong className="text-neutral-800">Mãrçò 💯</strong> • Your Needs. Your Trusted Partner.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleRoleChange('customer')}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              role === 'customer' ? 'bg-white text-black shadow-xs font-bold' : 'text-neutral-600 hover:text-black'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('runner')}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              role === 'runner' ? 'bg-white text-black shadow-xs font-bold' : 'text-neutral-600 hover:text-black'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Runner</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              role === 'admin' ? 'bg-white text-black shadow-xs font-bold' : 'text-neutral-600 hover:text-black'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-neutral-700 mb-1">Email or Mobile Number</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-neutral-700">Password</label>
              <button
                type="button"
                onClick={() => alert('For testing, preloaded passwords are: customer123, runner123, admin123')}
                className="text-[11px] text-neutral-500 hover:underline cursor-pointer"
              >
                Forgot?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-black text-white font-semibold text-xs hover:bg-neutral-800 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : `Sign In as ${role.toUpperCase()}`}</span>
            </button>
          </div>
        </form>

        {/* Demo Fast Track */}
        <div className="pt-4 border-t border-neutral-100 text-center">
          <p className="text-[11px] text-neutral-500 mb-2">Or instant 1-click test sign-in:</p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => { switchDemo('customer'); setCurrentTab('dashboard'); }}
              className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-medium cursor-pointer"
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={() => { switchDemo('runner'); setCurrentTab('dashboard'); }}
              className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-medium cursor-pointer"
            >
              Demo Runner
            </button>
            <button
              type="button"
              onClick={() => { switchDemo('admin'); setCurrentTab('dashboard'); }}
              className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-medium cursor-pointer"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-500">
          Don't have an account yet?{' '}
          <button
            onClick={() => setCurrentTab('register')}
            className="font-bold text-black hover:underline cursor-pointer"
          >
            Create Customer Account
          </button>
        </div>
      </div>
    </div>
  );
};
