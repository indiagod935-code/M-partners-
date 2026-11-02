import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Order, 
  OrderItem, 
  WalletLedgerEntry, 
  SubscriptionLedgerEntry, 
  SubscriptionPlan, 
  UserSubscription,
  ChatMessage,
  SupportTicket
} from '../../types';
import { 
  ShoppingBag, 
  Wallet, 
  Award, 
  Clock, 
  User as UserIcon, 
  MessageSquare, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Bike, 
  Receipt, 
  Trash2, 
  Send, 
  Key, 
  Phone,
  ArrowUpRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user, token, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'new-order' | 'orders' | 'wallet' | 'subscription' | 'chat' | 'support'>('overview');

  // Data states
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [walletData, setWalletData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Modals & Action Forms
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(1000);
  const [rechargeRef, setRechargeRef] = useState('');
  const [rechargeMethod, setRechargeMethod] = useState('UPI / GPay / PhonePe');
  const [subscribingPlan, setSubscribingPlan] = useState<SubscriptionPlan | null>(null);
  const [subPaymentRef, setSubPaymentRef] = useState('');

  // New Order Form state
  const [newOrderItems, setNewOrderItems] = useState<Array<{ name: string; quantity: number; unit: string; brandPreference: string; notes: string }>>([
    { name: '', quantity: 1, unit: 'kg', brandPreference: '', notes: '' },
  ]);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('Today within 2 hours');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Support Form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'general' | 'order' | 'wallet' | 'subscription' | 'complaint'>('general');
  const [ticketMessage, setTicketMessage] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-user-id': token || '',
  };

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/customer/overview', { headers });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/customer/orders', { headers });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        if (!selectedOrder && data.orders.length > 0) {
          setSelectedOrder(data.orders[0]);
        } else if (selectedOrder) {
          const updated = data.orders.find((o: Order) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, selectedOrder]);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/customer/wallet', { headers });
      if (res.ok) {
        const data = await res.json();
        setWalletData(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/customer/subscription', { headers });
      if (res.ok) {
        const data = await res.json();
        setSubscriptionData(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchChat = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/v1/chat/messages/${orderId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchSupport = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/customer/support', { headers });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOverview(), fetchOrders(), fetchWallet(), fetchSubscription(), fetchSupport()])
      .finally(() => setLoading(false));
  }, [fetchOverview, fetchOrders, fetchWallet, fetchSubscription, fetchSupport]);

  useEffect(() => {
    if (selectedOrder) {
      fetchChat(selectedOrder.id);
    }
  }, [selectedOrder, fetchChat]);

  // Order item helpers
  const addItemRow = () => {
    setNewOrderItems([...newOrderItems, { name: '', quantity: 1, unit: 'kg', brandPreference: '', notes: '' }]);
  };

  const removeItemRow = (index: number) => {
    if (newOrderItems.length > 1) {
      setNewOrderItems(newOrderItems.filter((_, i) => i !== index));
    }
  };

  const updateItemRow = (index: number, field: string, val: any) => {
    const updated = [...newOrderItems];
    updated[index] = { ...updated[index], [field]: val };
    setNewOrderItems(updated);
  };

  // Submit new order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);

    const validItems = newOrderItems.filter(i => i.name.trim() !== '');
    if (validItems.length === 0) {
      setActionMessage({ type: 'error', text: 'Please add at least one item name.' });
      return;
    }

    setOrderSubmitting(true);
    try {
      const res = await fetch('/api/v1/customer/orders/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: validItems,
          deliveryAddress,
          notes: deliveryNotes,
          preferredDeliveryTime: deliveryTime,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setNewOrderItems([{ name: '', quantity: 1, unit: 'kg', brandPreference: '', notes: '' }]);
        await fetchOrders();
        await fetchOverview();
        await refreshUser();
        setSelectedOrder(data.order);
        setActiveTab('orders');
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to place order' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Confirm / Reject proposed price
  const handlePriceDecision = async (orderId: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/v1/customer/orders/${orderId}/confirm-price`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ approved }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchOrders();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Confirm delivery receipt
  const handleConfirmDelivery = async (orderId: string) => {
    try {
      const res = await fetch(`/api/v1/customer/orders/${orderId}/confirm-delivery`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchOrders();
        await fetchOverview();
        await fetchWallet();
        await fetchSubscription();
        await refreshUser();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Request Wallet Recharge
  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/customer/wallet/recharge', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: rechargeAmount,
          paymentReference: rechargeRef,
          paymentMethod: rechargeMethod,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setRechargeModalOpen(false);
        setRechargeRef('');
        await fetchWallet();
        await fetchOverview();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Purchase subscription
  const handleSubscriptionPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribingPlan) return;

    try {
      const res = await fetch('/api/v1/customer/subscription/purchase', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          planId: subscribingPlan.id,
          paymentReference: subPaymentRef,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setSubscribingPlan(null);
        setSubPaymentRef('');
        await fetchSubscription();
        await fetchOverview();
        await refreshUser();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Send Chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedOrder) return;

    try {
      const res = await fetch('/api/v1/chat/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: selectedOrder.id,
          text: chatInput.trim(),
        }),
      });
      if (res.ok) {
        setChatInput('');
        fetchChat(selectedOrder.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Support Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/customer/support', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: ticketCategory,
          subject: ticketSubject,
          message: ticketMessage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setTicketSubject('');
        setTicketMessage('');
        fetchSupport();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      order_placed: { label: 'Order Placed', color: 'text-neutral-700 bg-neutral-100' },
      runner_assigned: { label: 'Runner Assigned', color: 'text-neutral-900 bg-neutral-200' },
      order_accepted: { label: 'Runner Accepted', color: 'text-blue-800 bg-blue-50' },
      price_confirmation_pending: { label: 'Price Approval Required', color: 'text-amber-800 bg-amber-50 font-bold' },
      price_confirmed: { label: 'Price Confirmed', color: 'text-emerald-800 bg-emerald-50' },
      shopping_in_progress: { label: 'Runner Shopping', color: 'text-indigo-800 bg-indigo-50' },
      purchase_recorded: { label: 'Purchased at Shop', color: 'text-purple-800 bg-purple-50' },
      out_for_delivery: { label: 'Out for Delivery', color: 'text-sky-800 bg-sky-50' },
      delivered_pending_completion: { label: 'Arrived at Doorstep', color: 'text-emerald-900 bg-emerald-100 font-bold' },
      completed: { label: 'Delivered & Completed', color: 'text-emerald-800 bg-emerald-50' },
      cancelled: { label: 'Cancelled', color: 'text-rose-800 bg-rose-50' },
      rejected: { label: 'Rejected by Runner', color: 'text-rose-800 bg-rose-50' },
    };

    const s = map[status] || { label: status, color: 'text-neutral-700 bg-neutral-100' };
    return (
      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${s.color}`}>
        {s.label}
      </span>
    );
  };

  const activeSub = overview?.subscription || user?.activeSubscription;

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Customer Top Bar */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-xl">
              {user?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-black">{user?.name}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  Customer
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {user?.locality || 'Indiranagar'}, Bengaluru • Member of <strong className="text-neutral-800">M-PARTNER</strong> (Powered by Mãrçò 💯)
              </p>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Wallet Balance Card */}
            <div className="bg-neutral-50 px-4 py-2.5 rounded-2xl border border-neutral-200 text-left">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Product Wallet</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-black">
                  ₹{overview?.walletBalance ?? user?.walletBalance ?? 0}
                </span>
                <button
                  onClick={() => setRechargeModalOpen(true)}
                  className="px-2 py-0.5 rounded-lg bg-black text-white text-[10px] font-bold hover:bg-neutral-800 transition cursor-pointer"
                >
                  + Recharge
                </button>
              </div>
            </div>

            {/* Subscription Credits Card */}
            <div className="bg-neutral-50 px-4 py-2.5 rounded-2xl border border-neutral-200 text-left">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Order Credits</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-black">
                  {activeSub ? `${activeSub.creditsRemaining} / ${activeSub.creditsTotal}` : '0 active'}
                </span>
                <button
                  onClick={() => setActiveTab('subscription')}
                  className="px-2 py-0.5 rounded-lg bg-neutral-200 text-black text-[10px] font-bold hover:bg-neutral-300 transition cursor-pointer"
                >
                  {activeSub ? 'Plan Info' : 'Subscribe'}
                </button>
              </div>
            </div>

            {/* Designated Runner Card */}
            <div className="bg-neutral-50 px-4 py-2.5 rounded-2xl border border-neutral-200 text-left flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                <Bike className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Assigned Runner</p>
                <p className="text-xs font-bold text-black leading-tight">
                  {overview?.assignedRunner?.name || 'Rohan Verma'}
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold">Active in Zone</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prominent High-Priority Alerts */}
        {overview?.alerts && overview.alerts.length > 0 && (
          <div className="space-y-2">
            {overview.alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 border shadow-xs ${
                  alert.type === 'warning'
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-blue-50 text-blue-900 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
                  <div>
                    <strong className="font-bold">{alert.title}: </strong>
                    <span>{alert.message}</span>
                  </div>
                </div>
                {alert.actionTab && (
                  <button
                    onClick={() => setActiveTab(alert.actionTab)}
                    className="px-3 py-1 bg-black text-white rounded-lg font-bold text-[11px] whitespace-nowrap hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Resolve →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action / Alert Feedback */}
        {actionMessage && (
          <div className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2 border ${
            actionMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-xs font-bold underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Portal Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-2">
          {[
            { id: 'overview', label: 'Overview & Active Orders' },
            { id: 'new-order', label: '+ Place New Order' },
            { id: 'orders', label: 'All Orders' },
            { id: 'wallet', label: 'My Wallet & Receipts' },
            { id: 'subscription', label: 'Subscription & Credits' },
            { id: 'chat', label: 'Runner Chat' },
            { id: 'support', label: 'Help & Tickets' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Live Order Tracker */}
            <div className="lg:col-span-2 space-y-6">
              {overview?.activeOrder ? (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-4">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Live Order</span>
                      <h3 className="text-xl font-extrabold text-black">Order #{overview.activeOrder.orderNumber}</h3>
                    </div>
                    {getStatusBadge(overview.activeOrder.status)}
                  </div>

                  {/* Delivery OTP Notice (Critical Security) */}
                  <div className="bg-neutral-900 text-white p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-400">Doorstep Delivery OTP</p>
                      <p className="text-2xl font-mono font-bold tracking-widest text-emerald-400">
                        {overview.activeOrder.deliveryOtp || '4829'}
                      </p>
                      <p className="text-[10px] text-neutral-400">Share this code with your Runner only upon receiving items.</p>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => handleConfirmDelivery(overview.activeOrder.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Confirm Delivery Received
                      </button>
                    </div>
                  </div>

                  {/* Price Approval Pending Banner */}
                  {overview.activeOrder.status === 'price_confirmation_pending' && (
                    <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <span>Price Confirmation Requested by Runner</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Your Runner {overview.activeOrder.runnerName || 'Rohan'} has checked local store prices at <strong>{overview.activeOrder.shopName || 'Local Store'}</strong>. Total bill: <strong>₹{overview.activeOrder.totalActualPrice || overview.activeOrder.totalEstimatedPrice}</strong>.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePriceDecision(overview.activeOrder.id, true)}
                          className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                        >
                          Approve Bill & Continue
                        </button>
                        <button
                          onClick={() => handlePriceDecision(overview.activeOrder.id, false)}
                          className="px-4 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
                        >
                          Reject / Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Order Items ({overview.activeOrder.items?.length})</h4>
                    <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden">
                      {overview.activeOrder.items?.map((item: OrderItem) => (
                        <div key={item.id} className="p-3.5 flex items-center justify-between text-xs bg-white">
                          <div>
                            <span className="font-bold text-neutral-900">{item.name}</span>
                            <span className="text-neutral-500 ml-2">({item.quantity} {item.unit})</span>
                            {item.brandPreference && <span className="text-[10px] text-neutral-400 block">Brand: {item.brandPreference}</span>}
                          </div>
                          <div className="text-right">
                            {item.confirmedPrice ? (
                              <span className="font-bold text-neutral-900">₹{item.confirmedPrice}</span>
                            ) : (
                              <span className="text-neutral-400">Verifying at shop</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => { setSelectedOrder(overview.activeOrder); setActiveTab('chat'); }}
                      className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat with Runner</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-12 rounded-3xl border border-neutral-200 text-center space-y-4">
                  <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto text-neutral-500">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-black">No Active Orders</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    You don't have an order in progress right now. Place your shopping list to send it to your assigned Runner.
                  </p>
                  <div>
                    <button
                      onClick={() => setActiveTab('new-order')}
                      className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
                    >
                      + Place a New Order
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Designated Runner & Quick Account Summary */}
            <div className="space-y-6">
              {/* Runner Info Box */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Your Designated Runner</h4>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-lg">
                    {overview?.assignedRunner?.name?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-black">{overview?.assignedRunner?.name || 'Rohan Verma'}</h5>
                    <p className="text-[11px] text-neutral-500">Zone: Indiranagar Hub</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">Rating: ★ 4.95 (Verified Partner)</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 text-xs space-y-2">
                  <div className="flex justify-between text-neutral-600">
                    <span>Contact Phone:</span>
                    <strong className="text-neutral-900">{overview?.assignedRunner?.phone || '+91 98765 11111'}</strong>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Vehicle:</span>
                    <span className="text-neutral-900">{overview?.assignedRunner?.vehicleType || 'Two Wheeler'}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('chat')}
                  className="w-full py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Direct Message Runner</span>
                </button>
              </div>

              {/* Subscription Status Card */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Subscription Status</h4>
                {activeSub ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-black">{activeSub.planName} Plan</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[10px]">Active</span>
                    </div>
                    
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-black h-full" 
                        style={{ width: `${(activeSub.creditsRemaining / activeSub.creditsTotal) * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-neutral-600 text-[11px]">
                      <span>{activeSub.creditsRemaining} credits left</span>
                      <span>Expires: {new Date(activeSub.expiresAt).toLocaleDateString()}</span>
                    </div>

                    <button
                      onClick={() => setActiveTab('subscription')}
                      className="w-full py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-semibold text-xs transition cursor-pointer"
                    >
                      Renew / Upgrade Plan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <p className="text-neutral-500">No active delivery plan. An active subscription is required to request shopping deliveries.</p>
                    <button
                      onClick={() => setActiveTab('subscription')}
                      className="w-full py-2.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-neutral-800 cursor-pointer"
                    >
                      View Plans (From ₹200)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: New Order Form */}
        {activeTab === 'new-order' && (
          <div className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Assisted Shopping</span>
              <h2 className="text-2xl font-bold text-black">Create Custom Shopping Request</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Enter your desired products. Your designated Runner will verify stock and prices at nearby stores.
              </p>
            </div>

            {/* Check Subscription Notice */}
            {(!activeSub || activeSub.creditsRemaining <= 0) && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Subscription Required
                </p>
                <p>
                  You currently have {activeSub?.creditsRemaining || 0} delivery credits. An active subscription plan is required to place delivery orders.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('subscription')}
                  className="mt-2 px-3 py-1 bg-amber-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Subscribe to a Plan
                </button>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-6 text-xs">
              {/* Dynamic Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-neutral-900 text-sm">Shopping List Items</h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {newOrderItems.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-600 text-[11px]">Item #{idx + 1}</span>
                        {newOrderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-neutral-400 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Product Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Tata Salt, Bananas, Cooking Oil, Paracetamol"
                            value={item.name}
                            onChange={(e) => updateItemRow(idx, 'name', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Qty *</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Unit</label>
                            <select
                              value={item.unit}
                              onChange={(e) => updateItemRow(idx, 'unit', e.target.value)}
                              className="w-full px-2 py-2 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                            >
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="litre">litre</option>
                              <option value="ml">ml</option>
                              <option value="pieces">pieces</option>
                              <option value="packets">packets</option>
                              <option value="strip">strip</option>
                              <option value="box">box</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Brand Preference</label>
                          <input
                            type="text"
                            placeholder="e.g. Fortune, Aashirvaad, Amul, Any brand"
                            value={item.brandPreference}
                            onChange={(e) => updateItemRow(idx, 'brandPreference', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Specific Instructions</label>
                          <input
                            type="text"
                            placeholder="e.g. Medium ripe, check expiry date"
                            value={item.notes}
                            onChange={(e) => updateItemRow(idx, 'notes', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <h4 className="font-bold text-neutral-900 text-sm">Delivery Location & Schedule</h4>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Delivery Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Preferred Time Window</label>
                    <select
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    >
                      <option value="Today within 2 hours">Today within 2 hours</option>
                      <option value="Today Evening (5 PM - 8 PM)">Today Evening (5 PM - 8 PM)</option>
                      <option value="Tomorrow Morning (8 AM - 11 AM)">Tomorrow Morning (8 AM - 11 AM)</option>
                      <option value="Tomorrow Afternoon (12 PM - 3 PM)">Tomorrow Afternoon (12 PM - 3 PM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Notes for Runner</label>
                    <input
                      type="text"
                      placeholder="e.g. Ring bell twice, leave with security if unreachable"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="w-full py-3.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-neutral-800 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{orderSubmitting ? 'Submitting Order...' : 'Submit Order to Designated Runner'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: All Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-black">Order History</h3>
                <p className="text-xs text-neutral-500">Track current and past deliveries fulfilled by your designated Runner.</p>
              </div>
              <button
                onClick={() => setActiveTab('new-order')}
                className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
              >
                + Place Order
              </button>
            </div>

            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden">
              {orders.map((ord) => (
                <div key={ord.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-sm text-black">#{ord.orderNumber}</span>
                      {getStatusBadge(ord.status)}
                    </div>
                    <p className="text-xs text-neutral-600">
                      Items: {ord.items.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Placed on {new Date(ord.createdAt).toLocaleString()} • Delivery OTP: <strong className="text-neutral-900 font-mono">{ord.deliveryOtp}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-neutral-400">Total Billed</p>
                      <p className="font-extrabold text-sm text-neutral-900">
                        {ord.totalActualPrice ? `₹${ord.totalActualPrice}` : 'Verifying at store'}
                      </p>
                    </div>

                    <button
                      onClick={() => { setSelectedOrder(ord); setActiveTab('chat'); }}
                      className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>

                    {ord.status === 'delivered_pending_completion' && (
                      <button
                        onClick={() => handleConfirmDelivery(ord.id)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Confirm Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {orders.length === 0 && (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No orders placed yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Wallet & Ledger */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            {/* Wallet Header Card */}
            <div className="bg-neutral-950 text-white p-6 sm:p-8 rounded-3xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Customer Shopping Wallet</span>
                  <div className="text-4xl font-extrabold text-white mt-1">
                    ₹{walletData?.wallet?.balance ?? 0}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Dedicated exclusively to paying merchant store bills for ordered goods.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setRechargeModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-100 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Request Recharge</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-neutral-400 text-[10px] uppercase font-bold">Admin UPI ID</p>
                  <p className="font-mono text-white font-semibold">{walletData?.upiId || 'mpartner.marcohun@icici'}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-[10px] uppercase font-bold">Admin Verification</p>
                  <p className="text-emerald-400 font-semibold">Protected Ledger</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-[10px] uppercase font-bold">Debit Authorization</p>
                  <p className="text-neutral-300">Requires Store Bill</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-[10px] uppercase font-bold">Helpline</p>
                  <p className="text-neutral-300">{walletData?.supportPhone || '+91 80 4920 8000'}</p>
                </div>
              </div>
            </div>

            {/* Wallet Ledger Entries */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-black">Verified Transaction Ledger</h3>
              <p className="text-xs text-neutral-500">
                Every credit, debit, and refund is permanently recorded on the server.
              </p>

              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden">
                {walletData?.ledger?.map((entry: WalletLedgerEntry) => (
                  <div key={entry.id} className="p-4 flex items-center justify-between text-xs hover:bg-neutral-50 transition">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          entry.type === 'credit' ? 'bg-emerald-50 text-emerald-800' : entry.type === 'debit' ? 'bg-neutral-100 text-neutral-900' : 'bg-blue-50 text-blue-800'
                        }`}>
                          {entry.type}
                        </span>
                        <span className="font-bold text-neutral-900">{entry.notes}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        {new Date(entry.createdAt).toLocaleString()} • ID: {entry.id}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`font-extrabold text-sm ${
                        entry.type === 'credit' ? 'text-emerald-600' : 'text-neutral-900'
                      }`}>
                        {entry.type === 'credit' ? '+' : '-'}₹{entry.amount}
                      </span>
                    </div>
                  </div>
                ))}

                {(!walletData?.ledger || walletData.ledger.length === 0) && (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    No transactions recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Subscription & Credits */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Current Active Plan Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-black">Active Subscription & Delivery Credits</h3>
              
              {activeSub ? (
                <div className="p-6 rounded-2xl bg-neutral-900 text-white space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-neutral-400">Plan Enrolled</span>
                      <h4 className="text-2xl font-bold">{activeSub.planName}</h4>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                      Active (30 Days Validity)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-800 text-xs">
                    <div>
                      <p className="text-neutral-400 text-[10px] uppercase">Remaining Credits</p>
                      <p className="text-2xl font-extrabold text-emerald-400">{activeSub.creditsRemaining}</p>
                      <p className="text-[10px] text-neutral-400">of {activeSub.creditsTotal} issued</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 text-[10px] uppercase">Expiry Date</p>
                      <p className="font-bold text-white mt-1">{new Date(activeSub.expiresAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-neutral-400">Credits expire at end of cycle</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 text-[10px] uppercase">Order Allowance</p>
                      <p className="font-semibold text-neutral-300 mt-1">1 credit per delivery</p>
                      <p className="text-[10px] text-neutral-400">Products billed separately</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 text-center space-y-2">
                  <p className="font-bold text-black text-sm">No Active Subscription</p>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Subscribe to an allowance below to start placing orders with your designated Runner.
                  </p>
                </div>
              )}
            </div>

            {/* Plans Showcase */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-black">Choose a Plan (30 Days Validity)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {subscriptionData?.plans?.map((p: SubscriptionPlan) => (
                  <div key={p.id} className="p-5 rounded-2xl border border-neutral-200 hover:border-black transition space-y-3 bg-white flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-base text-black">{p.name}</h4>
                      <div className="text-2xl font-extrabold text-neutral-900 mt-1">₹{p.price}</div>
                      <p className="text-[11px] text-neutral-500 font-medium">{p.validityDays} Days Validity</p>
                      <div className="pt-2 text-xs font-bold text-emerald-700">
                        {p.credits} Delivery Credits
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1 leading-snug">{p.description}</p>
                    </div>
                    
                    <button
                      onClick={() => setSubscribingPlan(p)}
                      className="w-full py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
                    >
                      Subscribe
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Credit Ledger */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-black">Subscription Credit Ledger</h3>
              <p className="text-xs text-neutral-500">
                Log of credit issuance (+X on purchase) and consumption (-1 on completed delivery).
              </p>

              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden">
                {subscriptionData?.ledger?.map((entry: SubscriptionLedgerEntry) => (
                  <div key={entry.id} className="p-4 flex items-center justify-between text-xs hover:bg-neutral-50 transition">
                    <div>
                      <p className="font-bold text-neutral-900">{entry.reason}</p>
                      <p className="text-[11px] text-neutral-400">{new Date(entry.createdAt).toLocaleString()} • ID: {entry.id}</p>
                    </div>
                    <span className={`font-extrabold text-sm ${entry.changeAmount > 0 ? 'text-emerald-600' : 'text-neutral-900'}`}>
                      {entry.changeAmount > 0 ? `+${entry.changeAmount}` : entry.changeAmount} Credits
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Runner Chat */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 bg-neutral-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold text-sm">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {selectedOrder ? `Order #${selectedOrder.orderNumber} Chat` : 'Designated Runner Chat'}
                  </h4>
                  <p className="text-[10px] text-neutral-400">
                    Communicating with Runner: {overview?.assignedRunner?.name || 'Rohan Verma'}
                  </p>
                </div>
              </div>

              {selectedOrder && (
                <div className="text-right">
                  <span className="text-[10px] text-neutral-300 bg-neutral-800 px-2.5 py-1 rounded-full font-mono">
                    OTP: {selectedOrder.deliveryOtp}
                  </span>
                </div>
              )}
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/50">
              {chatMessages.map((msg) => {
                const isMe = msg.senderRole === 'customer';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs sm:max-w-md p-3.5 rounded-2xl text-xs space-y-1 shadow-xs ${
                      isMe ? 'bg-black text-white rounded-br-none' : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-none'
                    }`}>
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                        <span className="font-bold">{msg.senderName}</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              })}

              {chatMessages.length === 0 && (
                <div className="text-center py-16 text-xs text-neutral-400">
                  No messages yet. Send a note to your Runner regarding products or brand preferences.
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-neutral-200 flex gap-2">
              <input
                type="text"
                placeholder="Type a message to your Runner..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 7: Support & Tickets */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-black">Submit Support Ticket</h3>
              <p className="text-xs text-neutral-500">
                Direct inquiry to central administration.
              </p>

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e: any) => setTicketCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="general">General</option>
                    <option value="order">Order Issue</option>
                    <option value="wallet">Wallet Recharge / Debit Issue</option>
                    <option value="subscription">Subscription & Credit Issue</option>
                    <option value="complaint">Complaint</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief description"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Details</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Please explain in detail..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
                >
                  Submit Ticket
                </button>
              </form>
            </div>

            {/* Tickets list */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-black">My Tickets</h3>
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl border border-neutral-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900">{t.subject}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'resolved' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {t.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-neutral-600">{t.message}</p>
                    {t.adminNotes && (
                      <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800">
                        <strong className="block text-[10px] uppercase text-neutral-400">Admin Response:</strong>
                        <span>{t.adminNotes}</span>
                      </div>
                    )}
                  </div>
                ))}
                {tickets.length === 0 && (
                  <p className="text-xs text-neutral-400 text-center py-8">No tickets submitted.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: Request Wallet Recharge */}
      {rechargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-black">Request Wallet Recharge</h3>
              <button onClick={() => setRechargeModalOpen(false)} className="text-neutral-400 hover:text-black font-bold">
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2">
              <p className="font-bold text-neutral-900">Admin Payment Instructions:</p>
              <p className="text-neutral-600">
                1. Transfer funds using UPI to: <strong className="text-black font-mono">{walletData?.upiId || 'mpartner.marcohun@icici'}</strong>
              </p>
              <p className="text-neutral-600">
                2. Enter your amount and transaction reference number below.
              </p>
              <p className="text-[11px] text-neutral-500">
                Admin verifies receipt directly and credits your wallet atomically.
              </p>
            </div>

            <form onSubmit={handleRechargeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Recharge Amount (₹) *</label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  required
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Payment Method</label>
                <select
                  value={rechargeMethod}
                  onChange={(e) => setRechargeMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="UPI / GPay / PhonePe">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="IMPS / NEFT Bank Transfer">IMPS / NEFT Bank Transfer</option>
                  <option value="Cash at Operations Hub">Cash Handover at Central Hub</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">UPI / Bank Transaction Ref *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI-TXN-99882244"
                  value={rechargeRef}
                  onChange={(e) => setRechargeRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRechargeModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Subscribe to Plan */}
      {subscribingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-black">Subscribe: {subscribingPlan.name} Plan</h3>
                <p className="text-xs text-neutral-500">₹{subscribingPlan.price} • {subscribingPlan.credits} Delivery Credits</p>
              </div>
              <button onClick={() => setSubscribingPlan(null)} className="text-neutral-400 hover:text-black font-bold">
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2">
              <p className="font-bold text-neutral-900">Subscription Payment Instructions:</p>
              <p className="text-neutral-600">
                Transfer <strong>₹{subscribingPlan.price}</strong> to Admin UPI ID: <strong className="font-mono text-black">{walletData?.upiId || 'mpartner.marcohun@icici'}</strong>
              </p>
              <p className="text-[11px] text-neutral-500">
                Admin verifies receipt and activates {subscribingPlan.credits} order credits valid for 30 days.
              </p>
            </div>

            <form onSubmit={handleSubscriptionPurchase} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Transaction Reference / UTR *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI-SUB-776655"
                  value={subPaymentRef}
                  onChange={(e) => setSubPaymentRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSubscribingPlan(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
