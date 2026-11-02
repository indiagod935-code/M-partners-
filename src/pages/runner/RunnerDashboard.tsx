import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderItem, ChatMessage } from '../../types';
import { 
  Bike, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Phone, 
  DollarSign, 
  Store, 
  Receipt, 
  Send, 
  MessageSquare, 
  Check, 
  X,
  Key,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const RunnerDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'earnings' | 'chat'>('orders');

  const [overview, setOverview] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Modals / Action forms
  const [pricingModalOrder, setPricingModalOrder] = useState<Order | null>(null);
  const [pricingItems, setPricingItems] = useState<OrderItem[]>([]);
  const [shopName, setShopName] = useState('');

  const [purchaseModalOrder, setPurchaseModalOrder] = useState<Order | null>(null);
  const [actualPurchaseAmount, setActualPurchaseAmount] = useState<number>(0);
  const [purchaseShop, setPurchaseShop] = useState('');
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('UPI to Shop QR');
  const [receiptUrl, setReceiptUrl] = useState('');

  const [otpModalOrder, setOtpModalOrder] = useState<Order | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-user-id': token || '',
  };

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/runner/overview', { headers });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
        setIsAvailable(data.runner?.profile?.isAvailable ?? true);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/runner/orders', { headers });
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

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/runner/customers', { headers });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
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

  useEffect(() => {
    fetchOverview();
    fetchOrders();
    fetchCustomers();
  }, [fetchOverview, fetchOrders, fetchCustomers]);

  useEffect(() => {
    if (selectedOrder) {
      fetchChat(selectedOrder.id);
    }
  }, [selectedOrder, fetchChat]);

  // Toggle availability
  const toggleAvailability = async () => {
    try {
      const res = await fetch('/api/v1/runner/availability', {
        method: 'POST',
        headers,
        body: JSON.stringify({ isAvailable: !isAvailable }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAvailable(data.isAvailable);
        setActionMessage({ type: 'success', text: data.message });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Accept Order
  const handleAcceptOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/v1/runner/orders/${orderId}/accept`, { method: 'POST', headers });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchOrders();
        await fetchOverview();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Reject Order
  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt('Please enter reason for rejecting this order:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/v1/runner/orders/${orderId}/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
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

  // Start Shopping
  const handleStartShopping = async (orderId: string) => {
    try {
      const res = await fetch(`/api/v1/runner/orders/${orderId}/start-shopping`, { method: 'POST', headers });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Pricing Modal
  const openPricingModal = (ord: Order) => {
    setPricingModalOrder(ord);
    setPricingItems(ord.items.map(i => ({ ...i, confirmedPrice: i.confirmedPrice || i.unitPrice || 0 })));
    setShopName(ord.shopName || 'Sri Venkateshwara Provision Stores');
  };

  // Submit Verified Prices
  const handlePricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingModalOrder) return;

    try {
      const res = await fetch(`/api/v1/runner/orders/${pricingModalOrder.id}/update-price`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: pricingItems,
          shopName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setPricingModalOrder(null);
        await fetchOrders();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Open Purchase Modal
  const openPurchaseModal = (ord: Order) => {
    setPurchaseModalOrder(ord);
    setActualPurchaseAmount(ord.totalActualPrice || ord.totalEstimatedPrice || 0);
    setPurchaseShop(ord.shopName || 'Local Store');
    setReceiptUrl(ord.purchaseReceiptUrl || 'https://images.unsplash.com/photo-1554415707-9e49016e7887?w=600&auto=format&fit=crop&q=60');
  };

  // Record Purchase
  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseModalOrder) return;

    try {
      const res = await fetch(`/api/v1/runner/orders/${purchaseModalOrder.id}/record-purchase`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actualAmount: actualPurchaseAmount,
          shopName: purchaseShop,
          shopPaymentMethod: purchasePaymentMethod,
          purchaseReceiptUrl: receiptUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setPurchaseModalOrder(null);
        await fetchOrders();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Mark Out for Delivery
  const handleOutForDelivery = async (orderId: string) => {
    try {
      const res = await fetch(`/api/v1/runner/orders/${orderId}/out-for-delivery`, { method: 'POST', headers });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark Arrived / Request Completion
  const handleRequestCompletion = async (orderId: string) => {
    try {
      const res = await fetch(`/api/v1/runner/orders/${orderId}/request-completion`, { method: 'POST', headers });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Complete with Customer's OTP
  const handleCompleteWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModalOrder) return;

    try {
      const res = await fetch(`/api/v1/runner/orders/${otpModalOrder.id}/complete-with-otp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ otp: enteredOtp.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setOtpModalOrder(null);
        setEnteredOtp('');
        await fetchOrders();
        await fetchOverview();
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

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Runner Header */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-xl">
              <Bike className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-black">{user?.name || 'Rohan Verma'}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Authorized Runner
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Indiranagar Zone • Vehicle: {overview?.runner?.profile?.vehicleType || 'Electric Scooter'} • Rating: ★ {overview?.runner?.profile?.rating || '4.95'}
              </p>
            </div>
          </div>

          {/* Availability Toggle & Metrics */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 bg-neutral-50 px-4 py-2.5 rounded-2xl border border-neutral-200">
              <div className="text-left">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Availability Status</p>
                <p className={`text-xs font-bold ${isAvailable ? 'text-emerald-700' : 'text-neutral-500'}`}>
                  {isAvailable ? 'Active & Ready' : 'Offline'}
                </p>
              </div>
              <button
                onClick={toggleAvailability}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isAvailable ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-neutral-800 text-white hover:bg-neutral-900'
                }`}
              >
                {isAvailable ? 'Go Offline' : 'Go Online'}
              </button>
            </div>

            <div className="bg-neutral-50 px-4 py-2.5 rounded-2xl border border-neutral-200 text-left">
              <p className="text-[10px] font-bold text-neutral-400 uppercase">Assigned Customers</p>
              <p className="text-lg font-extrabold text-black">{overview?.assignedCustomersCount || 1}</p>
            </div>

            <div className="bg-neutral-50 px-4 py-2.5 rounded-2xl border border-neutral-200 text-left">
              <p className="text-[10px] font-bold text-neutral-400 uppercase">Completed Deliveries</p>
              <p className="text-lg font-extrabold text-black">{overview?.completedOrdersCount || 3}</p>
            </div>
          </div>
        </div>

        {/* Action / Alert Message */}
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

        {/* Sub-Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 pb-2">
          {[
            { id: 'orders', label: 'Assigned Orders & Workflow' },
            { id: 'customers', label: 'My Assigned Customers' },
            { id: 'earnings', label: 'Completed Deliveries' },
            { id: 'chat', label: 'Customer Messaging' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'bg-white text-neutral-600 hover:text-black border border-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Orders & State Machine Workflow */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-black">Active & Incoming Deliveries</h3>
                  <p className="text-xs text-neutral-500">
                    Follow the validated order lifecycle from local store shopping to verified doorstep OTP completion.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {orders.map((ord) => {
                  const isFinished = ['completed', 'cancelled', 'rejected'].includes(ord.status);
                  return (
                    <div 
                      key={ord.id} 
                      className={`p-6 rounded-3xl border transition space-y-5 ${
                        isFinished ? 'bg-neutral-50 border-neutral-200 opacity-75' : 'bg-white border-neutral-300 shadow-sm'
                      }`}
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-base font-extrabold text-black">Order #{ord.orderNumber}</span>
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-neutral-100 text-neutral-800 uppercase tracking-wide">
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{ord.deliveryAddress}</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-neutral-400">Customer: <strong className="text-neutral-900">{ord.customerName}</strong></p>
                          <p className="text-[11px] text-neutral-500">{ord.customerPhone}</p>
                        </div>
                      </div>

                      {/* Items to Purchase */}
                      <div>
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Requested Store Items:</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {ord.items.map((i) => (
                            <div key={i.id} className="p-3 rounded-xl border border-neutral-100 bg-neutral-50/50 text-xs">
                              <span className="font-bold text-neutral-900">{i.name}</span>
                              <div className="text-[11px] text-neutral-500 flex justify-between mt-1">
                                <span>Qty: {i.quantity} {i.unit}</span>
                                <span>{i.confirmedPrice ? `₹${i.confirmedPrice}` : 'Needs pricing'}</span>
                              </div>
                              {i.notes && <p className="text-[10px] text-neutral-400 mt-1 italic">Note: {i.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial info if recorded */}
                      {(ord.totalActualPrice || ord.shopName) && (
                        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-neutral-500">Store: </span>
                            <strong className="text-neutral-900">{ord.shopName || 'Local Shop'}</strong>
                            {ord.shopPaymentMethod && <span className="text-neutral-400 text-[11px]"> • Method: {ord.shopPaymentMethod}</span>}
                          </div>
                          <div>
                            <span className="text-neutral-500">Total Bill: </span>
                            <strong className="text-black font-extrabold text-sm">₹{ord.totalActualPrice || ord.totalEstimatedPrice}</strong>
                          </div>
                        </div>
                      )}

                      {/* Workflow Step Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
                        {/* 1. If assigned / placed -> Accept / Reject */}
                        {['order_placed', 'runner_assigned'].includes(ord.status) && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptOrder(ord.id)}
                              className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept Order</span>
                            </button>
                            <button
                              onClick={() => handleRejectOrder(ord.id)}
                              className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {/* 2. If accepted -> Start Shopping */}
                        {ord.status === 'order_accepted' && (
                          <button
                            onClick={() => handleStartShopping(ord.id)}
                            className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Store className="w-3.5 h-3.5" />
                            <span>Start Shopping at Store</span>
                          </button>
                        )}

                        {/* 3. If shopping -> Submit Prices for Customer Confirmation */}
                        {ord.status === 'shopping_in_progress' && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openPricingModal(ord)}
                              className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Enter Prices & Request Customer Approval</span>
                            </button>
                            <button
                              onClick={() => openPurchaseModal(ord)}
                              className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold transition cursor-pointer"
                            >
                              Direct Record Purchase
                            </button>
                          </div>
                        )}

                        {/* 4. If price confirmed -> Record Purchase */}
                        {ord.status === 'price_confirmed' && (
                          <button
                            onClick={() => openPurchaseModal(ord)}
                            className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Record Store Purchase & Upload Bill</span>
                          </button>
                        )}

                        {/* 5. If purchase recorded -> Out for Delivery */}
                        {ord.status === 'purchase_recorded' && (
                          <button
                            onClick={() => handleOutForDelivery(ord.id)}
                            className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>Start Driving (Out for Delivery)</span>
                          </button>
                        )}

                        {/* 6. If out for delivery -> Arrive at customer address */}
                        {ord.status === 'out_for_delivery' && (
                          <button
                            onClick={() => handleRequestCompletion(ord.id)}
                            className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Arrived at Customer Doorstep</span>
                          </button>
                        )}

                        {/* 7. If arrived -> Verify Delivery OTP to finalize */}
                        {ord.status === 'delivered_pending_completion' && (
                          <button
                            onClick={() => { setOtpModalOrder(ord); setEnteredOtp(''); }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Verify Customer OTP & Complete</span>
                          </button>
                        )}

                        {/* Completed badge */}
                        {ord.status === 'completed' && (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Delivery Completed (1 Credit Deducted)</span>
                          </span>
                        )}

                        {/* Direct Chat Button */}
                        <button
                          onClick={() => { setSelectedOrder(ord); setActiveTab('chat'); }}
                          className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {orders.length === 0 && (
                  <div className="p-12 text-center text-xs text-neutral-500">
                    No orders currently assigned to you.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Assigned Customers */}
        {activeTab === 'customers' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <h3 className="text-xl font-bold text-black">My Assigned Customers ({customers.length})</h3>
            <p className="text-xs text-neutral-500">
              Households in your local zone designated to you for shopping and deliveries.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customers.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-neutral-900">{c.name}</h4>
                    {c.hasActiveOrder ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                        Active Order #{c.activeOrderNumber}
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400">Idle</span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-600 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{c.phone}</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 mt-0.5 flex-shrink-0" />
                      <span>{c.address} ({c.locality})</span>
                    </p>
                    {c.landmark && <p className="text-[11px] text-neutral-400">Landmark: {c.landmark}</p>}
                    <p className="text-[11px] text-neutral-400">Preferred Language: {c.language}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Earnings & Settlements */}
        {activeTab === 'earnings' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <h3 className="text-xl font-bold text-black">Delivery & Commission Summary</h3>
            <p className="text-xs text-neutral-500">
              Admin-verified completion records for service settlements.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-neutral-900 text-white space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Deliveries Completed</span>
                <p className="text-3xl font-extrabold">{overview?.completedOrdersCount || 3}</p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Estimated Commission</span>
                <p className="text-3xl font-extrabold text-neutral-900">₹{(overview?.completedOrdersCount || 3) * 35}</p>
                <p className="text-[10px] text-neutral-500">Base allowance per delivery</p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Settlement Status</span>
                <p className="text-sm font-bold text-emerald-700 mt-2">Up to Date</p>
                <p className="text-[10px] text-neutral-500">Admin reconciled weekly</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Customer Messaging */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 bg-neutral-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold text-sm">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {selectedOrder ? `Order #${selectedOrder.orderNumber} Chat` : 'Customer Chat'}
                  </h4>
                  <p className="text-[10px] text-neutral-400">
                    Customer: {selectedOrder?.customerName || 'Aarav Sharma'} ({selectedOrder?.customerPhone})
                  </p>
                </div>
              </div>

              {selectedOrder && (
                <div className="text-right">
                  <span className="text-[10px] text-neutral-300 bg-neutral-800 px-2.5 py-1 rounded-full font-mono">
                    Status: {selectedOrder.status}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/50">
              {chatMessages.map((msg) => {
                const isMe = msg.senderRole === 'runner';
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
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-neutral-200 flex gap-2">
              <input
                type="text"
                placeholder="Send price updates, shop photos info, or arrival notes..."
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

      </div>

      {/* MODAL 1: Enter Prices & Request Approval */}
      {pricingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-black">Pricing Verification at Store</h3>
                <p className="text-xs text-neutral-500">Order #{pricingModalOrder.orderNumber}</p>
              </div>
              <button onClick={() => setPricingModalOrder(null)} className="text-neutral-400 hover:text-black font-bold">✕</button>
            </div>

            <form onSubmit={handlePricingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Store / Merchant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Venkateshwara Provision Stores, 12th Main"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-neutral-700">Item Prices & Stock Availability</label>
                {pricingItems.map((itm, idx) => (
                  <div key={itm.id} className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-neutral-900">{itm.name}</p>
                      <p className="text-[11px] text-neutral-500">{itm.quantity} {itm.unit} {itm.brandPreference ? `• ${itm.brandPreference}` : ''}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-[11px] text-neutral-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={itm.isAvailable ?? true}
                          onChange={(e) => {
                            const updated = [...pricingItems];
                            updated[idx].isAvailable = e.target.checked;
                            setPricingItems(updated);
                          }}
                        />
                        <span>Available</span>
                      </label>

                      <div className="flex items-center gap-1">
                        <span className="text-neutral-500 font-bold">₹</span>
                        <input
                          type="number"
                          placeholder="Price"
                          value={itm.confirmedPrice || ''}
                          onChange={(e) => {
                            const updated = [...pricingItems];
                            updated[idx].confirmedPrice = Number(e.target.value);
                            setPricingItems(updated);
                          }}
                          className="w-24 px-2 py-1.5 rounded-lg border border-neutral-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 text-white flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider">Calculated Total Bill:</span>
                <span className="text-lg font-extrabold">
                  ₹{pricingItems.reduce((acc, curr) => acc + (curr.isAvailable ? (curr.confirmedPrice || 0) : 0), 0)}
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPricingModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Send for Customer Confirmation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Purchase */}
      {purchaseModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-black">Record Purchase Bill</h3>
                <p className="text-xs text-neutral-500">Order #{purchaseModalOrder.orderNumber}</p>
              </div>
              <button onClick={() => setPurchaseModalOrder(null)} className="text-neutral-400 hover:text-black font-bold">✕</button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Actual Amount Paid at Shop (₹) *</label>
                <input
                  type="number"
                  required
                  value={actualPurchaseAmount}
                  onChange={(e) => setActualPurchaseAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-black font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Merchant / Shop Name</label>
                <input
                  type="text"
                  value={purchaseShop}
                  onChange={(e) => setPurchaseShop(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Payment Method Used</label>
                <select
                  value={purchasePaymentMethod}
                  onChange={(e) => setPurchasePaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="UPI to Shop QR">UPI to Shop QR Code</option>
                  <option value="Runner Cash">Cash at Counter</option>
                  <option value="Runner Debit Card">Debit / POS Card</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Store Bill / Receipt Photo URL</label>
                <input
                  type="text"
                  placeholder="Receipt image link / reference"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPurchaseModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Save Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Verify Delivery OTP */}
      {otpModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-sm w-full p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-lg text-black">Delivery Verification</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Ask customer {otpModalOrder.customerName} for their 4-digit Delivery OTP.
              </p>
            </div>

            <form onSubmit={handleCompleteWithOtp} className="space-y-4">
              <input
                type="text"
                required
                maxLength={4}
                placeholder="4-digit OTP"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                className="w-full text-center text-3xl font-mono font-extrabold tracking-widest px-4 py-3 rounded-2xl border-2 border-neutral-300 focus:outline-none focus:border-black"
              />

              <div className="p-3 rounded-xl bg-neutral-50 text-[11px] text-neutral-600 text-left">
                • Verifying OTP atomically consumes <strong>1 subscription credit</strong>.
                <br />
                • The verified product total of ₹{otpModalOrder.totalActualPrice || 0} is finalized.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
