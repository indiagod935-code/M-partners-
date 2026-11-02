import React from 'react';
import { ShieldCheck, Target, Users, Landmark, Scale, ArrowRight } from 'lucide-react';

interface AboutPageProps {
  setCurrentTab: (tab: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ setCurrentTab }) => {
  return (
    <div className="bg-white text-neutral-900 py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Intro */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold uppercase tracking-wider">
            <span>Powered by Mãrçò 💯</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-black tracking-tight">
            About M-PARTNER
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Your Needs. Your Trusted Partner. Designed to make everyday shopping seamless, transparent, and personalized by connecting households with designated local Runners.
          </p>
        </div>

        {/* The Core Mission */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-black tracking-tight">Our Purpose</h2>
          <p className="text-sm text-neutral-700 leading-relaxed">
            Traditional on-demand delivery apps often mark up product prices, charge opaque delivery and surge fees, and assign random couriers for each transaction. M-PARTNER was created to restore trust and personal continuity in local shopping.
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed">
            With M-PARTNER, you are designated a trusted local Runner who understands your neighbourhood stores, handles your items with care, and verifies exact prices with you before any purchase is finalized.
          </p>
        </div>

        {/* 4 Pillars of Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl border border-neutral-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-black">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-black">Designated Local Runner</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Instead of random couriers, you interact with an assigned Runner dedicated to your service zone. This fosters accountability, reliability, and better communication.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-black">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-black">Separation of Fees & Goods</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Subscription plans cover only the shopping assistance allowance (1 credit = 1 completed order). The actual merchandise cost from shops is paid strictly from your wallet.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-black">
              <Landmark className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-black">Server-Side Verified Ledger</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Every wallet recharge, product debit, and credit deduction is backed by permanent server-side ledger entries and receipts. No surprise debits or undocumented fees.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-black">Administrative Oversight</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Our central operations team supervises runner credentials, verifies bank payments, reviews customer support tickets, and handles dispute resolution with prompt care.
            </p>
          </div>
        </div>

        {/* Commitment */}
        <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-200 space-y-4">
          <h3 className="text-lg font-bold text-black">Our Commitment to Transparent Accounts</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            M-PARTNER operates under strict audit controls. All wallet additions require admin verification against real payment receipts. Product expenses require uploaded receipts from the merchant or physical shop, ensuring that customers are billed only for what they receive.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setCurrentTab('register')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer"
            >
              <span>Get Started with M-PARTNER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
