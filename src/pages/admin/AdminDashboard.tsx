import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Order, 
  ServiceArea, 
  SubscriptionPlan, 
  RechargeRequest, 
  AuditLog, 
  SupportTicket, 
  PlatformSettings 
} from '../../types';
import { 
  ShieldCheck, 
  Users, 
  Bike, 
  ShoppingBag, 
  Wallet, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  FileText, 
  Search, 
  Check, 
  X, 
  Plus, 
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  Clock,
  Download,
  BarChart3,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'recharges' | 'subscriptions' | 'runners' | 'customers' | 'orders' | 'refunds' | 'reports' | 'moderation' | 'settings' | 'logs' | 'tickets'>('overview');

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [paymentsSummary, setPaymentsSummary] = useState<any>(null);
  const [reportsData, setReportsData] = useState<any>(null);
  const [moderationReports, setModerationReports] = useState<any[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [runners, setRunners] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [recharges, setRecharges] = useState<RechargeRequest[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Action states
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refundCustomerId, setRefundCustomerId] = useState('');
  const [refundAmount, setRefundAmount] = useState(100);
  const [refundReason, setRefundReason] = useState('');
  const [refundOrderId, setRefundOrderId] = useState('');

  // New service area form
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaCity, setNewAreaCity] = useState('Ambarnath');
  const [newAreaPincode, setNewAreaPincode] = useState('421501');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-user-id': token || '',
  };

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/overview', { headers });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchRunners = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/runners', { headers });
      if (res.ok) {
        const data = await res.json();
        setRunners(data.runners);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/customers', { headers });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchRecharges = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/wallets/recharges', { headers });
      if (res.ok) {
        const data = await res.json();
        setRecharges(data.recharges);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/subscriptions', { headers });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/orders', { headers });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/audit-logs', { headers });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchSettingsAndAreas = useCallback(async () => {
    try {
      const [resSet, resAreas, resPlans, resTickets] = await Promise.all([
        fetch('/api/v1/admin/settings', { headers }),
        fetch('/api/v1/admin/service-areas', { headers }),
        fetch('/api/v1/admin/plans', { headers }),
        fetch('/api/v1/admin/support-tickets', { headers }),
      ]);
      if (resSet.ok) setSettings((await resSet.json()).settings);
      if (resAreas.ok) setServiceAreas((await resAreas.json()).areas);
      if (resPlans.ok) setPlans((await resPlans.json()).plans);
      if (resTickets.ok) setTickets((await resTickets.json()).tickets);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchPaymentsSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/payments/summary', { headers });
      if (res.ok) {
        const data = await res.json();
        setPaymentsSummary(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/reports', { headers });
      if (res.ok) {
        const data = await res.json();
        setReportsData(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchModeration = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/moderation/reports', { headers });
      if (res.ok) {
        const data = await res.json();
        setModerationReports(data.reports || []);
        setModerationLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchOverview(),
      fetchRunners(),
      fetchCustomers(),
      fetchRecharges(),
      fetchSubscriptions(),
      fetchOrders(),
      fetchLogs(),
      fetchSettingsAndAreas(),
      fetchPaymentsSummary(),
      fetchReports(),
      fetchModeration(),
    ]).finally(() => setLoading(false));
  }, [fetchOverview, fetchRunners, fetchCustomers, fetchRecharges, fetchSubscriptions, fetchOrders, fetchLogs, fetchSettingsAndAreas, fetchPaymentsSummary, fetchReports, fetchModeration]);

  const handleResolveReport = async (reportId: string, action: 'warn' | 'restrict' | 'suspend_account' | 'dismiss') => {
    const adminNotes = prompt(`Action: ${action}. Enter notes or reason:`);
    try {
      const res = await fetch(`/api/v1/admin/moderation/reports/${reportId}/resolve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, adminNotes: adminNotes || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchModeration();
        await fetchCustomers();
        await fetchLogs();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleExportCsv = (type: 'financial' | 'orders') => {
    const url = `/api/v1/admin/reports/export-csv?type=${type}`;
    window.open(url, '_blank');
  };

  // Approve Recharge
  const handleApproveRecharge = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/wallets/recharges/${id}/approve`, { method: 'POST', headers });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchRecharges();
        await fetchOverview();
        await fetchLogs();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Reject Recharge
  const handleRejectRecharge = async (id: string) => {
    const reason = prompt('Please enter reason for rejection (e.g. Invalid bank reference):');
    if (!reason) return;
    try {
      const res = await fetch(`/api/v1/admin/wallets/recharges/${id}/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchRecharges();
        await fetchLogs();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Verify Subscription
  const handleVerifySubscription = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/subscriptions/${id}/verify`, { method: 'POST', headers });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchSubscriptions();
        await fetchOverview();
        await fetchLogs();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Approve Runner
  const handleApproveRunner = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/runners/${id}/approve`, { method: 'POST', headers });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchRunners();
        await fetchOverview();
        await fetchLogs();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Assign designated runner to customer
  const handleAssignRunner = async (customerId: string, runnerId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/customers/${customerId}/assign-runner`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ runnerId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchCustomers();
        await fetchRunners();
        await fetchLogs();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Suspend or Activate user
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const reason = prompt(`Enter reason for ${newStatus === 'suspended' ? 'suspending' : 'activating'} user:`) || 'Administrative decision';
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: newStatus, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchCustomers();
        await fetchRunners();
        await fetchLogs();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Change user role
  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/change-role`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchCustomers();
        await fetchRunners();
        await fetchLogs();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Issue Refund
  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundCustomerId || !refundAmount || !refundReason) {
      setActionMessage({ type: 'error', text: 'Customer ID, Amount, and Mandatory Reason are required.' });
      return;
    }

    try {
      const res = await fetch('/api/v1/admin/wallets/refund', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerId: refundCustomerId,
          amount: refundAmount,
          orderId: refundOrderId || undefined,
          reason: refundReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setRefundReason('');
        setRefundCustomerId('');
        await fetchOverview();
        await fetchLogs();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Add Service Area
  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    try {
      const res = await fetch('/api/v1/admin/service-areas', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newAreaName.trim(),
          city: newAreaCity,
          pincode: newAreaPincode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setNewAreaName('');
        setNewAreaPincode('');
        await fetchSettingsAndAreas();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Admin Header */}
        <div className="bg-neutral-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center font-bold text-xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">M-PARTNER Operations Control Panel</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Powered by <strong className="text-white">Mãrçò 💯</strong> • Full-Stack Ledger & Verification Administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-2xl text-xs text-right">
              <p className="text-[10px] uppercase font-bold text-neutral-500">Supervised Platform</p>
              <p className="font-bold text-white">M-PARTNER Official</p>
            </div>
          </div>
        </div>

        {/* Action Alert */}
        {actionMessage && (
          <div className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2 border ${
            actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
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

        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-2">
          {[
            { id: 'overview', label: 'Overview Metrics' },
            { id: 'payments', label: 'Payments & Accounting' },
            { id: 'recharges', label: `Pending Recharges (${recharges.filter(r => r.status === 'pending').length})` },
            { id: 'subscriptions', label: `Pending Subscriptions (${subscriptions.filter(s => s.status === 'pending_verification').length})` },
            { id: 'runners', label: `Runners (${runners.length})` },
            { id: 'customers', label: `Customers & Assignments (${customers.length})` },
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'refunds', label: 'Issue Refund' },
            { id: 'reports', label: 'Reports & CSV' },
            { id: 'moderation', label: `Moderation (${moderationReports.filter(r => r.status === 'pending').length})` },
            { id: 'settings', label: 'Platform Settings & Zones' },
            { id: 'logs', label: 'Immutable Audit Trail' },
            { id: 'tickets', label: `Support Tickets (${tickets.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:text-black border border-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Total Customers</p>
                <p className="text-2xl font-extrabold text-black mt-1">{overview?.metrics?.totalCustomers ?? customers.length}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Active Runners</p>
                <p className="text-2xl font-extrabold text-black mt-1">{overview?.metrics?.totalRunners ?? runners.length}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Total Deliveries</p>
                <p className="text-2xl font-extrabold text-black mt-1">{overview?.metrics?.totalOrders ?? orders.length}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Completed</p>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">{overview?.metrics?.completedOrders ?? 0}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <p className="text-[10px] font-bold text-amber-600 uppercase">Pending Recharges</p>
                <p className="text-2xl font-extrabold text-amber-700 mt-1">{overview?.metrics?.pendingRechargesCount ?? 0}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Customer Wallets</p>
                <p className="text-2xl font-extrabold text-neutral-900 mt-1">₹{overview?.metrics?.totalWalletBalances ?? 0}</p>
              </div>
            </div>

            {/* Pending actions quick alert */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-black">Awaiting Wallet Recharge Verification</h3>
                  <button onClick={() => setActiveTab('recharges')} className="text-xs font-bold text-neutral-600 hover:text-black">
                    View All →
                  </button>
                </div>
                <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
                  {recharges.filter(r => r.status === 'pending').map((r) => (
                    <div key={r.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-black">{r.userName}</p>
                        <p className="text-[11px] text-neutral-500">Ref: {r.paymentReference} • {r.paymentMethod}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-neutral-900">₹{r.amount}</span>
                        <button
                          onClick={() => handleApproveRecharge(r.id)}
                          className="px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-bold hover:bg-neutral-800"
                        >
                          Verify & Credit
                        </button>
                      </div>
                    </div>
                  ))}
                  {recharges.filter(r => r.status === 'pending').length === 0 && (
                    <p className="p-4 text-center text-xs text-neutral-400">No pending recharge requests.</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-black">Awaiting Subscription Verification</h3>
                  <button onClick={() => setActiveTab('subscriptions')} className="text-xs font-bold text-neutral-600 hover:text-black">
                    View All →
                  </button>
                </div>
                <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
                  {subscriptions.filter(s => s.status === 'pending_verification').map((s) => (
                    <div key={s.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-black">{s.userName} ({s.planName} Plan)</p>
                        <p className="text-[11px] text-neutral-500">Ref: {s.paymentRef || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700">+{s.creditsTotal} Credits</span>
                        <button
                          onClick={() => handleVerifySubscription(s.id)}
                          className="px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-bold hover:bg-neutral-800"
                        >
                          Activate Plan
                        </button>
                      </div>
                    </div>
                  ))}
                  {subscriptions.filter(s => s.status === 'pending_verification').length === 0 && (
                    <p className="p-4 text-center text-xs text-neutral-400">No pending subscription activations.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAYMENTS & ACCOUNTING RECONCILIATION */}
        {activeTab === 'payments' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-black">Financial Reconciliation & Ledger Administration</h3>
              <p className="text-xs text-neutral-500">
                Full-stack financial separation: Gross subscription revenue is distinct from store product expense wallet balances, runner commissions, and merchant outlays.
              </p>
            </div>

            {/* 6 Key Accounting Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Gross Subscription Revenue</p>
                  <Award className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-2xl font-extrabold text-black mt-2">
                  ₹{paymentsSummary?.accountingSummary?.grossSubscriptionRevenue ?? 0}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">Gross delivery fee collections from plans</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Gross Wallet Deposits</p>
                  <Wallet className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-2xl font-extrabold text-black mt-2">
                  ₹{paymentsSummary?.accountingSummary?.grossWalletDeposits ?? 0}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">Customer pre-funded product funds</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Paid to Shops by Runners</p>
                  <ShoppingBag className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-2xl font-extrabold text-neutral-900 mt-2">
                  ₹{paymentsSummary?.accountingSummary?.totalAmountPaidToShops ?? 0}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">Physical store billing receipts verified</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Debited from Customer Wallets</p>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-extrabold text-emerald-700 mt-2">
                  ₹{paymentsSummary?.accountingSummary?.totalAmountChargedToCustomers ?? 0}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">Reimbursed for actual shopping costs</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Runner Commissions</p>
                  <Bike className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-2xl font-extrabold text-neutral-900 mt-2">
                  ₹{paymentsSummary?.accountingSummary?.totalRunnerCommissions ?? 0}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">Earnings accrued (₹{settings?.runnerCommissionPerDelivery || 35} / delivery)</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Total Refunds Issued</p>
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-2xl font-extrabold text-rose-600 mt-2">
                  ₹{paymentsSummary?.accountingSummary?.totalRefunds ?? 0}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">Wallet returns with mandatory reasons</p>
              </div>
            </div>

            {/* Recent Wallet Transactions Ledger */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-black">Recent Financial Wallet Ledger Entries</h4>
                  <p className="text-xs text-neutral-500">Atomic double-entry transaction record across customer wallets</p>
                </div>
                <button
                  onClick={() => handleExportCsv('financial')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Ledger CSV
                </button>
              </div>

              <div className="overflow-x-auto border border-neutral-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Ledger ID</th>
                      <th className="p-3">User ID</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Notes & Reason</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                    {paymentsSummary?.recentWalletTransactions?.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-semibold text-neutral-900">{entry.id}</td>
                        <td className="p-3 text-neutral-600">{entry.userId}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            entry.type === 'credit' ? 'bg-emerald-50 text-emerald-700' :
                            entry.type === 'debit' ? 'bg-neutral-100 text-neutral-800' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-neutral-900">₹{entry.amount}</td>
                        <td className="p-3 text-emerald-600 font-bold">{entry.status}</td>
                        <td className="p-3 font-sans text-neutral-700 text-xs">{entry.notes}</td>
                        <td className="p-3 text-neutral-400">{new Date(entry.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!paymentsSummary?.recentWalletTransactions || paymentsSummary.recentWalletTransactions.length === 0) && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-neutral-400 font-sans">
                          No wallet ledger transactions recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WALLET RECHARGE APPROVALS */}
        {activeTab === 'recharges' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-xl font-bold text-black">Wallet Recharge Verification Queue</h3>
              <p className="text-xs text-neutral-500">
                Customers submit recharge requests with bank/UPI references. Admin verification atomically credits customer wallet and logs a verified ledger entry.
              </p>
            </div>

            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
              {recharges.map((r) => (
                <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900">{r.userName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === 'approved' ? 'bg-emerald-50 text-emerald-800' : r.status === 'rejected' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-neutral-600">
                      Amount: <strong className="text-black font-extrabold text-sm">₹{r.amount}</strong> • Reference: <span className="font-mono">{r.paymentReference}</span>
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Method: {r.paymentMethod} • Requested on {new Date(r.createdAt).toLocaleString()}
                    </p>
                    {r.adminNote && <p className="text-[11px] text-neutral-500 italic">Admin Note: {r.adminNote}</p>}
                  </div>

                  {r.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectRecharge(r.id)}
                        className="px-3.5 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-100 cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveRecharge(r.id)}
                        className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Credit Wallet</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-right text-xs text-neutral-400">
                      Reviewed on {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SUBSCRIPTION VERIFICATIONS */}
        {activeTab === 'subscriptions' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-xl font-bold text-black">Subscription Verification & Activation</h3>
              <p className="text-xs text-neutral-500">
                Approving a subscription plan issues the specified delivery credits and starts the 30-day validity window.
              </p>
            </div>

            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
              {subscriptions.map((s) => (
                <div key={s.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900">{s.userName}</span>
                      <span className="font-bold text-xs text-neutral-700">({s.planName} Plan)</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-neutral-600">
                      Credits: <strong>{s.creditsRemaining} / {s.creditsTotal} remaining</strong> • UTR Ref: <span className="font-mono">{s.paymentRef || 'N/A'}</span>
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Valid from {new Date(s.startDate).toLocaleDateString()} to {new Date(s.expiresAt).toLocaleDateString()}
                    </p>
                  </div>

                  {s.status === 'pending_verification' && (
                    <button
                      onClick={() => handleVerifySubscription(s.id)}
                      className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify & Activate Credits</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RUNNERS MANAGEMENT */}
        {activeTab === 'runners' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-black">Registered Runners</h3>
                <p className="text-xs text-neutral-500">Approve new applications, assign service areas, and inspect workloads.</p>
              </div>
            </div>

            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
              {runners.map((r) => (
                <div key={r.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50 transition">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900">{r.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.isApproved ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {r.isApproved ? 'Approved' : 'Pending Approval'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === 'suspended' ? 'bg-rose-100 text-rose-800' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {r.status || 'active'}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-semibold">• Zone: {r.serviceArea}</span>
                    </div>
                    <p className="text-neutral-600">
                      Phone: <strong>{r.phone}</strong> • Rating: ★ {r.rating} • Vehicle: {r.vehicleType}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Assigned Customers: <strong className="text-neutral-900">{r.assignedCustomersCount}</strong> • Active Orders: {r.activeJobs} • Completed: {r.completedJobs}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!r.isApproved && (
                      <button
                        onClick={() => handleApproveRunner(r.id)}
                        className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                      >
                        Approve Application
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleUserStatus(r.id, r.status || 'active')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        r.status === 'suspended' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {r.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                    </button>

                    <select
                      value="runner"
                      onChange={(e) => handleChangeUserRole(r.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-neutral-300 text-xs font-medium bg-white"
                      title="Change user role"
                    >
                      <option value="runner">Role: Runner</option>
                      <option value="customer">Change to Customer</option>
                      <option value="admin">Promote to Admin</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMERS & DESIGNATED RUNNER ASSIGNMENTS */}
        {activeTab === 'customers' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-xl font-bold text-black">Customer Accounts & Designated Runner Mapping</h3>
              <p className="text-xs text-neutral-500">
                Each customer has one designated Runner for their locality. You can reassign or assign runners below.
              </p>
            </div>

            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
              {customers.map((c) => (
                <div key={c.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50 transition">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900">{c.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'suspended' ? 'bg-rose-100 text-rose-800' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {c.status || 'active'}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-semibold">• Locality: {c.locality}</span>
                    </div>
                    <p className="text-neutral-600">
                      Phone: <strong>{c.phone}</strong> • Address: {c.address}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Wallet: <strong className="text-black font-bold">₹{c.walletBalance}</strong> • Subscription: <span className="font-semibold">{c.subscriptionPlan} ({c.subscriptionCreditsRemaining} credits)</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right text-xs">
                      <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-0.5">Designated Runner</label>
                      <select
                        value={c.assignedRunnerId || ''}
                        onChange={(e) => handleAssignRunner(c.id, e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="">-- No Runner Assigned --</option>
                        {runners.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.serviceArea})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-3 sm:pt-0">
                      <button
                        onClick={() => handleToggleUserStatus(c.id, c.status || 'active')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          c.status === 'suspended' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {c.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                      </button>

                      <select
                        value="customer"
                        onChange={(e) => handleChangeUserRole(c.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-neutral-300 text-xs font-medium bg-white"
                        title="Change user role"
                      >
                        <option value="customer">Role: Customer</option>
                        <option value="runner">Change to Runner</option>
                        <option value="admin">Promote to Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ORDERS SUPERVISION */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <h3 className="text-xl font-bold text-black">Order Supervision</h3>
            <p className="text-xs text-neutral-500">Supervise order states, receipts, item prices, and OTP completions.</p>

            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
              {orders.map((o) => (
                <div key={o.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50 transition text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-black">#{o.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 uppercase">{o.status.replace(/_/g, ' ')}</span>
                      <span className="text-neutral-500">• {new Date(o.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-neutral-700">
                      Customer: <strong>{o.customerName}</strong> • Runner: <strong>{o.runnerName || 'Unassigned'}</strong>
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Items: {o.items.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="font-extrabold text-sm text-neutral-900">
                      {o.totalActualPrice ? `₹${o.totalActualPrice}` : 'Pricing pending'}
                    </p>
                    <p className="text-[10px] text-neutral-400">OTP: <span className="font-mono font-bold text-black">{o.deliveryOtp}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: REFUNDS */}
        {activeTab === 'refunds' && (
          <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-xl font-bold text-black">Issue Wallet Refund</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Every refund requires a mandatory administrative justification and creates an immutable ledger entry.
              </p>
            </div>

            <form onSubmit={handleIssueRefund} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Select Customer *</label>
                <select
                  required
                  value={refundCustomerId}
                  onChange={(e) => setRefundCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) — Current Balance: ₹{c.walletBalance}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Refund Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Related Order # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. MP-1004"
                    value={refundOrderId}
                    onChange={(e) => setRefundOrderId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Mandatory Justification Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the reason for refunding funds (e.g. Merchant item returned / store bill overcharge correction)..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-black text-white font-bold text-xs hover:bg-neutral-800 transition cursor-pointer"
                >
                  Process & Credit Refund to Customer Wallet
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB: REPORTS & ANALYTICS */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-black">Operational Analytics & Reports</h3>
                <p className="text-xs text-neutral-500">
                  Comprehensive order progression, credit consumption lifecycle, and territorial hub efficiency.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCsv('orders')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Orders CSV
                </button>
                <button
                  onClick={() => handleExportCsv('financial')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-neutral-50 text-black border border-neutral-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Financial CSV
                </button>
              </div>
            </div>

            {/* Credit Lifecycle Analytics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Credits Issued</p>
                <p className="text-2xl font-extrabold text-black mt-2">
                  {reportsData?.credits?.creditsIssued ?? 0}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">Granted via verified subscriptions</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Credits Consumed</p>
                <p className="text-2xl font-extrabold text-neutral-900 mt-2">
                  {reportsData?.credits?.creditsConsumed ?? 0}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">Deducted (1 credit per delivery)</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Credits Remaining</p>
                <p className="text-2xl font-extrabold text-emerald-700 mt-2">
                  {reportsData?.credits?.activeCreditsRemaining ?? 0}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">Currently valid across active plans</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Expired / Forfeited</p>
                <p className="text-2xl font-extrabold text-rose-600 mt-2">
                  {reportsData?.credits?.creditsExpired ?? 0}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">Post 30-day validity expiry</p>
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
              <h4 className="font-bold text-base text-black">Order Pipeline Status Distribution</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {reportsData?.statusCounts && Object.entries(reportsData.statusCounts).map(([status, count]: [string, any]) => (
                  <div key={status} className="p-3.5 rounded-xl border border-neutral-100 bg-neutral-50/70">
                    <p className="text-[10px] font-bold uppercase text-neutral-500 truncate">{status.replace(/_/g, ' ')}</p>
                    <p className="text-xl font-extrabold text-black mt-1">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hub Performance Table */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
              <h4 className="font-bold text-base text-black">Service Area Hub Performance</h4>
              <div className="overflow-x-auto border border-neutral-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Area Name</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Customers Registered</th>
                      <th className="p-3">Orders Created</th>
                      <th className="p-3">Completed Deliveries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {reportsData?.areaPerformance?.map((area: any) => (
                      <tr key={area.areaName} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-bold text-black">{area.areaName}</td>
                        <td className="p-3 text-neutral-600">{area.city}</td>
                        <td className="p-3 text-neutral-800">{area.customerCount}</td>
                        <td className="p-3 text-neutral-800">{area.ordersCount}</td>
                        <td className="p-3 font-bold text-emerald-700">{area.completedCount}</td>
                      </tr>
                    ))}
                    {(!reportsData?.areaPerformance || reportsData.areaPerformance.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-neutral-400">
                          No service areas data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MODERATION QUEUE & AUDIT */}
        {activeTab === 'moderation' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-black">Content Moderation & Trust & Safety</h3>
              <p className="text-xs text-neutral-500">
                Layered safety: Review user-reported messages, take punitive enforcement (warnings, suspensions), and inspect automated Unicode-filtered blocks.
              </p>
            </div>

            {/* Reports Queue */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-black">User Content Reports</h4>
                <span className="text-xs text-neutral-500">
                  {moderationReports.filter(r => r.status === 'pending').length} pending review
                </span>
              </div>

              <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
                {moderationReports.map((report) => (
                  <div key={report.id} className="p-5 space-y-3 hover:bg-neutral-50/50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900">Report #{report.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          report.status === 'pending' ? 'bg-amber-50 text-amber-800' :
                          report.status === 'dismissed' ? 'bg-neutral-100 text-neutral-600' : 'bg-rose-50 text-rose-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400">{new Date(report.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-neutral-500">Reporter: </span>
                        <strong className="text-neutral-900">{report.reporterName || report.reporterId}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-500">Reported User: </span>
                        <strong className="text-neutral-900">{report.reportedUserName || report.reportedUserId}</strong>
                      </div>
                    </div>

                    <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-xs">
                      <p className="text-neutral-500 text-[10px] uppercase font-bold">Reported Reason / Snippet</p>
                      <p className="text-neutral-900 mt-1 font-sans">{report.reason || 'Flagged for inappropriate content'}</p>
                      {report.messageContent && (
                        <p className="text-neutral-600 mt-1 italic font-mono text-[11px]">"{report.messageContent}"</p>
                      )}
                    </div>

                    {report.adminNotes && (
                      <p className="text-xs text-neutral-600">
                        <strong>Admin Notes:</strong> {report.adminNotes}
                      </p>
                    )}

                    {report.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleResolveReport(report.id, 'warn')}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer"
                        >
                          Send Formal Warning
                        </button>
                        <button
                          onClick={() => handleResolveReport(report.id, 'suspend_account')}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                        >
                          Suspend Account
                        </button>
                        <button
                          onClick={() => handleResolveReport(report.id, 'dismiss')}
                          className="px-3 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold transition cursor-pointer"
                        >
                          Dismiss Report
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {moderationReports.length === 0 && (
                  <p className="p-8 text-center text-xs text-neutral-400">
                    No content reports submitted. The chat environment is compliant.
                  </p>
                )}
              </div>
            </div>

            {/* Automated Moderation Logs */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
              <div>
                <h4 className="font-bold text-base text-black">Automated Filter Block Log</h4>
                <p className="text-xs text-neutral-500">Live feed of messages intercepted by pre-send Unicode filters before reaching recipients.</p>
              </div>

              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden font-mono text-[11px]">
                {moderationLogs.slice(0, 15).map((log) => (
                  <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                        <span className="font-bold text-rose-600">[{log.action.toUpperCase()}]</span>
                        <span className="text-neutral-700">User: {log.userId}</span>
                      </div>
                      <p className="text-neutral-600 font-sans text-xs">Flagged: {log.reason}</p>
                    </div>
                    <span className="text-[10px] text-neutral-400">{log.id}</span>
                  </div>
                ))}
                {moderationLogs.length === 0 && (
                  <p className="p-6 text-center text-xs text-neutral-400 font-sans">
                    No automatic filter interventions logged yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SETTINGS & SERVICE AREAS */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* General Settings */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-black">Platform Settings</h3>

              {settings && (
                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Official Platform Name</label>
                    <input
                      type="text"
                      disabled
                      value={settings.platformName}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Official Parent Brand (Exact)</label>
                    <input
                      type="text"
                      disabled
                      value={settings.parentBrand}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Admin UPI ID (For Recharges & Subscriptions) *</label>
                    <input
                      type="text"
                      required
                      value={settings.upiId}
                      onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Support Phone</label>
                      <input
                        type="text"
                        value={settings.supportPhone}
                        onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Support Email</label>
                      <input
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Service Areas */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-black">Configured Service Hubs</h3>

              <form onSubmit={handleAddArea} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Area name (e.g. Malleshwaram)"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={newAreaPincode}
                  onChange={(e) => setNewAreaPincode(e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  + Add Hub
                </button>
              </form>

              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden">
                {serviceAreas.map((a) => (
                  <div key={a.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-neutral-900">{a.name}</span>
                      <span className="text-neutral-500 ml-2">({a.city} {a.pincode})</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: IMMUTABLE AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-xl font-bold text-black">Immutable Server Audit Trail</h3>
              <p className="text-xs text-neutral-500">
                Chronological record of every verified action, subscription activation, wallet credit, and runner assignment.
              </p>
            </div>

            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden font-mono text-[11px]">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50 transition">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">[{new Date(log.createdAt).toISOString()}]</span>
                      <span className="font-bold text-neutral-900">[{log.action}]</span>
                      <span className="text-neutral-500">by {log.actorName} ({log.actorRole})</span>
                    </div>
                    <p className="text-neutral-700 font-sans text-xs">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">{log.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 10: SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <h3 className="text-xl font-bold text-black">Customer Support Queue</h3>
            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
              {tickets.map((t) => (
                <div key={t.id} className="p-5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-black">{t.subject}</span>
                      <span className="text-neutral-500 ml-2">from {t.userName} ({t.userEmail})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === 'resolved' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-neutral-700">{t.message}</p>
                  <p className="text-[10px] text-neutral-400">Received on {new Date(t.createdAt).toLocaleString()} • Category: {t.category}</p>
                </div>
              ))}
              {tickets.length === 0 && (
                <p className="p-8 text-center text-xs text-neutral-400">No support tickets.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
