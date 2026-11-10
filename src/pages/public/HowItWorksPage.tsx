import React from 'react';
import { 
  UserCheck, 
  MapPin, 
  Package, 
  CheckCircle, 
  Store, 
  Wallet, 
  Bike, 
  Award,
  AlertCircle
} from 'lucide-react';

interface HowItWorksProps {
  setCurrentTab: (tab: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksProps> = ({ setCurrentTab }) => {
  const steps = [
    {
      step: '01',
      title: 'Customer creates an account',
      desc: 'Sign up with your mobile number, address, locality, landmark, and preferred language in seconds.',
    },
    {
      step: '02',
      title: 'Designated Runner assigned',
      desc: 'Based on your service area (e.g. Khuntavli, Ambarnath West), our platform designates an authorized local Runner.',
    },
    {
      step: '03',
      title: 'Select a subscription plan',
      desc: 'Choose from 5 plans (Starter ₹200 for 20 orders to Pro ₹1,000 for 100 orders). Each credit covers one delivery allowance.',
    },
    {
      step: '04',
      title: 'Request products',
      desc: 'Enter custom grocery items, milk, vegetables, medicines, or stationery with quantities, units, and brand preferences.',
    },
    {
      step: '05',
      title: 'Runner checks availability and price',
      desc: 'Your Runner visits local stores, checks stock availability, unit prices, and notes any possible substitutes.',
    },
    {
      step: '06',
      title: 'Customer confirms the order bill',
      desc: 'Review the itemized store bill and price estimate in your app. Approve with one click before the Runner buys.',
    },
    {
      step: '07',
      title: 'Runner purchases the products',
      desc: 'The Runner pays the merchant directly and uploads physical store receipt evidence to the system.',
    },
    {
      step: '08',
      title: 'Product cost deducted from wallet',
      desc: 'The exact verified product total is debited from your customer wallet through the approved transaction process.',
    },
    {
      step: '09',
      title: 'Runner delivers to your home',
      desc: 'Your Runner arrives at your delivery address and prepares for doorstep handover.',
    },
    {
      step: '10',
      title: 'Runner completes the order',
      desc: 'Handover is verified via your secret 4-digit Delivery OTP or customer delivery confirmation.',
    },
    {
      step: '11',
      title: 'One subscription credit consumed',
      desc: 'Exactly 1 subscription credit is consumed for the completed delivery. Never more than 1 credit per order.',
    },
  ];

  return (
    <div className="bg-white text-neutral-900 py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold uppercase tracking-wider">
            <span>Powered by Mãrçò 💯</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-black tracking-tight">
            How M-PARTNER Works
          </h1>
          <p className="text-base text-neutral-600 max-w-xl mx-auto leading-relaxed">
            The complete 11-step lifecycle ensuring complete transparency, personal runner assistance, and verified billing.
          </p>
        </div>

        {/* Vital Rule Notice */}
        <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-700 space-y-1">
            <p className="font-bold text-black text-sm">Vital Principle: Subscription Fee ≠ Product Cost</p>
            <p className="leading-relaxed">
              Subscription plans cover only the shopping assistance & delivery service allowance (1 completed order = 1 credit). 
              The retail cost of products purchased from local stores is paid separately through your dedicated customer wallet.
            </p>
          </div>
        </div>

        {/* 11 Steps Timeline */}
        <div className="space-y-4">
          {steps.map((s, idx) => (
            <div 
              key={s.step} 
              className="p-5 sm:p-6 rounded-2xl border border-neutral-200 hover:border-neutral-300 transition bg-white flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 shadow-xs"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {s.step}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-bold text-black">{s.title}</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="p-8 rounded-3xl bg-neutral-900 text-white text-center space-y-4">
          <h3 className="text-2xl font-bold">Ready to Experience Personal Local Shopping?</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Sign up today, choose your Starter plan, and connect with your local Runner in Khuntavli, Ambarnath, and surrounding hubs.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setCurrentTab('register')}
              className="px-6 py-3 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-100 transition cursor-pointer"
            >
              Sign Up as Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
