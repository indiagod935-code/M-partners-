import React, { useState } from 'react';
import { Code, Smartphone, ShieldCheck, CheckCircle2, ChevronRight, Copy } from 'lucide-react';

export const ApiDocsPage: React.FC = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(text);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const endpointGroups = [
    {
      group: 'Authentication & Session',
      description: 'Used by both Web and Mobile (Android / iOS) apps to authenticate users and fetch roles.',
      endpoints: [
        {
          method: 'POST',
          path: '/api/v1/auth/login',
          desc: 'Sign in with email/phone and password.',
          body: '{\n  "email": "aarav.sharma@gmail.com",\n  "password": "customer123",\n  "role": "customer"\n}',
          response: '{\n  "token": "usr_customer_1",\n  "user": { "id": "usr_customer_1", "role": "customer", "name": "Aarav Sharma" }\n}',
        },
        {
          method: 'POST',
          path: '/api/v1/auth/register/customer',
          desc: 'Register a new customer account with delivery address and locality.',
          body: '{\n  "name": "Aarav Sharma",\n  "phone": "+91 98765 22222",\n  "password": "securePassword",\n  "address": "Flat 402, Oakwood Heights",\n  "locality": "Indiranagar",\n  "serviceAreaId": "area_1"\n}',
          response: '{\n  "token": "usr_cust_123",\n  "user": { "id": "usr_cust_123", "role": "customer", "status": "active" }\n}',
        },
        {
          method: 'GET',
          path: '/api/v1/auth/me',
          desc: 'Fetch current authenticated user profile, wallet balance, active subscription, and assigned runner.',
          headers: 'Authorization: Bearer <token>\nx-user-id: <user_id>',
          response: '{\n  "user": {\n    "id": "usr_customer_1",\n    "name": "Aarav Sharma",\n    "walletBalance": 1450,\n    "activeSubscription": { "planName": "Starter", "creditsRemaining": 17 },\n    "assignedRunner": { "name": "Rohan Verma", "rating": 4.95 }\n  }\n}',
        },
      ],
    },
    {
      group: 'Customer & Orders',
      description: 'Endpoints for creating custom shopping requests, tracking status, and confirming price & delivery.',
      endpoints: [
        {
          method: 'GET',
          path: '/api/v1/customer/overview',
          desc: 'Customer portal overview with active alerts (low balance, low credits, price approval needed).',
          response: '{\n  "walletBalance": 1450,\n  "alerts": [],\n  "subscription": { "creditsRemaining": 17 },\n  "activeOrder": { "orderNumber": "MP-1004", "status": "shopping_in_progress" }\n}',
        },
        {
          method: 'POST',
          path: '/api/v1/customer/orders/create',
          desc: 'Place a custom multi-item order. Requires an active subscription with > 0 credits.',
          body: '{\n  "items": [\n    { "name": "Tata Salt", "quantity": 1, "unit": "kg" },\n    { "name": "Fortune Oil", "quantity": 1, "unit": "litre" }\n  ],\n  "deliveryAddress": "Flat 402, Oakwood Heights, Indiranagar",\n  "preferredDeliveryTime": "Today within 2 hours"\n}',
          response: '{\n  "message": "Order #MP-1004 placed successfully!",\n  "order": { "id": "ord_1004", "deliveryOtp": "4829", "status": "runner_assigned" }\n}',
        },
        {
          method: 'POST',
          path: '/api/v1/customer/orders/:id/confirm-price',
          desc: 'Customer approves or rejects store prices submitted by Runner.',
          body: '{\n  "approved": true\n}',
          response: '{\n  "message": "Price confirmed! Runner is proceeding to purchase.",\n  "order": { "status": "price_confirmed" }\n}',
        },
        {
          method: 'POST',
          path: '/api/v1/customer/orders/:id/confirm-delivery',
          desc: 'Customer confirms delivery receipt. Atomically consumes 1 credit from subscription ledger and completes order.',
          body: '{}',
          response: '{\n  "message": "Delivery confirmed! Thank you for using M-PARTNER.",\n  "order": { "status": "completed", "creditDeducted": true }\n}',
        },
      ],
    },
    {
      group: 'Wallet & Ledger (Admin-Assisted)',
      description: 'Customer wallet management for store merchandise expenses.',
      endpoints: [
        {
          method: 'GET',
          path: '/api/v1/customer/wallet',
          desc: 'Get available wallet balance and verified transaction ledger history.',
          response: '{\n  "wallet": { "balance": 1450 },\n  "ledger": [\n    { "type": "credit", "amount": 2000, "status": "approved" },\n    { "type": "debit", "amount": 230, "orderId": "MP-1001" }\n  ]\n}',
        },
        {
          method: 'POST',
          path: '/api/v1/customer/wallet/recharge',
          desc: 'Submit a wallet recharge request after transferring funds to Admin UPI ID.',
          body: '{\n  "amount": 1000,\n  "paymentReference": "UPI-TXN-88992211",\n  "paymentMethod": "UPI / GPay"\n}',
          response: '{\n  "message": "Recharge request submitted successfully. Admin will verify receipt and credit your wallet.",\n  "request": { "status": "pending" }\n}',
        },
      ],
    },
    {
      group: 'Runner Operations',
      description: 'Endpoints used by local Runners to manage deliveries, pricing, purchase receipts, and OTP verification.',
      endpoints: [
        {
          method: 'POST',
          path: '/api/v1/runner/orders/:id/accept',
          desc: 'Runner accepts assigned incoming order.',
          response: '{\n  "message": "Order accepted!",\n  "order": { "status": "order_accepted" }\n}',
        },
        {
          method: 'POST',
          path: '/api/v1/runner/orders/:id/update-price',
          desc: 'Runner submits store prices for customer approval.',
          body: '{\n  "items": [{ "id": "itm_1", "confirmedPrice": 28, "isAvailable": true }],\n  "shopName": "Sri Venkateshwara Stores"\n}',
          response: '{\n  "order": { "status": "price_confirmation_pending", "totalActualPrice": 393 }\n}',
        },
        {
          method: 'POST',
          path: '/api/v1/runner/orders/:id/record-purchase',
          desc: 'Record purchase with actual store bill, payment method, and receipt photo.',
          body: '{\n  "actualAmount": 393,\n  "shopName": "Sri Venkateshwara Stores",\n  "shopPaymentMethod": "UPI to Shop QR",\n  "purchaseReceiptUrl": "https://..."\n}',
          response: '{\n  "order": { "status": "purchase_recorded" }\n}',
        },
        {
          method: 'POST',
          path: '/api/v1/runner/orders/:id/complete-with-otp',
          desc: 'Verify customer 4-digit Delivery OTP to atomically finalize completion and deduct 1 credit.',
          body: '{\n  "otp": "4829"\n}',
          response: '{\n  "message": "Order #MP-1004 successfully completed and verified!",\n  "order": { "status": "completed" }\n}',
        },
      ],
    },
    {
      group: 'Customer-Runner Chat & Moderation',
      description: 'Private order-authorized messaging with pre-send text moderation, QR sharing, and reporting.',
      endpoints: [
        {
          method: 'GET',
          path: '/api/v1/chat/messages/:orderId',
          desc: 'Fetch private message thread for an order. Restricted to order customer, runner, or admin.',
          response: '{\n  "messages": [\n    { "senderName": "Rohan Verma", "text": "I am at the store now", "createdAt": "..." }\n  ]\n}',
        },
        {
          method: 'POST',
          path: '/api/v1/chat/send',
          desc: 'Send a message or attachment (QR code image / receipt). Moderated against abusive/explicit words.',
          body: '{\n  "orderId": "ord_live_1004",\n  "text": "Please check if they have sunflower oil in 1L pouch.",\n  "attachmentType": "image"\n}',
          response: '{\n  "message": { "id": "msg_123", "text": "..." }\n}',
        },
        {
          method: 'POST',
          path: '/api/v1/chat/report',
          desc: 'Report inappropriate message to Admin moderation queue.',
          body: '{\n  "messageId": "msg_123",\n  "reason": "Harassment or inappropriate language"\n}',
          response: '{\n  "message": "Thank you for reporting. Our moderation team has been notified."\n}',
        },
      ],
    },
  ];

  return (
    <div className="bg-white text-neutral-900 py-12 md:py-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold uppercase tracking-wider">
            <span>Powered by Mãrçò 💯</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            API Documentation for Mobile Apps (iOS & Android)
          </h1>
          <p className="text-sm text-neutral-600 max-w-3xl leading-relaxed">
            The M-PARTNER backend is architected with complete separation of concerns under <code className="text-black bg-neutral-100 px-1.5 py-0.5 rounded font-mono font-bold">/api/v1/</code>. 
            Native iOS and Android mobile apps can consume these exact endpoints directly without rebuilding the business engine, database, or ledgers.
          </p>
        </div>

        {/* Mobile App Architecture Callout */}
        <div className="p-6 rounded-3xl bg-neutral-950 text-white space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-bold">Mobile Client Integration Standard</h3>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            All mobile requests authenticate using standard HTTP Authorization headers:
          </p>
          <div className="bg-neutral-900 p-3 rounded-xl font-mono text-xs text-neutral-300 border border-neutral-800">
            Authorization: Bearer &lt;user_token&gt;<br />
            Content-Type: application/json<br />
            x-user-id: &lt;user_id&gt;
          </div>
        </div>

        {/* Endpoints Groups */}
        <div className="space-y-10">
          {endpointGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-4">
              <div className="border-b border-neutral-200 pb-2">
                <h3 className="text-lg font-bold text-black">{group.group}</h3>
                <p className="text-xs text-neutral-500">{group.description}</p>
              </div>

              <div className="space-y-4">
                {group.endpoints.map((ep, eIdx) => (
                  <div key={eIdx} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase ${
                          ep.method === 'GET' ? 'bg-blue-100 text-blue-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {ep.method}
                        </span>
                        <code className="text-xs font-mono font-bold text-black">{ep.path}</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(ep.path)}
                        className="text-[11px] text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedEndpoint === ep.path ? 'Copied!' : 'Copy Path'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-neutral-600">{ep.desc}</p>

                    {ep.body && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Request Body:</span>
                        <pre className="p-3 rounded-xl bg-white border border-neutral-200 text-[11px] font-mono overflow-x-auto text-neutral-800">
                          {ep.body}
                        </pre>
                      </div>
                    )}

                    {ep.response && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Response (200 OK):</span>
                        <pre className="p-3 rounded-xl bg-white border border-neutral-200 text-[11px] font-mono overflow-x-auto text-neutral-800">
                          {ep.response}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
