import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FaqPageProps {
  setCurrentTab: (tab: string) => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ setCurrentTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is M-PARTNER?',
      a: 'M-PARTNER, powered by Mãrçò 💯, is a subscription-based shopping and delivery platform. We pair you with a designated local Runner who purchases items from neighbourhood merchants and delivers them straight to your doorstep.',
    },
    {
      q: 'How does the subscription work?',
      a: 'You choose a plan according to your monthly delivery needs (e.g. Starter gives 20 order credits for ₹200). Each credit covers one completed delivery. The subscription is valid for 30 days from activation.',
    },
    {
      q: 'What happens when my subscription expires?',
      a: 'Unused order credits expire at the end of the 30-day validity window and do not carry forward. You can simply renew or choose a different plan to continue requesting delivery orders.',
    },
    {
      q: 'Are product prices included in the subscription?',
      a: 'No. The subscription plan covers only the shopping assistance and delivery service allowance. The actual cost of products purchased from grocery stores or merchants is debited from your customer wallet based on real store bills.',
    },
    {
      q: 'How do I add money to my wallet?',
      a: 'Visit the "My Wallet" section in your Customer Portal, click "Request Recharge", and enter your desired amount. Send payment using the Admin UPI ID or bank transfer details provided, and submit the transaction reference. The administrator verifies the deposit and credits your wallet atomically.',
    },
    {
      q: 'Can I choose another Runner?',
      a: 'By default, M-PARTNER assigns one designated Runner per customer based on your locality to ensure personalized and trusted service. If your current Runner is unavailable or if you require a reassignment, our administration team can re-assign a new Runner for you.',
    },
    {
      q: 'How do I contact my Runner?',
      a: 'Once an order is placed or accepted, you can use the built-in Customer-Runner Chat directly from your portal. You can also view your assigned Runner\'s contact phone number on your dashboard.',
    },
    {
      q: 'How do I report a problem or dispute?',
      a: 'Navigate to the "Contact & Support" tab or use the "Submit Ticket" button in your dashboard. You can select categories including Order issues, Wallet recharges, Subscription credits, or General complaints. Our central support team reviews all tickets.',
    },
    {
      q: 'What happens if a requested product is unavailable?',
      a: 'When your Runner arrives at the merchant, they check stock. If an item is unavailable, the Runner will message you via chat with alternatives or mark the item as unavailable. You will have full visibility and must confirm the adjusted price before purchase.',
    },
    {
      q: 'How can I see my transaction history?',
      a: 'Your Customer Portal contains both a "Subscription Credit Ledger" (tracking credits received and order deductions) and a "Wallet Transaction Ledger" (tracking recharge deposits, product cost debits, and refunds). Every entry includes timestamps, reference IDs, and notes.',
    },
  ];

  const filteredFaqs = faqs.filter(
    f => f.q.toLowerCase().includes(searchTerm.toLowerCase()) || f.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white text-neutral-900 py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold uppercase tracking-wider">
            <span>Powered by Mãrçò 💯</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-black tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-base text-neutral-600 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about M-PARTNER subscriptions, wallets, order workflow, and runner assistance.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search questions (e.g. wallet, credits, runner)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>

        {/* FAQs List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-neutral-200 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-neutral-900 hover:bg-neutral-50 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-neutral-500 flex-shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3 bg-neutral-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-sm text-neutral-500">
              No matching questions found for "{searchTerm}". Please reach out via our Contact & Support page.
            </div>
          )}
        </div>

        {/* Still have questions */}
        <div className="bg-neutral-50 p-6 sm:p-8 rounded-3xl border border-neutral-200 text-center space-y-3">
          <h3 className="font-bold text-lg text-black">Still have a question?</h3>
          <p className="text-xs text-neutral-600 max-w-md mx-auto">
            Our support desk is happy to help you with order inquiries, payment verification, or runner assignments.
          </p>
          <div>
            <button
              onClick={() => setCurrentTab('contact')}
              className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer"
            >
              Contact Support Desk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
