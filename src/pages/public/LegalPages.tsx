import React, { useState } from 'react';
import { AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

interface LegalPagesProps {
  initialDoc?: string;
  onClose?: () => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({ initialDoc = 'terms', onClose }) => {
  const [activeDoc, setActiveDoc] = useState(initialDoc);

  const docs = [
    { id: 'terms', title: 'Terms and Conditions' },
    { id: 'privacy', title: 'Privacy Policy' },
    { id: 'subscription', title: 'Subscription & Expiry Policy' },
    { id: 'wallet', title: 'Wallet & Payment Policy' },
    { id: 'cancellation', title: 'Cancellation & Refund Policy' },
    { id: 'code-of-conduct', title: 'Runner Code of Conduct' },
    { id: 'community', title: 'Community Guidelines' },
  ];

  return (
    <div className="bg-white text-neutral-900 py-12 md:py-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Review Notice Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Legal Review Notice:</strong> The documents below are operational template guidelines for the M-PARTNER platform (Powered by Mãrçò 💯). Legal counsel and compliance review are recommended prior to official public jurisdiction launches.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="md:col-span-1 space-y-1">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-3 mb-3">Policy Documents</h3>
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeDoc === doc.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {doc.title}
              </button>
            ))}
          </div>

          {/* Document Content */}
          <div className="md:col-span-3 bg-neutral-50 p-6 sm:p-10 rounded-3xl border border-neutral-200">
            {activeDoc === 'terms' && (
              <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
                <h2 className="text-xl font-bold text-black mb-2">Terms and Conditions</h2>
                <p className="text-neutral-500 text-[11px]">Last Updated: November 2026 • Platform: M-PARTNER • Powered by Mãrçò 💯</p>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">1. Acceptance of Terms</h4>
                <p>By accessing M-PARTNER, creating an account as a Customer or registering as a Runner, you agree to abide by these Terms and Conditions. M-PARTNER acts as an intermediary shopping assistance facilitator connecting users with designated local Runners.</p>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">2. Designated Runner Model</h4>
                <p>Each Customer is designated a single local Runner per service area. Orders are transmitted solely to your designated Runner unless the administrator assigns a substitute.</p>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">3. Distinction of Charges</h4>
                <p>Subscription fees provide an order-service allowance and do NOT include retail merchandise costs. Merchandise purchased by Runners is billed separately via the Customer Wallet.</p>
              </div>
            )}

            {activeDoc === 'privacy' && (
              <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
                <h2 className="text-xl font-bold text-black mb-2">Privacy Policy</h2>
                <p className="text-neutral-500 text-[11px]">Platform: M-PARTNER • Powered by Mãrçò 💯</p>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">1. Information We Collect</h4>
                <p>We collect essential delivery parameters including your full name, contact mobile number, delivery address, locality, landmark, and language preference. We do not sell or monetize personal customer details.</p>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">2. Access Control</h4>
                <p>Your address and delivery contact details are shared exclusively with your designated Runner for active fulfillment purposes.</p>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">3. Payment & Receipts</h4>
                <p>Receipt photos and transaction references submitted for wallet recharges or purchases are stored securely for ledger auditing and dispute resolution.</p>
              </div>
            )}

            {activeDoc === 'subscription' && (
              <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
                <h2 className="text-xl font-bold text-black mb-2">Subscription and Expiry Policy</h2>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">1. Monthly Validity</h4>
                <p>All subscription plans (Starter, Standard, Plus, Premium, Pro) are strictly valid for 30 calendar days from the moment of administrative activation.</p>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">2. Credit Consumption Rules</h4>
                <p>Placing an order, runner acceptance, or shopping in progress does NOT consume credits. Exactly 1 credit is consumed upon verified delivery completion. Unused credits expire after 30 days and do not carry forward.</p>
              </div>
            )}

            {activeDoc === 'wallet' && (
              <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
                <h2 className="text-xl font-bold text-black mb-2">Wallet and Payment Policy</h2>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">1. Purpose of Customer Wallet</h4>
                <p>The wallet balance is strictly dedicated to paying store merchandise expenses. It is separate from subscription delivery credits.</p>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">2. Recharge Verification</h4>
                <p>Recharges are recorded as pending until central administration verifies receipt in the bank/UPI statement. No balance is created without authorized verification.</p>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">3. Debit Authorization</h4>
                <p>Runners enter verified merchant bills. Only verified amounts are debited against completed purchases. Duplicate debits for the same purchase are strictly prohibited.</p>
              </div>
            )}

            {activeDoc === 'cancellation' && (
              <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
                <h2 className="text-xl font-bold text-black mb-2">Cancellation and Refund Policy</h2>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">1. Order Cancellations</h4>
                <p>Customers may cancel an order prior to the Runner initiating merchant shopping or purchase. Once purchases have been recorded at a shop, cancellation requires direct support intervention.</p>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">2. Refunds</h4>
                <p>Disputed charges, over-billings, or cancelled eligible orders are refunded back into the customer wallet by administration with an immutable audit entry.</p>
              </div>
            )}

            {activeDoc === 'code-of-conduct' && (
              <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
                <h2 className="text-xl font-bold text-black mb-2">Runner Code of Conduct</h2>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">1. Integrity & Accurate Billing</h4>
                <p>Runners must provide genuine merchant receipts, report exact MRP prices, and check product expiry dates before checkout. Inflating prices or reporting counterfeit receipts will result in immediate suspension.</p>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">2. Professional Customer Interaction</h4>
                <p>Runners must treat customers with courtesy, respect privacy at residential premises, and follow the OTP delivery completion protocol.</p>
              </div>
            )}

            {activeDoc === 'community' && (
              <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
                <h2 className="text-xl font-bold text-black mb-2">Community Guidelines</h2>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">1. Mutual Respect</h4>
                <p>M-PARTNER is built on community trust between local residents and neighborhood Runners. Harassment, abusive language in chat, or unreasonable demands are strictly prohibited.</p>
                <h4 className="font-bold text-neutral-900 text-sm mt-4">2. Prohibited Goods</h4>
                <p>Runners cannot be asked to purchase illegal substances, hazardous materials, or contraband items under local law.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
