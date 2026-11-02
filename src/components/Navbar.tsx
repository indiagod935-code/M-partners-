import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  User as UserIcon, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X, 
  Wallet, 
  Sparkles,
  ArrowRight,
  Bike
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout, switchDemo } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'plans', label: 'Subscription Plans' },
    { id: 'faq', label: 'FAQ' },
    { id: 'api-docs', label: 'API (Mobile)' },
    { id: 'tests', label: 'Automated Tests' },
    { id: 'contact', label: 'Contact & Support' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {/* Top Demo Switcher & Branding Bar */}
      <div className="bg-neutral-950 text-neutral-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white tracking-wide">M-PARTNER</span>
            <span className="text-neutral-500">|</span>
            <span className="text-neutral-400">Powered by <strong className="text-white font-medium">Mãrçò 💯</strong></span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-neutral-400 hidden sm:inline">Quick Test Switcher:</span>
            <button
              onClick={() => { switchDemo('customer'); setCurrentTab('dashboard'); }}
              className={`px-2 py-0.5 rounded text-xs transition cursor-pointer ${
                user?.role === 'customer' 
                  ? 'bg-white text-black font-semibold' 
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              Customer (Aarav)
            </button>
            <button
              onClick={() => { switchDemo('runner'); setCurrentTab('dashboard'); }}
              className={`px-2 py-0.5 rounded text-xs transition cursor-pointer ${
                user?.role === 'runner' 
                  ? 'bg-white text-black font-semibold' 
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              Runner (Rohan)
            </button>
            <button
              onClick={() => { switchDemo('admin'); setCurrentTab('dashboard'); }}
              className={`px-2 py-0.5 rounded text-xs transition cursor-pointer ${
                user?.role === 'admin' 
                  ? 'bg-white text-black font-semibold' 
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              Admin Panel
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-lg tracking-tighter group-hover:bg-neutral-800 transition">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-tight text-black">M-PARTNER</span>
              </div>
              <p className="text-[10px] text-neutral-500 font-medium tracking-wide">
                Powered by Mãrçò 💯
              </p>
            </div>
          </div>

          {/* Desktop Nav Links - Only show core links on lg screens and above to prevent squishing */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            <button
              onClick={() => setCurrentTab('home')}
              className={`text-sm font-medium transition cursor-pointer ${
                currentTab === 'home' ? 'text-black font-semibold border-b-2 border-black pb-0.5' : 'text-neutral-600 hover:text-black'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentTab('how-it-works')}
              className={`text-sm font-medium transition cursor-pointer ${
                currentTab === 'how-it-works' ? 'text-black font-semibold border-b-2 border-black pb-0.5' : 'text-neutral-600 hover:text-black'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => setCurrentTab('plans')}
              className={`text-sm font-medium transition cursor-pointer ${
                currentTab === 'plans' ? 'text-black font-semibold border-b-2 border-black pb-0.5' : 'text-neutral-600 hover:text-black'
              }`}
            >
              Plans
            </button>
            <button
              onClick={() => setCurrentTab('faq')}
              className={`text-sm font-medium transition cursor-pointer ${
                currentTab === 'faq' ? 'text-black font-semibold border-b-2 border-black pb-0.5' : 'text-neutral-600 hover:text-black'
              }`}
            >
              FAQ
            </button>
            <button
              onClick={() => setCurrentTab('about')}
              className={`text-sm font-medium transition cursor-pointer ${
                currentTab === 'about' ? 'text-black font-semibold border-b-2 border-black pb-0.5' : 'text-neutral-600 hover:text-black'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setCurrentTab('contact')}
              className={`text-sm font-medium transition cursor-pointer ${
                currentTab === 'contact' ? 'text-black font-semibold border-b-2 border-black pb-0.5' : 'text-neutral-600 hover:text-black'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Action / User Controls */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                    currentTab === 'dashboard'
                      ? 'bg-black text-white'
                      : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                  }`}
                >
                  {user.role === 'customer' && <ShoppingBag className="w-3.5 h-3.5" />}
                  {user.role === 'runner' && <Bike className="w-3.5 h-3.5" />}
                  {user.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                  <span className="truncate max-w-[120px]">
                    {user.role === 'customer' && 'Customer Portal'}
                    {user.role === 'runner' && 'Runner Portal'}
                    {user.role === 'admin' && 'Admin Panel'}
                  </span>
                </button>

                <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold text-neutral-900 leading-tight truncate max-w-[100px]">{user.name}</p>
                    <p className="text-[10px] text-neutral-500 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={logout}
                    title="Log out"
                    className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('login')}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-neutral-700 hover:text-black transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentTab('register')}
                  className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-black text-white hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile & Small Screen Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            {user && (
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-black text-white flex items-center gap-1"
              >
                {user.role === 'customer' && <ShoppingBag className="w-3 h-3" />}
                {user.role === 'runner' && <Bike className="w-3 h-3" />}
                {user.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                <span>Portal</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-neutral-700 hover:bg-neutral-100 transition"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white/98 backdrop-blur-md px-4 pt-3 pb-6 space-y-1.5 shadow-lg">
          <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-neutral-100">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setCurrentTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left py-2 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  currentTab === link.id
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-2">
            {user ? (
              <div className="space-y-2">
                <div className="px-2 py-1 text-xs text-neutral-500 flex items-center justify-between">
                  <span>Signed in as <strong>{user.name}</strong></span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 font-medium capitalize">{user.role}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setCurrentTab('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="py-2 px-3 rounded-xl bg-black text-white text-xs font-semibold text-center"
                  >
                    Open Dashboard
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="py-2 px-3 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-medium text-center hover:bg-neutral-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setCurrentTab('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setCurrentTab('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 rounded-xl bg-black text-white text-xs font-semibold text-center"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
