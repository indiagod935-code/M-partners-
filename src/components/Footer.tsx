import React from 'react';
import { ShieldCheck, HeartHandshake, Phone, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
  openLegalModal?: (doc: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab, openLegalModal }) => {
  return (
    <footer className="bg-neutral-950 text-neutral-400 text-sm border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold text-lg">
                M
              </div>
              <span className="font-bold text-xl tracking-tight text-white">M-PARTNER</span>
            </div>
            
            <p className="text-sm text-neutral-300 font-medium">
              Powered by <span className="text-white font-semibold">Mãrçò 💯</span>
            </p>

            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              Your Needs. Your Trusted Partner. Subscription-based local shopping and home delivery assistance connecting customers directly with their designated local Runner.
            </p>

            <div className="pt-2 flex flex-col space-y-2 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span>Indiranagar Hub, Bengaluru, Karnataka</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-neutral-500" />
                <span>+91 80 4920 8000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                <span>support@mpartner.marcohun.com</span>
              </div>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => setCurrentTab('home')} className="hover:text-white transition cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('about')} className="hover:text-white transition cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('how-it-works')} className="hover:text-white transition cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('plans')} className="hover:text-white transition cursor-pointer">
                  Subscription Plans
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('faq')} className="hover:text-white transition cursor-pointer">
                  Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>

          {/* Portals & Roles */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Portals</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => setCurrentTab('login')} className="hover:text-white transition cursor-pointer">
                  Customer Sign In
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('register')} className="hover:text-white transition cursor-pointer">
                  Become a Customer
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('register-runner')} className="hover:text-white transition cursor-pointer">
                  Become a Local Runner
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('contact')} className="hover:text-white transition cursor-pointer">
                  Help & Support Center
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('contact')} className="hover:text-white transition cursor-pointer">
                  Submit a Complaint
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Policies & Guidelines</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => openLegalModal ? openLegalModal('terms') : setCurrentTab('legal')} className="hover:text-white transition cursor-pointer">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal ? openLegalModal('privacy') : setCurrentTab('legal')} className="hover:text-white transition cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal ? openLegalModal('subscription') : setCurrentTab('legal')} className="hover:text-white transition cursor-pointer">
                  Subscription & Expiry Policy
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal ? openLegalModal('wallet') : setCurrentTab('legal')} className="hover:text-white transition cursor-pointer">
                  Wallet & Payment Policy
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal ? openLegalModal('cancellation') : setCurrentTab('legal')} className="hover:text-white transition cursor-pointer">
                  Cancellation & Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal ? openLegalModal('code-of-conduct') : setCurrentTab('legal')} className="hover:text-white transition cursor-pointer">
                  Runner Code of Conduct
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal ? openLegalModal('community') : setCurrentTab('legal')} className="hover:text-white transition cursor-pointer">
                  Community Guidelines
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>
            © {new Date().getFullYear()} M-PARTNER. All rights reserved. Powered by <strong className="text-neutral-300 font-semibold">Mãrçò 💯</strong>.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Ledger Security</span>
            </span>
            <span>•</span>
            <span className="text-neutral-400">Designed for Mobile & Web</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
