import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  CreditCard, 
  Clock, 
  ShieldCheck, 
  MessageSquare, 
  ShoppingBag, 
  Bike, 
  Receipt, 
  Check, 
  HelpCircle,
  Search,
  ExternalLink
} from 'lucide-react';
import { SubscriptionPlan, ServiceArea } from '../../types';

interface HomePageProps {
  setCurrentTab: (tab: string) => void;
  openLegalModal: (doc: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentTab, openLegalModal }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [searchArea, setSearchArea] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/public/info')
      .then(res => res.json())
      .then(data => {
        if (data.subscriptionPlans) setPlans(data.subscriptionPlans);
        if (data.serviceAreas) setAreas(data.serviceAreas);
      })
      .catch(err => console.error('Error fetching public info:', err));
  }, []);

  const checkAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchArea.trim()) return;

    const matched = areas.find(a => 
      a.name.toLowerCase().includes(searchArea.toLowerCase()) || 
      (a.pincode && a.pincode.includes(searchArea))
    );

    if (matched) {
      setSearchResult(`Service Available in ${matched.name}, ${matched.city}! Designated Runners are active in this zone.`);
    } else {
      setSearchResult(`We are expanding soon to "${searchArea}". Currently active in: ${areas.map(a => a.name).join(', ')}.`);
    }
  };

  return (
    <div className="bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold tracking-wide uppercase">
              <span>Powered by Mãrçò 💯</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-black leading-[1.1]">
              Your Needs.<br />
              <span className="text-neutral-500">Your Trusted Partner.</span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
              M-PARTNER connects you with your designated local Runner for everyday shopping and home delivery. Subscribe to a plan, request the products you need, communicate with your Runner, and track your orders from one convenient platform.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => setCurrentTab('register')}
                className="px-6 py-3.5 rounded-xl bg-black text-white font-medium hover:bg-neutral-800 transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentTab('login')}
                className="px-6 py-3.5 rounded-xl border border-neutral-300 text-neutral-800 font-medium hover:bg-neutral-50 transition cursor-pointer"
              >
                Customer Login
              </button>

              <button
                onClick={() => setCurrentTab('register-runner')}
                className="px-6 py-3.5 rounded-xl bg-neutral-100 text-neutral-800 font-medium hover:bg-neutral-200 transition flex items-center gap-2 cursor-pointer"
              >
                <Bike className="w-4 h-4" />
                <span>Become a Runner</span>
              </button>

              <button
                onClick={() => setCurrentTab('how-it-works')}
                className="px-5 py-3.5 text-neutral-600 hover:text-black font-medium transition cursor-pointer"
              >
                How It Works
              </button>
            </div>
          </div>

          {/* Quick Service Area Check Box */}
          <div className="mt-14 max-w-xl mx-auto bg-neutral-50 p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-black" />
              Check Service Availability in Your Locality
            </h3>
            <form onSubmit={checkAvailability} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter area (e.g. Khuntavli, Ambarnath West, 421501)"
                value={searchArea}
                onChange={(e) => setSearchArea(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition cursor-pointer"
              >
                Check
              </button>
            </form>

            {searchResult && (
              <p className={`mt-3 text-xs font-medium ${searchResult.includes('Available') ? 'text-emerald-700' : 'text-neutral-600'}`}>
                {searchResult}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5 items-center text-xs text-neutral-500">
              <span className="font-semibold text-neutral-700">Configured Hubs:</span>
              {areas.map((a) => (
                <span key={a.id} className="text-neutral-600 font-medium">
                  {a.name}
                  {a !== areas[areas.length - 1] ? ' •' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Architecture Pillars: Subscription vs Wallet */}
      <section className="py-16 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Clear & Transparent Pricing</h2>
            <h3 className="text-3xl font-bold text-black tracking-tight">Two Distinct Systems, Complete Peace of Mind</h3>
            <p className="mt-2 text-sm text-neutral-600">
              At M-PARTNER, subscription fees and product shopping costs are strictly separated so you always have full visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Box 1: Subscription */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-black flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="text-xl font-bold text-black">Subscription Credits</h4>
              <p className="text-xs font-semibold text-neutral-500 uppercase">Order Delivery Allowance</p>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Covers your designated Runner's shopping assistance and delivery service. Each successfully completed delivery consumes exactly <strong>1 credit</strong>.
              </p>
              <ul className="space-y-2 text-xs text-neutral-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Valid for 30 days from activation date</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Credits deducted only when order is marked delivered</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Does not include actual product purchase prices</span>
                </li>
              </ul>
            </div>

            {/* Box 2: Wallet */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-black flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="text-xl font-bold text-black">Customer Wallet</h4>
              <p className="text-xs font-semibold text-neutral-500 uppercase">Actual Product Purchase Funds</p>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Dedicated funds used strictly for paying the actual store prices of items purchased by your Runner.
              </p>
              <ul className="space-y-2 text-xs text-neutral-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Recharged securely via Admin-verified UPI / Bank receipt</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Debited only after price confirmation & shop purchase</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Permanent financial ledger with full receipt audit</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Subscription Plans Showcase */}
      <section className="py-20 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Subscription Plans</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
              Predictable Monthly Plans for Every Household
            </h3>
            <p className="mt-3 text-sm text-neutral-600">
              Select an allowance that fits your shopping rhythm. Unused credits expire after 30 days. Product purchase costs charged separately from your wallet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {plans.map((p, idx) => {
              const isPopular = p.name === 'Plus' || p.name === 'Standard';
              return (
                <div 
                  key={p.id}
                  className={`rounded-2xl p-6 flex flex-col justify-between transition border ${
                    isPopular 
                      ? 'border-black bg-neutral-900 text-white shadow-lg' 
                      : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg">{p.name}</h4>
                      {isPopular && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white text-black">
                          Popular
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-3xl font-extrabold tracking-tight">₹{p.price}</div>
                      <p className={`text-xs mt-1 ${isPopular ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {p.validityDays} days validity
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-200/20 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span>Order Credits:</span>
                        <span>{p.credits} deliveries</span>
                      </div>
                      <div className={`text-[11px] ${isPopular ? 'text-neutral-300' : 'text-neutral-600'}`}>
                        ₹{Math.round(p.price / p.credits)} per delivery allowance
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed ${isPopular ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => setCurrentTab('register')}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                        isPopular
                          ? 'bg-white text-black hover:bg-neutral-100'
                          : 'bg-black text-white hover:bg-neutral-800'
                      }`}
                    >
                      Subscribe Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-xs text-neutral-500">
            * Note: Subscription charges cover the order-service delivery allowance. Product retail costs from local merchants are charged separately via your customer wallet.
          </p>
        </div>
      </section>

      {/* 4. How the Service Works (Step-by-Step) */}
      <section className="py-20 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Seamless Experience</h2>
            <h3 className="text-3xl font-bold text-black tracking-tight">How M-PARTNER Works</h3>
            <p className="mt-2 text-sm text-neutral-600">
              From placing your custom shopping list to doorstep delivery in simple, transparent steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-3">
              <span className="text-xs font-bold text-neutral-400">01</span>
              <h4 className="font-bold text-base text-black">Create Account & Plan</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Sign up with your home address. Choose a monthly subscription plan (from ₹200 for 20 deliveries) and get your designated local Runner assigned.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-3">
              <span className="text-xs font-bold text-neutral-400">02</span>
              <h4 className="font-bold text-base text-black">Request Any Products</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Enter your items (e.g. 1kg Tata Salt, 1L Sunflower Oil, fresh vegetables, stationery, medicines) without restricted catalogue limits.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-3">
              <span className="text-xs font-bold text-neutral-400">03</span>
              <h4 className="font-bold text-base text-black">Price Confirmation</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Your Runner visits local shops, checks exact stock and unit prices, and submits the bill details. You approve the final bill before purchasing.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-3">
              <span className="text-xs font-bold text-neutral-400">04</span>
              <h4 className="font-bold text-base text-black">Delivery & 1 Credit Used</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Runner delivers to your home. Provide your 4-digit Delivery OTP. The product cost is debited from your wallet, and exactly 1 subscription credit is consumed.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setCurrentTab('how-it-works')}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black hover:underline cursor-pointer"
            >
              <span>View Full 11-Step Lifecycle & Policy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Customer & Runner Dual Benefits */}
      <section className="py-20 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Customer Benefits */}
            <div className="space-y-6">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">For Customers</span>
              <h3 className="text-3xl font-bold text-black tracking-tight">
                A Dedicated Shopping Partner for Your Household
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                No inflated menu prices or platform surge pricing. You get actual merchant rates from your trusted neighbourhood stores through your designated local Runner.
              </p>

              <div className="space-y-3.5 text-xs text-neutral-700">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-neutral-100 text-black mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-black font-semibold">Consistent Dedicated Runner:</strong> Build trusted communication with a local runner who knows your preferences.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-neutral-100 text-black mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-black font-semibold">Zero Surge Surcharges:</strong> Flat credit per delivery regardless of whether you order ₹100 or ₹1,500 worth of groceries.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-neutral-100 text-black mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-black font-semibold">Real Receipts & Transparency:</strong> Inspect store receipts, verify MRPs, and confirm prices prior to runner checkout.
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setCurrentTab('register')}
                  className="px-5 py-3 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer"
                >
                  Join M-PARTNER as Customer
                </button>
              </div>
            </div>

            {/* Runner Benefits */}
            <div className="space-y-6 bg-neutral-50 p-8 rounded-3xl border border-neutral-200">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">For Runners</span>
              <h3 className="text-3xl font-bold text-black tracking-tight">
                Earn Predictably with Assigned Local Customers
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Work within your localized neighbourhood zone. Build ongoing professional relationships with a regular set of households.
              </p>

              <div className="space-y-3.5 text-xs text-neutral-700">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-white text-black mt-0.5 shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-black font-semibold">Localized Service Zones:</strong> No high-mileage cross-city transit. Work within your designated community.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-white text-black mt-0.5 shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-black font-semibold">Flexible Availability Controls:</strong> Toggle your online status anytime from the Runner Portal.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-white text-black mt-0.5 shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-black font-semibold">Admin-Backed Settlements:</strong> Verified ledger records protect your delivery payouts and purchase reimbursements.
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setCurrentTab('register-runner')}
                  className="px-5 py-3 rounded-xl border border-neutral-300 bg-white text-black text-xs font-semibold hover:bg-neutral-100 transition cursor-pointer"
                >
                  Apply as a Local Runner
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Preview */}
      <section className="py-20 border-b border-neutral-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Got Questions?</h2>
            <h3 className="text-3xl font-bold text-black tracking-tight">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-neutral-200">
              <h4 className="text-sm font-bold text-black mb-1.5">What is M-PARTNER?</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                M-PARTNER, powered by Mãrçò 💯, is a subscription-based local shopping and delivery assistance platform that connects customers with a designated neighbourhood Runner to purchase items from nearby shops and deliver them to your door.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-neutral-200">
              <h4 className="text-sm font-bold text-black mb-1.5">Are product prices included in the subscription plan?</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                No. Subscription plans (such as ₹200 for 20 deliveries) cover only the delivery service allowance. Product costs are paid directly from your customer wallet based on verified store bills.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-neutral-200">
              <h4 className="text-sm font-bold text-black mb-1.5">How do I add money to my wallet?</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Navigate to "My Wallet" and select "Request Recharge". Enter your desired amount, complete the transfer using the Admin UPI ID or bank method provided, and submit the transaction reference. Admin verifies receipt and credits your wallet atomically.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-neutral-200">
              <h4 className="text-sm font-bold text-black mb-1.5">What happens if a requested item is out of stock?</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Your Runner will inspect the shop and send an in-app message with alternative brand options or mark the item as unavailable. You confirm or reject the adjusted bill before any purchase occurs.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setCurrentTab('faq')}
              className="text-xs font-bold text-black uppercase tracking-wider hover:underline cursor-pointer"
            >
              Browse All Frequently Asked Questions →
            </button>
          </div>
        </div>
      </section>

      {/* 7. Safety, Trust & Support Callout */}
      <section className="py-16 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight">Built on Transparency & Security</h3>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Every transaction, subscription credit, and order progress state is immutably logged on our server-side ledger. Our administration team supervises orders and customer support 7 days a week.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setCurrentTab('contact')}
              className="px-5 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-100 transition cursor-pointer"
            >
              Contact Support
            </button>
            <button
              onClick={() => setCurrentTab('about')}
              className="px-5 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 text-xs font-medium hover:bg-neutral-800 transition cursor-pointer"
            >
              Learn About M-PARTNER
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
