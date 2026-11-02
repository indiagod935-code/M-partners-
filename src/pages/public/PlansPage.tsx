import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';
import { SubscriptionPlan } from '../../types';

interface PlansPageProps {
  setCurrentTab: (tab: string) => void;
}

export const PlansPage: React.FC<PlansPageProps> = ({ setCurrentTab }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    fetch('/api/v1/public/info')
      .then(res => res.json())
      .then(data => {
        if (data.subscriptionPlans) setPlans(data.subscriptionPlans);
      })
      .catch(err => console.error('Error fetching plans:', err));
  }, []);

  return (
    <div className="bg-white text-neutral-900 py-12 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold uppercase tracking-wider">
            <span>Powered by Mãrçò 💯</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-black tracking-tight">
            Subscription Plans & Allowances
          </h1>
          <p className="text-base text-neutral-600 leading-relaxed">
            Transparent, flat-rate monthly allowances for your designated local Runner delivery assistance.
            Select the plan that matches your household's ordering frequency.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {plans.map((p) => {
            const isFeatured = p.name === 'Plus';
            const costPerOrder = Math.round(p.price / p.credits);

            return (
              <div
                key={p.id}
                className={`rounded-3xl p-6 flex flex-col justify-between transition border ${
                  isFeatured
                    ? 'border-black bg-neutral-950 text-white shadow-xl scale-102'
                    : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    {isFeatured && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white text-black">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-4xl font-extrabold tracking-tight">₹{p.price}</div>
                    <div className={`text-xs mt-1 font-medium ${isFeatured ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {p.validityDays} Days Validity
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Order Allowance:</span>
                      <span>{p.credits} Credits</span>
                    </div>
                    <div className={`text-xs ${isFeatured ? 'text-neutral-300' : 'text-neutral-600'}`}>
                      Equivalent to ₹{costPerOrder} per delivery
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed ${isFeatured ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {p.description}
                  </p>

                  <ul className="space-y-2 pt-2 text-xs">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>1 credit = 1 completed order</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>Dedicated local Runner</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>No surge pricing</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setCurrentTab('register')}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                      isFeatured
                        ? 'bg-white text-black hover:bg-neutral-100'
                        : 'bg-black text-white hover:bg-neutral-800'
                    }`}
                  >
                    Select Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Breakdown & Rules */}
        <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200 space-y-6">
          <h3 className="text-xl font-bold text-black">Subscription Credit Policy & Rules</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-neutral-700 leading-relaxed">
            <div className="space-y-3">
              <p>
                <strong>1. Payment Verification:</strong> Subscription payment must be verified by Admin before order credits are issued to your account.
              </p>
              <p>
                <strong>2. 30-Day Validity:</strong> Unused credits expire after 30 days from activation date. Credits do not carry forward into subsequent months.
              </p>
              <p>
                <strong>3. Deduction Upon Completion:</strong> Placing an order or shopping in progress does NOT consume credits. Exactly 1 credit is consumed only upon verified delivery completion.
              </p>
            </div>

            <div className="space-y-3">
              <p>
                <strong>4. Product Cost Separation:</strong> Subscription charges do not include the cost of items bought from shops. The store purchase total is charged separately via your Customer Wallet.
              </p>
              <p>
                <strong>5. Cancelled/Failed Orders:</strong> If an order is cancelled or unable to be fulfilled, no subscription credit is deducted.
              </p>
              <p>
                <strong>6. Plan Upgrades:</strong> You can purchase a new plan anytime once your current credits are exhausted or expired.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
