import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { PlatformSettings } from '../../types';

interface ContactPageProps {
  setCurrentTab: (tab: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ setCurrentTab }) => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'general',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/public/info')
      .then(res => res.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(err => console.error('Error fetching settings:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setErrorMsg('Please provide your name, email, and message.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/public/contact-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Support request submitted successfully!');
        setForm({ name: '', email: '', phone: '', category: 'general', subject: '', message: '' });
      } else {
        setErrorMsg(data.error || 'Failed to submit request');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white text-neutral-900 py-12 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold uppercase tracking-wider">
            <span>Powered by Mãrçò 💯</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-black tracking-tight">
            Contact & Support Center
          </h1>
          <p className="text-base text-neutral-600 leading-relaxed">
            Have questions about your subscription, wallet recharges, runner assignments, or orders?
            Our operations team is available 7 days a week.
          </p>
        </div>

        {/* Contact Info & Support Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Contact Details Card */}
          <div className="space-y-6">
            <div className="bg-neutral-900 text-white p-6 sm:p-8 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold">Admin Helpdesk</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Connect directly with the M-PARTNER central administration team for urgent assistance, account verifications, or feedback.
              </p>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-neutral-400 text-[10px] uppercase font-bold">Helpline</p>
                    <p className="font-semibold text-white">{settings?.supportPhone || '+91 80 4920 8000'}</p>
                    <p className="text-[11px] text-neutral-400">8:00 AM – 9:00 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-neutral-400 text-[10px] uppercase font-bold">Email Support</p>
                    <p className="font-semibold text-white">{settings?.supportEmail || 'support@mpartner.marcohun.com'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-neutral-400 text-[10px] uppercase font-bold">Primary Hub</p>
                    <p className="text-neutral-200">Indiranagar 100 Feet Road, Bengaluru, Karnataka 560038</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 text-[11px] text-neutral-400">
                Official Parent Brand: <strong className="text-white">Mãrçò 💯</strong>
              </div>
            </div>

            {/* Quick Link Card */}
            <div className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-3 text-xs">
              <h4 className="font-bold text-black text-sm">Looking for FAQs?</h4>
              <p className="text-neutral-600">
                Answers to top questions regarding order credits, recharge timelines, and runner assignments.
              </p>
              <button
                onClick={() => setCurrentTab('faq')}
                className="font-bold text-black hover:underline cursor-pointer"
              >
                View FAQ Knowledge Base →
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs">
            <h3 className="text-xl font-bold text-black mb-1">Submit a Support Ticket or Inquiry</h3>
            <p className="text-xs text-neutral-500 mb-6">
              Our support team logs every inquiry in the administrative ticket queue.
            </p>

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. aarav@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Inquiry Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="order">Order-Related Issue</option>
                    <option value="wallet">Wallet Recharge / Debit Issue</option>
                    <option value="subscription">Subscription & Credit Inquiry</option>
                    <option value="complaint">Complaint / Dispute</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of your question"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Detailed Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your issue or feedback in detail..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-black text-white font-semibold text-xs hover:bg-neutral-800 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Send Message to Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
