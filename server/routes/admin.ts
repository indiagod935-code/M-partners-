import { Router, Request, Response } from 'express';
import { db, User, RunnerProfile, Wallet, WalletLedgerEntry, SubscriptionLedgerEntry, UserSubscription, Order, ServiceArea, SubscriptionPlan, SupportTicket } from '../db.ts';
import { authenticateUser } from './auth.ts';

const router = Router();

function requireAdmin(req: Request, res: Response, next: () => void) {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required' });
  }
  (req as any).user = user;
  next();
}

router.use(requireAdmin);

// GET /overview - High-level metrics
router.get('/overview', (req: Request, res: Response) => {
  const users = db.get('users');
  const customers = users.filter(u => u.role === 'customer');
  const runners = users.filter(u => u.role === 'runner');
  const runnerProfiles = db.get('runnerProfiles');
  const pendingRunners = runnerProfiles.filter(r => !r.isApproved);

  const orders = db.get('orders');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const activeOrders = orders.filter(o => !['completed', 'cancelled', 'rejected'].includes(o.status));

  const recharges = db.get('rechargeRequests');
  const pendingRecharges = recharges.filter(r => r.status === 'pending');

  const subscriptions = db.get('userSubscriptions');
  const pendingSubscriptions = subscriptions.filter(s => s.status === 'pending_verification');
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

  const wallets = db.get('wallets');
  const totalWalletBalances = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);

  const tickets = db.get('supportTickets');
  const openTickets = tickets.filter(t => t.status === 'open');

  return res.json({
    metrics: {
      totalCustomers: customers.length,
      totalRunners: runners.length,
      pendingRunnerApprovals: pendingRunners.length,
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      pendingRechargesCount: pendingRecharges.length,
      pendingSubscriptionsCount: pendingSubscriptions.length,
      activeSubscriptionsCount: activeSubscriptions.length,
      totalWalletBalances,
      openTicketsCount: openTickets.length,
    },
    recentOrders: orders.slice(0, 5),
    pendingRecharges: pendingRecharges.slice(0, 5),
    pendingSubscriptions: pendingSubscriptions.slice(0, 5),
  });
});

// GET /runners - List all runners
router.get('/runners', (req: Request, res: Response) => {
  const users = db.get('users').filter(u => u.role === 'runner');
  const profiles = db.get('runnerProfiles');
  const areas = db.get('serviceAreas');
  const orders = db.get('orders');
  const allCustomers = db.get('users').filter(u => u.role === 'customer');

  const result = users.map(u => {
    const profile = profiles.find(p => p.userId === u.id);
    const area = areas.find(a => a.id === u.serviceAreaId || a.id === profile?.serviceAreaId);
    const assignedCustomers = allCustomers.filter(c => c.assignedRunnerId === u.id);
    const runnerOrders = orders.filter(o => o.runnerId === u.id);
    const activeJobs = runnerOrders.filter(o => !['completed', 'cancelled', 'rejected'].includes(o.status)).length;
    const completedJobs = runnerOrders.filter(o => o.status === 'completed').length;

    return {
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      address: u.address,
      status: u.status,
      serviceArea: area ? `${area.name}, ${area.city}` : 'Not assigned',
      serviceAreaId: u.serviceAreaId || profile?.serviceAreaId,
      isApproved: profile?.isApproved ?? false,
      isAvailable: profile?.isAvailable ?? false,
      rating: profile?.rating ?? 5.0,
      languages: profile?.languages ?? ['English'],
      vehicleType: profile?.vehicleType ?? 'Two Wheeler',
      assignedCustomersCount: assignedCustomers.length,
      activeJobs,
      completedJobs,
      createdAt: u.createdAt,
    };
  });

  return res.json({ runners: result });
});

// POST /runners/:id/approve - Approve runner
router.post('/runners/:id/approve', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;

  const users = db.get('users');
  const user = users.find(u => u.id === id && u.role === 'runner');
  if (!user) return res.status(404).json({ error: 'Runner not found' });

  user.status = 'active';
  db.set('users', users);

  const profiles = db.get('runnerProfiles');
  const profile = profiles.find(p => p.userId === id);
  if (profile) {
    profile.isApproved = true;
    profile.isAvailable = true;
    db.set('runnerProfiles', profiles);
  }

  db.addAuditLog(admin.id, admin.name, 'admin', 'APPROVE_RUNNER', 'runner', id, `Approved runner: ${user.name} (${user.phone})`);

  return res.json({ message: `Runner ${user.name} has been approved and activated!` });
});

// POST /runners/:id/reject - Reject runner
router.post('/runners/:id/reject', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { reason } = req.body;

  const users = db.get('users');
  const user = users.find(u => u.id === id && u.role === 'runner');
  if (!user) return res.status(404).json({ error: 'Runner not found' });

  user.status = 'suspended';
  db.set('users', users);

  const profiles = db.get('runnerProfiles');
  const profile = profiles.find(p => p.userId === id);
  if (profile) {
    profile.isApproved = false;
    profile.isAvailable = false;
    db.set('runnerProfiles', profiles);
  }

  db.addAuditLog(admin.id, admin.name, 'admin', 'REJECT_RUNNER', 'runner', id, `Rejected runner application: ${user.name}. Reason: ${reason || 'Criteria not met'}`);

  return res.json({ message: `Runner ${user.name} application rejected.` });
});

// POST /runners/:id/assign-area - Assign runner to service area
router.post('/runners/:id/assign-area', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { serviceAreaId } = req.body;

  const users = db.get('users');
  const user = users.find(u => u.id === id && u.role === 'runner');
  if (!user) return res.status(404).json({ error: 'Runner not found' });

  user.serviceAreaId = serviceAreaId;
  db.set('users', users);

  const profiles = db.get('runnerProfiles');
  const profile = profiles.find(p => p.userId === id);
  if (profile) {
    profile.serviceAreaId = serviceAreaId;
    db.set('runnerProfiles', profiles);
  }

  const areas = db.get('serviceAreas');
  const area = areas.find(a => a.id === serviceAreaId);

  db.addAuditLog(admin.id, admin.name, 'admin', 'ASSIGN_RUNNER_AREA', 'runner', id, `Assigned runner ${user.name} to area ${area?.name || serviceAreaId}`);

  return res.json({ message: `Runner assigned to ${area?.name || 'new area'}` });
});

// GET /customers - List all customers with assigned runner info & wallet
router.get('/customers', (req: Request, res: Response) => {
  const customers = db.get('users').filter(u => u.role === 'customer');
  const runners = db.get('users').filter(u => u.role === 'runner');
  const wallets = db.get('wallets');
  const subscriptions = db.get('userSubscriptions');
  const areas = db.get('serviceAreas');

  const result = customers.map(c => {
    const runner = runners.find(r => r.id === c.assignedRunnerId);
    const wallet = wallets.find(w => w.userId === c.id);
    const sub = subscriptions.find(s => s.userId === c.id && s.status === 'active');
    const area = areas.find(a => a.id === c.serviceAreaId);

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      building: c.building,
      locality: c.locality,
      landmark: c.landmark,
      serviceArea: area ? area.name : c.locality,
      serviceAreaId: c.serviceAreaId,
      status: c.status,
      walletBalance: wallet?.balance || 0,
      subscriptionPlan: sub ? sub.planName : 'No Active Plan',
      subscriptionCreditsRemaining: sub ? sub.creditsRemaining : 0,
      subscriptionExpiresAt: sub ? sub.expiresAt : null,
      assignedRunnerId: c.assignedRunnerId || null,
      assignedRunnerName: runner ? runner.name : 'Unassigned',
      assignedRunnerPhone: runner ? runner.phone : null,
      createdAt: c.createdAt,
    };
  });

  return res.json({ customers: result });
});

// POST /customers/:id/assign-runner - Assign or change designated runner
router.post('/customers/:id/assign-runner', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { runnerId } = req.body;

  const users = db.get('users');
  const customer = users.find(u => u.id === id && u.role === 'customer');
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const runner = runnerId ? users.find(u => u.id === runnerId && u.role === 'runner') : null;

  customer.assignedRunnerId = runnerId || undefined;
  db.set('users', users);

  db.addAuditLog(admin.id, admin.name, 'admin', 'ASSIGN_DESIGNATED_RUNNER', 'customer', id, `Assigned runner ${runner ? runner.name : 'None'} to customer ${customer.name}`);

  return res.json({
    message: runner ? `Runner ${runner.name} assigned to ${customer.name}` : `Runner unassigned from ${customer.name}`,
    assignedRunner: runner ? { id: runner.id, name: runner.name, phone: runner.phone } : null,
  });
});

// GET /users - List all users across all roles
router.get('/users', (req: Request, res: Response) => {
  const users = db.get('users');
  const safeUsers = users.map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    phone: u.phone,
    email: u.email,
    address: u.address,
    locality: u.locality,
    status: u.status,
    createdAt: u.createdAt,
    assignedRunnerId: u.assignedRunnerId,
  }));
  return res.json({ users: safeUsers });
});

// POST /users/:id/status - Suspend or activate a user account
router.post('/users/:id/status', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active or suspended' });
  }

  const users = db.get('users');
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.id === admin.id) {
    return res.status(400).json({ error: 'Admin cannot suspend their own account' });
  }

  user.status = status;
  db.set('users', users);

  const action = status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER';
  db.addAuditLog(
    admin.id,
    admin.name,
    'admin',
    action,
    user.role,
    user.id,
    `${action}: ${user.name} (${user.role}). Reason: ${reason || 'Administrative action'}`
  );

  return res.json({
    message: `User ${user.name} has been set to ${status}.`,
    user: { id: user.id, name: user.name, status: user.status }
  });
});

// POST /users/:id/change-role - Change a user's role (customer, runner, admin)
router.post('/users/:id/change-role', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { newRole } = req.body;

  if (!['customer', 'runner', 'admin'].includes(newRole)) {
    return res.status(400).json({ error: 'Invalid role. Must be customer, runner, or admin.' });
  }

  const users = db.get('users');
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.id === admin.id && newRole !== 'admin') {
    return res.status(400).json({ error: 'Cannot demote the currently active administrator account.' });
  }

  const oldRole = user.role;
  user.role = newRole;
  db.set('users', users);

  // If newly runner, ensure profile exists
  if (newRole === 'runner') {
    const profiles = db.get('runnerProfiles');
    let profile = profiles.find(p => p.userId === user.id);
    if (!profile) {
      profile = {
        id: `prof_${Date.now()}`,
        userId: user.id,
        serviceAreaId: user.serviceAreaId || 'area_1',
        languages: ['Hindi', 'Marathi', 'English'],
        isApproved: true,
        isAvailable: true,
        activeOrderCount: 0,
        rating: 5.0,
        vehicleType: 'Two Wheeler',
        upiId: '8828822808@okaxis',
      };
      profiles.push(profile);
      db.set('runnerProfiles', profiles);
    }
  }

  // If newly customer, ensure wallet exists
  if (newRole === 'customer') {
    const wallets = db.get('wallets');
    let wallet = wallets.find(w => w.userId === user.id);
    if (!wallet) {
      wallets.push({
        id: `wal_${Date.now()}`,
        userId: user.id,
        balance: 0,
        updatedAt: new Date().toISOString(),
      });
      db.set('wallets', wallets);
    }
  }

  db.addAuditLog(
    admin.id,
    admin.name,
    'admin',
    'CHANGE_USER_ROLE',
    newRole,
    user.id,
    `Changed role of ${user.name} from ${oldRole} to ${newRole}`
  );

  return res.json({
    message: `Role of ${user.name} changed from ${oldRole} to ${newRole}.`,
    user: { id: user.id, name: user.name, role: user.role }
  });
});

// GET /subscriptions - List pending & all subscriptions
router.get('/subscriptions', (req: Request, res: Response) => {
  const subscriptions = db.get('userSubscriptions');
  const users = db.get('users');

  const result = subscriptions.map(s => {
    const u = users.find(usr => usr.id === s.userId);
    return {
      ...s,
      userName: u?.name || 'Customer',
      userPhone: u?.phone || '',
    };
  });

  return res.json({ subscriptions: result });
});

// POST /subscriptions/:id/verify - Verify and activate subscription
router.post('/subscriptions/:id/verify', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;

  const subscriptions = db.get('userSubscriptions');
  const subIndex = subscriptions.findIndex(s => s.id === id);
  if (subIndex === -1) {
    return res.status(404).json({ error: 'Subscription request not found' });
  }

  const sub = subscriptions[subIndex];
  sub.status = 'active';
  sub.verifiedAt = new Date().toISOString();

  // Reset validity start to now
  const now = new Date();
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  sub.startDate = now.toISOString();
  sub.expiresAt = expires.toISOString();

  subscriptions[subIndex] = sub;
  db.set('userSubscriptions', subscriptions);

  // Record in subscription ledger
  const subLedger = db.get('subscriptionLedger');
  const entry: SubscriptionLedgerEntry = {
    id: `sledg_${Date.now()}`,
    userId: sub.userId,
    subscriptionId: sub.id,
    changeAmount: sub.creditsTotal,
    reason: `Subscription payment verified by Admin (${sub.planName} plan: +${sub.creditsTotal} credits, valid 30 days)`,
    createdAt: new Date().toISOString(),
  };
  subLedger.push(entry);
  db.set('subscriptionLedger', subLedger);

  db.addAuditLog(admin.id, admin.name, 'admin', 'VERIFY_SUBSCRIPTION', 'subscription', sub.id, `Admin verified subscription payment for user ${sub.userId}. Activated ${sub.creditsTotal} credits.`);

  return res.json({ message: `Subscription activated! ${sub.creditsTotal} credits issued to customer.`, subscription: sub });
});

// GET /wallets/recharges - Pending & all recharges
router.get('/wallets/recharges', (req: Request, res: Response) => {
  const recharges = db.get('rechargeRequests').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ recharges });
});

// POST /wallets/recharges/:id/approve - Approve recharge & credit customer wallet atomically
router.post('/wallets/recharges/:id/approve', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;

  const recharges = db.get('rechargeRequests');
  const reqIndex = recharges.findIndex(r => r.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Recharge request not found' });
  }

  const recharge = recharges[reqIndex];
  if (recharge.status === 'approved') {
    return res.status(400).json({ error: 'Recharge request has already been approved' });
  }

  // Atomically credit wallet
  const wallets = db.get('wallets');
  let wallet = wallets.find(w => w.userId === recharge.userId);
  if (!wallet) {
    wallet = {
      id: `wal_${Date.now()}`,
      userId: recharge.userId,
      balance: 0,
      updatedAt: new Date().toISOString(),
    };
    wallets.push(wallet);
  }

  wallet.balance += recharge.amount;
  wallet.updatedAt = new Date().toISOString();
  db.set('wallets', wallets);

  // Record verified ledger entry
  const walletLedger = db.get('walletLedger');
  const ledgerEntry: WalletLedgerEntry = {
    id: `wledg_${Date.now()}`,
    walletId: wallet.id,
    userId: recharge.userId,
    type: 'credit',
    amount: recharge.amount,
    rechargeRequestId: recharge.id,
    status: 'approved',
    notes: `Wallet recharge verified by Admin (Ref: ${recharge.paymentReference || 'Bank Transfer'})`,
    createdAt: new Date().toISOString(),
  };
  walletLedger.push(ledgerEntry);
  db.set('walletLedger', walletLedger);

  recharge.status = 'approved';
  recharge.reviewedBy = admin.id;
  recharge.reviewedAt = new Date().toISOString();
  recharges[reqIndex] = recharge;
  db.set('rechargeRequests', recharges);

  db.addAuditLog(admin.id, admin.name, 'admin', 'APPROVE_WALLET_RECHARGE', 'wallet', recharge.id, `Admin approved wallet recharge of ₹${recharge.amount} for ${recharge.userName}. New balance: ₹${wallet.balance}`);

  return res.json({
    message: `Recharge of ₹${recharge.amount} approved! Customer wallet balance is now ₹${wallet.balance}.`,
    recharge,
    newBalance: wallet.balance,
  });
});

// POST /wallets/recharges/:id/reject
router.post('/wallets/recharges/:id/reject', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { reason } = req.body;

  const recharges = db.get('rechargeRequests');
  const reqIndex = recharges.findIndex(r => r.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Recharge request not found' });
  }

  const recharge = recharges[reqIndex];
  recharge.status = 'rejected';
  recharge.reviewedBy = admin.id;
  recharge.reviewedAt = new Date().toISOString();
  recharge.adminNote = reason || 'Payment not received or invalid transaction reference.';
  recharges[reqIndex] = recharge;
  db.set('rechargeRequests', recharges);

  db.addAuditLog(admin.id, admin.name, 'admin', 'REJECT_WALLET_RECHARGE', 'wallet', recharge.id, `Admin rejected recharge of ₹${recharge.amount} for ${recharge.userName}. Reason: ${recharge.adminNote}`);

  return res.json({ message: 'Recharge request rejected', recharge });
});

// POST /wallets/refund - Admin issues refund
router.post('/wallets/refund', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { customerId, amount, orderId, reason } = req.body;

  const refundAmount = Number(amount);
  if (isNaN(refundAmount) || refundAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid refund amount' });
  }
  if (!reason) {
    return res.status(400).json({ error: 'Mandatory reason required for issuing a refund.' });
  }

  const wallets = db.get('wallets');
  const wallet = wallets.find(w => w.userId === customerId);
  if (!wallet) {
    return res.status(404).json({ error: 'Customer wallet not found' });
  }

  wallet.balance += refundAmount;
  wallet.updatedAt = new Date().toISOString();
  db.set('wallets', wallets);

  const walletLedger = db.get('walletLedger');
  const refundEntry: WalletLedgerEntry = {
    id: `wledg_${Date.now()}`,
    walletId: wallet.id,
    userId: customerId,
    type: 'refund',
    amount: refundAmount,
    orderId,
    status: 'approved',
    notes: `Admin refund: ${reason}`,
    createdAt: new Date().toISOString(),
  };
  walletLedger.push(refundEntry);
  db.set('walletLedger', walletLedger);

  db.addAuditLog(admin.id, admin.name, 'admin', 'ISSUE_REFUND', 'wallet', wallet.id, `Admin issued refund of ₹${refundAmount} to customer ${customerId}. Reason: ${reason}`);

  return res.json({ message: `Refund of ₹${refundAmount} credited to customer wallet.`, newBalance: wallet.balance });
});

// GET /orders - All orders with filters
router.get('/orders', (req: Request, res: Response) => {
  const { status } = req.query;
  let orders = db.get('orders');
  if (status && status !== 'all') {
    orders = orders.filter(o => o.status === status);
  }
  return res.json({ orders: orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
});

// POST /orders/:id/override-status
router.post('/orders/:id/override-status', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { status, reason } = req.body;

  const orders = db.get('orders');
  const orderIndex = orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIndex];
  const oldStatus = order.status;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  orders[orderIndex] = order;
  db.set('orders', orders);

  db.addAuditLog(admin.id, admin.name, 'admin', 'OVERRIDE_ORDER_STATUS', 'order', id, `Admin changed order #${order.orderNumber} status from ${oldStatus} to ${status}. Reason: ${reason || 'Administrative intervention'}`);

  return res.json({ message: `Order #${order.orderNumber} status updated to ${status}`, order });
});

// GET /audit-logs
router.get('/audit-logs', (req: Request, res: Response) => {
  const logs = db.get('auditLogs');
  return res.json({ logs });
});

// GET /settings & POST /settings
router.get('/settings', (req: Request, res: Response) => {
  const settings = db.get('settings');
  return res.json({ settings });
});

router.post('/settings', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { upiId, supportPhone, supportEmail, allowMultiRunnerSelection, requireDeliveryOtp } = req.body;

  const settings = db.get('settings');
  if (upiId) settings.upiId = upiId;
  if (supportPhone) settings.supportPhone = supportPhone;
  if (supportEmail) settings.supportEmail = supportEmail;
  if (typeof allowMultiRunnerSelection === 'boolean') settings.allowMultiRunnerSelection = allowMultiRunnerSelection;
  if (typeof requireDeliveryOtp === 'boolean') settings.requireDeliveryOtp = requireDeliveryOtp;

  db.set('settings', settings);
  db.addAuditLog(admin.id, admin.name, 'admin', 'UPDATE_SETTINGS', 'system', 'settings', 'Updated platform configuration settings');

  return res.json({ message: 'Platform settings updated successfully', settings });
});

// GET /service-areas & POST /service-areas
router.get('/service-areas', (req: Request, res: Response) => {
  const areas = db.get('serviceAreas');
  const runners = db.get('users').filter(u => u.role === 'runner');
  const customers = db.get('users').filter(u => u.role === 'customer');

  const result = areas.map(a => ({
    ...a,
    runnerCount: runners.filter(r => r.serviceAreaId === a.id).length,
    customerCount: customers.filter(c => c.serviceAreaId === a.id).length,
  }));

  return res.json({ areas: result });
});

router.post('/service-areas', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { name, city, pincode, isActive } = req.body;

  if (!name || !city) {
    return res.status(400).json({ error: 'Name and city are required' });
  }

  const areas = db.get('serviceAreas');
  const newArea: ServiceArea = {
    id: `area_${Date.now()}`,
    name,
    city,
    pincode: pincode || '',
    isActive: isActive ?? true,
  };

  areas.push(newArea);
  db.set('serviceAreas', areas);

  db.addAuditLog(admin.id, admin.name, 'admin', 'CREATE_SERVICE_AREA', 'system', newArea.id, `Created service area: ${name}, ${city}`);

  return res.status(201).json({ message: 'Service area created', area: newArea });
});

// GET /plans & POST /plans
router.get('/plans', (req: Request, res: Response) => {
  const plans = db.get('subscriptionPlans');
  return res.json({ plans });
});

router.post('/plans/:id', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { price, credits, validityDays, isActive, description } = req.body;

  const plans = db.get('subscriptionPlans');
  const planIndex = plans.findIndex(p => p.id === id);
  if (planIndex === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const plan = plans[planIndex];
  if (price !== undefined) plan.price = Number(price);
  if (credits !== undefined) plan.credits = Number(credits);
  if (validityDays !== undefined) plan.validityDays = Number(validityDays);
  if (isActive !== undefined) plan.isActive = Boolean(isActive);
  if (description !== undefined) plan.description = description;

  plans[planIndex] = plan;
  db.set('subscriptionPlans', plans);

  db.addAuditLog(admin.id, admin.name, 'admin', 'UPDATE_PLAN', 'subscription', id, `Updated subscription plan ${plan.name}: ₹${plan.price}, ${plan.credits} credits`);

  return res.json({ message: `Plan ${plan.name} updated successfully`, plan });
});

// GET /support-tickets & POST /support-tickets/:id/resolve
router.get('/support-tickets', (req: Request, res: Response) => {
  const tickets = db.get('supportTickets').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ tickets });
});

router.post('/support-tickets/:id/resolve', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { adminNotes, status } = req.body;

  const tickets = db.get('supportTickets');
  const tktIndex = tickets.findIndex(t => t.id === id);
  if (tktIndex === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  tickets[tktIndex].status = status || 'resolved';
  if (adminNotes) tickets[tktIndex].adminNotes = adminNotes;
  tickets[tktIndex].updatedAt = new Date().toISOString();

  db.set('supportTickets', tickets);

  return res.json({ message: 'Support ticket updated', ticket: tickets[tktIndex] });
});

// GET /payments/summary - Dedicated Admin Payments Section
router.get('/payments/summary', (req: Request, res: Response) => {
  const subscriptions = db.get('userSubscriptions');
  const plans = db.get('subscriptionPlans');
  const recharges = db.get('rechargeRequests');
  const walletLedger = db.get('walletLedger');
  const orders = db.get('orders');
  const settings = db.get('settings');

  // 1. Subscription Revenue: gross subscription collections
  const verifiedSubs = subscriptions.filter(s => s.status === 'active' || s.verifiedAt);
  const grossSubscriptionRevenue = verifiedSubs.reduce((acc, s) => {
    const plan = plans.find(p => p.id === s.planId);
    return acc + (plan?.price || 0);
  }, 0);

  // 2. Gross Wallet Deposits (approved recharges)
  const approvedRecharges = recharges.filter(r => r.status === 'approved');
  const grossWalletDeposits = approvedRecharges.reduce((acc, r) => acc + (r.amount || 0), 0);

  // 3. Amount Paid to Shops by Runners
  const completedOrders = orders.filter(o => o.status === 'completed' || o.amountPaidToShop);
  const totalAmountPaidToShops = completedOrders.reduce((acc, o) => acc + (o.amountPaidToShop || o.totalActualPrice || 0), 0);

  // 4. Amount Charged to Customer Wallets
  const debitEntries = walletLedger.filter(l => l.type === 'debit' && l.status === 'approved');
  const totalAmountChargedToCustomers = debitEntries.reduce((acc, l) => acc + (l.amount || 0), 0);

  // 5. Runner Earnings / Commissions
  const totalRunnerCommissions = completedOrders.reduce((acc, o) => acc + (o.runnerCommission || settings.runnerCommissionPerDelivery || 35), 0);

  // 6. Refunds
  const refundEntries = walletLedger.filter(l => l.type === 'refund' && l.status === 'approved');
  const totalRefunds = refundEntries.reduce((acc, l) => acc + (l.amount || 0), 0);

  // Pending queues
  const pendingRecharges = recharges.filter(r => r.status === 'pending');
  const pendingSubscriptions = subscriptions.filter(s => s.status === 'pending_verification');
  const pendingDebitOrders = orders.filter(o => o.status === 'purchase_recorded' && !o.walletDebited);

  return res.json({
    accountingSummary: {
      grossSubscriptionRevenue,
      grossWalletDeposits,
      totalAmountPaidToShops,
      totalAmountChargedToCustomers,
      totalRunnerCommissions,
      totalRefunds,
    },
    pendingRecharges,
    pendingSubscriptions,
    pendingDebitOrders,
    recentWalletTransactions: walletLedger.slice(0, 20),
  });
});

// GET /reports - Reports and Analytics
router.get('/reports', (req: Request, res: Response) => {
  const orders = db.get('orders');
  const subscriptions = db.get('userSubscriptions');
  const subLedger = db.get('subscriptionLedger');
  const walletLedger = db.get('walletLedger');
  const areas = db.get('serviceAreas');
  const users = db.get('users');
  const settings = db.get('settings');

  // Orders status distribution
  const statusCounts: Record<string, number> = {};
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }

  // Credits metrics
  const creditsIssued = subLedger.filter(l => l.changeAmount > 0).reduce((acc, l) => acc + l.changeAmount, 0);
  const creditsConsumed = subLedger.filter(l => l.changeAmount < 0).reduce((acc, l) => acc + Math.abs(l.changeAmount), 0);
  const creditsExpired = subscriptions.filter(s => s.status === 'expired').reduce((acc, s) => acc + (s.creditsRemaining || 0), 0);

  // Financial collections
  const walletRechargesTotal = walletLedger.filter(l => l.type === 'credit' && l.status === 'approved').reduce((acc, l) => acc + l.amount, 0);
  const walletDebitsTotal = walletLedger.filter(l => l.type === 'debit' && l.status === 'approved').reduce((acc, l) => acc + l.amount, 0);
  const refundsTotal = walletLedger.filter(l => l.type === 'refund' && l.status === 'approved').reduce((acc, l) => acc + l.amount, 0);

  // Area performance
  const areaPerformance = areas.map(a => {
    const areaUsers = users.filter(u => u.serviceAreaId === a.id);
    const customerIds = areaUsers.filter(u => u.role === 'customer').map(u => u.id);
    const areaOrders = orders.filter(o => customerIds.includes(o.customerId));
    return {
      areaName: a.name,
      city: a.city,
      customerCount: customerIds.length,
      ordersCount: areaOrders.length,
      completedCount: areaOrders.filter(o => o.status === 'completed').length,
    };
  });

  return res.json({
    statusCounts,
    credits: {
      creditsIssued,
      creditsConsumed,
      creditsExpired,
      activeCreditsRemaining: subscriptions.filter(s => s.status === 'active').reduce((acc, s) => acc + s.creditsRemaining, 0),
    },
    financials: {
      walletRechargesTotal,
      walletDebitsTotal,
      refundsTotal,
      runnerCommissionPerDelivery: settings.runnerCommissionPerDelivery || 35,
    },
    areaPerformance,
  });
});

// GET /reports/export-csv - Real CSV Export
router.get('/reports/export-csv', (req: Request, res: Response) => {
  const { type } = req.query;
  const orders = db.get('orders');
  const walletLedger = db.get('walletLedger');

  let csvContent = '';
  let filename = 'mpartner-export.csv';

  if (type === 'orders') {
    filename = 'mpartner-orders.csv';
    csvContent = 'Order ID,Order Number,Customer Name,Runner Name,Status,Total Amount,Created At\n';
    orders.forEach(o => {
      csvContent += `"${o.id}","${o.orderNumber}","${o.customerName}","${o.runnerName || 'None'}","${o.status}",${o.totalActualPrice || o.totalEstimatedPrice || 0},"${o.createdAt}"\n`;
    });
  } else {
    filename = 'mpartner-financial-ledger.csv';
    csvContent = 'Ledger ID,User ID,Type,Amount (INR),Order ID,Status,Notes,Created At\n';
    walletLedger.forEach(l => {
      csvContent += `"${l.id}","${l.userId}","${l.type}",${l.amount},"${l.orderId || ''}","${l.status}","${l.notes.replace(/"/g, '""')}","${l.createdAt}"\n`;
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csvContent);
});

// Moderation Queue
router.get('/moderation/reports', (req: Request, res: Response) => {
  const reports = db.get('contentReports');
  const logs = db.get('moderationLogs');
  return res.json({ reports, logs });
});

router.post('/moderation/reports/:id/resolve', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { action, adminNotes } = req.body; // 'warn', 'restrict', 'suspend_account', 'dismiss'

  const reports = db.get('contentReports');
  const repIndex = reports.findIndex(r => r.id === id);
  if (repIndex === -1) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const report = reports[repIndex];
  report.status = action === 'dismiss' ? 'dismissed' : 'action_taken';
  if (adminNotes) report.adminNotes = adminNotes;
  reports[repIndex] = report;
  db.set('contentReports', reports);

  // If suspend account requested:
  if (action === 'suspend_account' && report.reportedUserId) {
    const users = db.get('users');
    const user = users.find(u => u.id === report.reportedUserId);
    if (user) {
      user.status = 'suspended';
      db.set('users', users);
      db.addAuditLog(admin.id, admin.name, 'admin', 'SUSPEND_USER', 'moderation', user.id, `Suspended user ${user.name} following reported content review`);
    }
  }

  db.addAuditLog(admin.id, admin.name, 'admin', 'RESOLVE_CONTENT_REPORT', 'moderation', id, `Resolved report: action ${action}. Notes: ${adminNotes || 'None'}`);

  return res.json({ message: `Content report ${report.status}`, report });
});

// POST /customers/:id/toggle-status - Suspend or reactivate account
router.post('/customers/:id/toggle-status', (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { id } = req.params;

  const users = db.get('users');
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = user.status === 'active' ? 'suspended' : 'active';
  db.set('users', users);

  db.addAuditLog(admin.id, admin.name, 'admin', 'TOGGLE_USER_STATUS', 'customer', id, `Changed ${user.name} status to ${user.status}`);

  return res.json({ message: `Customer status changed to ${user.status}`, user });
});

export default router;
