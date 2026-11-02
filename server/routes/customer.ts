import { Router, Request, Response } from 'express';
import { db, Order, OrderItem, RechargeRequest, WalletLedgerEntry, UserSubscription, SubscriptionLedgerEntry, SupportTicket } from '../db.ts';
import { authenticateUser } from './auth.ts';

const router = Router();

// Middleware to ensure user is customer
function requireCustomer(req: Request, res: Response, next: () => void) {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.role !== 'customer') {
    return res.status(403).json({ error: 'Customer access only' });
  }
  (req as any).user = user;
  next();
}

router.use(requireCustomer);

// GET /overview
router.get('/overview', (req: Request, res: Response) => {
  const user = (req as any).user;
  const wallets = db.get('wallets');
  const wallet = wallets.find(w => w.userId === user.id) || { balance: 0, id: 'unknown' };

  const subscriptions = db.get('userSubscriptions');
  const activeSub = subscriptions.find(s => s.userId === user.id && s.status === 'active');

  const orders = db.get('orders').filter(o => o.customerId === user.id);
  const activeOrder = orders.find(o => !['completed', 'cancelled', 'rejected'].includes(o.status));

  const allRunners = db.get('users');
  const assignedRunner = user.assignedRunnerId ? allRunners.find(u => u.id === user.assignedRunnerId) : null;
  const runnerProfiles = db.get('runnerProfiles');
  const runnerProfile = assignedRunner ? runnerProfiles.find(p => p.userId === assignedRunner.id) : null;

  const settings = db.get('settings');
  const alerts: Array<{ id: string; type: 'warning' | 'info'; title: string; message: string; actionTab?: string }> = [];

  if (wallet.balance < (settings.lowBalanceThreshold || 100)) {
    alerts.push({
      id: 'low_balance',
      type: 'warning',
      title: 'Low Wallet Balance',
      message: `Your wallet balance is ₹${wallet.balance}. Add funds so your Runner can purchase requested products.`,
      actionTab: 'wallet',
    });
  }

  if (activeSub) {
    if (activeSub.creditsRemaining <= (settings.lowCreditsThreshold || 3)) {
      alerts.push({
        id: 'low_credits',
        type: 'warning',
        title: 'Low Remaining Credits',
        message: `You have only ${activeSub.creditsRemaining} order credit(s) remaining in your ${activeSub.planName} plan.`,
        actionTab: 'subscription',
      });
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math.ceil((new Date(activeSub.expiresAt).getTime() - Date.now()) / msPerDay);
    if (daysLeft <= (settings.subscriptionWarningDays || 3) && daysLeft > 0) {
      alerts.push({
        id: 'expiring_sub',
        type: 'warning',
        title: 'Subscription Expiring Soon',
        message: `Your subscription expires in ${daysLeft} day(s) on ${new Date(activeSub.expiresAt).toLocaleDateString()}. Unused credits expire and do not carry forward.`,
        actionTab: 'subscription',
      });
    }
  }

  if (activeOrder?.status === 'price_confirmation_pending') {
    alerts.push({
      id: 'price_pending',
      type: 'warning',
      title: 'Price Confirmation Required',
      message: `Your Runner submitted an itemized bill of ₹${activeOrder.totalActualPrice || activeOrder.totalEstimatedPrice}. Please confirm to proceed.`,
      actionTab: 'overview',
    });
  }

  if (activeOrder?.status === 'delivered_pending_completion') {
    alerts.push({
      id: 'delivered_pending',
      type: 'info',
      title: 'Order Delivered — Awaiting Completion',
      message: `Your Runner has arrived at your doorstep. Please share your OTP (${activeOrder.deliveryOtp}) or confirm delivery receipt.`,
      actionTab: 'overview',
    });
  }

  const userNotifications = db.get('notifications')
    .filter(n => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    walletBalance: wallet.balance,
    subscription: activeSub || null,
    activeOrder: activeOrder || null,
    alerts,
    notifications: userNotifications.slice(0, 10),
    unreadNotificationsCount: userNotifications.filter(n => !n.isRead).length,
    assignedRunner: assignedRunner ? {
      id: assignedRunner.id,
      name: assignedRunner.name,
      phone: assignedRunner.phone,
      rating: runnerProfile?.rating || 4.9,
      isAvailable: runnerProfile?.isAvailable ?? true,
      vehicleType: runnerProfile?.vehicleType || 'Two Wheeler',
    } : null,
    totalOrdersCount: orders.length,
    completedOrdersCount: orders.filter(o => o.status === 'completed').length,
  });
});

// Notifications API
router.get('/notifications', (req: Request, res: Response) => {
  const user = (req as any).user;
  const notifications = db.get('notifications')
    .filter(n => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ notifications });
});

router.post('/notifications/:id/read', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const notifications = db.get('notifications');
  const notif = notifications.find(n => n.id === id && n.userId === user.id);
  if (notif) {
    notif.isRead = true;
    db.set('notifications', notifications);
  }
  return res.json({ success: true });
});

router.post('/notifications/mark-all-read', (req: Request, res: Response) => {
  const user = (req as any).user;
  const notifications = db.get('notifications');
  for (const n of notifications) {
    if (n.userId === user.id) n.isRead = true;
  }
  db.set('notifications', notifications);
  return res.json({ success: true });
});

// GET /wallet
router.get('/wallet', (req: Request, res: Response) => {
  const user = (req as any).user;
  const wallets = db.get('wallets');
  const wallet = wallets.find(w => w.userId === user.id) || { id: 'wal_new', userId: user.id, balance: 0, updatedAt: new Date().toISOString() };

  const ledger = db.get('walletLedger').filter(l => l.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const rechargeRequests = db.get('rechargeRequests').filter(r => r.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const settings = db.get('settings');

  return res.json({
    wallet,
    ledger,
    rechargeRequests,
    upiId: settings.upiId,
    supportPhone: settings.supportPhone,
  });
});

// POST /wallet/recharge - Request wallet recharge
router.post('/wallet/recharge', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { amount, paymentReference, paymentMethod, paymentProofUrl } = req.body;

  const rechargeAmount = Number(amount);
  if (isNaN(rechargeAmount) || rechargeAmount < 50) {
    return res.status(400).json({ error: 'Minimum recharge amount is ₹50' });
  }

  const rechargeRequests = db.get('rechargeRequests');
  const newRequest: RechargeRequest = {
    id: `rech_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    amount: rechargeAmount,
    paymentReference: paymentReference || `UPI-${Date.now().toString().slice(-6)}`,
    paymentMethod: paymentMethod || 'UPI Transfer',
    paymentProofUrl: paymentProofUrl || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  rechargeRequests.unshift(newRequest);
  db.set('rechargeRequests', rechargeRequests);

  db.addAuditLog(user.id, user.name, 'customer', 'REQUEST_WALLET_RECHARGE', 'wallet', newRequest.id, `Requested wallet recharge of ₹${rechargeAmount}. Pending Admin verification.`);

  return res.status(201).json({
    message: 'Recharge request submitted successfully. Admin will verify receipt and credit your wallet.',
    request: newRequest,
  });
});

// GET /subscription
router.get('/subscription', (req: Request, res: Response) => {
  const user = (req as any).user;
  const plans = db.get('subscriptionPlans').filter(p => p.isActive);
  const userSubs = db.get('userSubscriptions').filter(s => s.userId === user.id).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const activeSub = userSubs.find(s => s.status === 'active');
  const ledger = db.get('subscriptionLedger').filter(l => l.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const settings = db.get('settings');

  return res.json({
    activeSubscription: activeSub || null,
    allSubscriptions: userSubs,
    plans,
    ledger,
    upiId: settings.upiId,
  });
});

// POST /subscription/purchase - Submit subscription purchase request
router.post('/subscription/purchase', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { planId, paymentReference } = req.body;

  const plans = db.get('subscriptionPlans');
  const plan = plans.find(p => p.id === planId && p.isActive);
  if (!plan) {
    return res.status(404).json({ error: 'Subscription plan not found or inactive' });
  }

  const subscriptions = db.get('userSubscriptions');
  // Check if already has active subscription with remaining credits
  const existingActive = subscriptions.find(s => s.userId === user.id && s.status === 'active');
  if (existingActive && existingActive.creditsRemaining > 0 && new Date(existingActive.expiresAt).getTime() > Date.now()) {
    return res.status(400).json({ error: `You already have an active subscription with ${existingActive.creditsRemaining} credits remaining until ${new Date(existingActive.expiresAt).toLocaleDateString()}.` });
  }

  const now = new Date();
  const expires = new Date();
  expires.setDate(expires.getDate() + plan.validityDays);

  const newSubId = `sub_${Date.now()}`;
  const newSub: UserSubscription = {
    id: newSubId,
    userId: user.id,
    planId: plan.id,
    planName: plan.name,
    status: 'pending_verification', // requires admin payment confirmation
    creditsTotal: plan.credits,
    creditsRemaining: plan.credits,
    startDate: now.toISOString(),
    expiresAt: expires.toISOString(),
    paymentRef: paymentReference || `SUB-UPI-${Date.now().toString().slice(-6)}`,
  };

  subscriptions.unshift(newSub);
  db.set('userSubscriptions', subscriptions);

  db.addAuditLog(user.id, user.name, 'customer', 'SUBMIT_SUBSCRIPTION_PURCHASE', 'subscription', newSubId, `Submitted ${plan.name} plan purchase (₹${plan.price}, ${plan.credits} credits). Awaiting Admin verification.`);

  return res.status(201).json({
    message: 'Subscription purchase submitted! Admin will verify payment and activate your order credits.',
    subscription: newSub,
  });
});

// GET /orders
router.get('/orders', (req: Request, res: Response) => {
  const user = (req as any).user;
  const orders = db.get('orders').filter(o => o.customerId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ orders });
});

// GET /orders/:id
router.get('/orders/:id', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const order = db.get('orders').find(o => o.id === id && o.customerId === user.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  return res.json({ order });
});

// POST /orders/create
router.post('/orders/create', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { items, deliveryAddress, notes, preferredDeliveryTime } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Please add at least one item to order' });
  }

  // Check active subscription
  const subscriptions = db.get('userSubscriptions');
  const activeSub = subscriptions.find(s => s.userId === user.id && s.status === 'active');

  if (!activeSub) {
    return res.status(403).json({ error: 'An active subscription is required to place an order. Please subscribe to a plan in the Subscription section.' });
  }

  if (activeSub.creditsRemaining <= 0) {
    return res.status(403).json({ error: 'Your subscription order credits have been exhausted (0 credits remaining). Please renew your subscription to place orders.' });
  }

  if (new Date(activeSub.expiresAt).getTime() < Date.now()) {
    activeSub.status = 'expired';
    db.set('userSubscriptions', subscriptions);
    return res.status(403).json({ error: 'Your subscription has expired. Please renew your plan.' });
  }

  // Format order items
  const formattedItems: OrderItem[] = items.map((itm: any, idx: number) => ({
    id: `itm_${Date.now()}_${idx}`,
    name: itm.name || 'Unnamed item',
    quantity: Number(itm.quantity) || 1,
    unit: itm.unit || 'piece',
    brandPreference: itm.brandPreference || '',
    notes: itm.notes || '',
    unitPrice: 0,
    estimatedPrice: 0,
    isAvailable: true,
  }));

  const orderNumber = `MP-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderId = `ord_${Date.now()}`;
  const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

  const allUsers = db.get('users');
  const runnerUser = user.assignedRunnerId ? allUsers.find(u => u.id === user.assignedRunnerId) : null;

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    customerId: user.id,
    customerName: user.name,
    customerPhone: user.phone,
    deliveryAddress: deliveryAddress || user.address || 'Address provided on profile',
    runnerId: runnerUser ? runnerUser.id : undefined,
    runnerName: runnerUser ? runnerUser.name : undefined,
    runnerPhone: runnerUser ? runnerUser.phone : undefined,
    items: formattedItems,
    status: runnerUser ? 'runner_assigned' : 'order_placed',
    notes: notes || '',
    preferredDeliveryTime: preferredDeliveryTime || 'As soon as possible',
    deliveryOtp,
    creditDeducted: false,
    walletDebited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const orders = db.get('orders');
  orders.unshift(newOrder);
  db.set('orders', orders);

  db.addAuditLog(user.id, user.name, 'customer', 'CREATE_ORDER', 'order', orderId, `Customer placed order #${orderNumber} with ${formattedItems.length} items.`);

  return res.status(201).json({
    message: `Order #${orderNumber} placed successfully! Your designated Runner has been notified.`,
    order: newOrder,
  });
});

// POST /orders/:id/confirm-price
router.post('/orders/:id/confirm-price', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { approved, rejectionReason } = req.body;

  const orders = db.get('orders');
  const orderIndex = orders.findIndex(o => o.id === id && o.customerId === user.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIndex];

  if (order.status !== 'price_confirmation_pending') {
    return res.status(400).json({ error: `Cannot confirm price in current status (${order.status}).` });
  }

  if (approved) {
    order.status = 'price_confirmed';
    order.updatedAt = new Date().toISOString();
    orders[orderIndex] = order;
    db.set('orders', orders);

    db.addAuditLog(user.id, user.name, 'customer', 'CONFIRM_PRICE_APPROVED', 'order', order.id, `Customer confirmed price of ₹${order.totalActualPrice || order.totalEstimatedPrice} for order #${order.orderNumber}`);

    return res.json({ message: 'Price confirmed! Runner is proceeding to purchase.', order });
  } else {
    order.status = 'cancelled';
    order.cancellationReason = rejectionReason || 'Customer rejected proposed prices/substitutions.';
    order.updatedAt = new Date().toISOString();
    orders[orderIndex] = order;
    db.set('orders', orders);

    db.addAuditLog(user.id, user.name, 'customer', 'CONFIRM_PRICE_REJECTED', 'order', order.id, `Customer rejected price for order #${order.orderNumber}. Order cancelled.`);

    return res.json({ message: 'Price rejected. Order has been cancelled.', order });
  }
});

// POST /orders/:id/confirm-delivery - Complete order & consume exactly 1 subscription credit
router.post('/orders/:id/confirm-delivery', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;

  const orders = db.get('orders');
  const orderIndex = orders.findIndex(o => o.id === id && o.customerId === user.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIndex];
  if (order.status === 'completed') {
    return res.status(400).json({ error: 'Order has already been marked as completed.' });
  }

  // Atomic subscription credit consumption: consume exactly 1 credit once
  if (!order.creditDeducted) {
    const subscriptions = db.get('userSubscriptions');
    const activeSub = subscriptions.find(s => s.userId === user.id && s.status === 'active');

    if (activeSub && activeSub.creditsRemaining > 0) {
      activeSub.creditsRemaining -= 1;
      if (activeSub.creditsRemaining === 0) {
        activeSub.status = 'exhausted';
      }
      db.set('userSubscriptions', subscriptions);

      // Record in subscription ledger
      const subLedger = db.get('subscriptionLedger');
      const entry: SubscriptionLedgerEntry = {
        id: `sledg_${Date.now()}`,
        userId: user.id,
        subscriptionId: activeSub.id,
        orderId: order.id,
        changeAmount: -1,
        reason: `Credit consumed for completed delivery order #${order.orderNumber}`,
        createdAt: new Date().toISOString(),
      };
      subLedger.push(entry);
      db.set('subscriptionLedger', subLedger);

      order.creditDeducted = true;
    }
  }

  // Check product cost wallet debit: debit from wallet if not yet debited and actual cost > 0
  const actualCost = order.totalActualPrice || order.totalEstimatedPrice || 0;
  if (actualCost > 0 && !order.walletDebited) {
    const wallets = db.get('wallets');
    const wallet = wallets.find(w => w.userId === user.id);
    if (wallet) {
      wallet.balance -= actualCost;
      wallet.updatedAt = new Date().toISOString();
      db.set('wallets', wallets);

      const walletLedger = db.get('walletLedger');
      const debitEntry: WalletLedgerEntry = {
        id: `wledg_${Date.now()}`,
        walletId: wallet.id,
        userId: user.id,
        type: 'debit',
        amount: actualCost,
        orderId: order.id,
        status: 'approved',
        notes: `Product cost for order #${order.orderNumber} (${order.shopName || 'Local Shop'})`,
        createdAt: new Date().toISOString(),
      };
      walletLedger.push(debitEntry);
      db.set('walletLedger', walletLedger);

      order.walletDebited = true;
    }
  }

  order.status = 'completed';
  order.updatedAt = new Date().toISOString();
  orders[orderIndex] = order;
  db.set('orders', orders);

  db.addAuditLog(user.id, user.name, 'customer', 'COMPLETE_ORDER', 'order', order.id, `Order #${order.orderNumber} successfully completed. 1 subscription credit consumed.`);

  return res.json({
    message: 'Delivery confirmed! Thank you for using M-PARTNER.',
    order,
  });
});

// POST /orders/:id/cancel
router.post('/orders/:id/cancel', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { reason } = req.body;

  const orders = db.get('orders');
  const orderIndex = orders.findIndex(o => o.id === id && o.customerId === user.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIndex];
  if (['shopping_in_progress', 'purchase_recorded', 'out_for_delivery', 'delivered_pending_completion', 'completed'].includes(order.status)) {
    return res.status(400).json({ error: 'Cannot cancel order once shopping or delivery has commenced. Please contact your Runner or Admin support.' });
  }

  order.status = 'cancelled';
  order.cancellationReason = reason || 'Cancelled by customer';
  order.updatedAt = new Date().toISOString();
  orders[orderIndex] = order;
  db.set('orders', orders);

  db.addAuditLog(user.id, user.name, 'customer', 'CANCEL_ORDER', 'order', order.id, `Order #${order.orderNumber} cancelled by customer. Reason: ${order.cancellationReason}`);

  return res.json({ message: 'Order has been cancelled.', order });
});

// Support tickets
router.post('/support', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { category, subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  const tickets = db.get('supportTickets');
  const newTicket: SupportTicket = {
    id: `tkt_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: 'customer',
    category: category || 'general',
    subject,
    message,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tickets.unshift(newTicket);
  db.set('supportTickets', tickets);

  return res.status(201).json({ message: 'Support ticket submitted. Our operations team will respond promptly.', ticket: newTicket });
});

router.get('/support', (req: Request, res: Response) => {
  const user = (req as any).user;
  const tickets = db.get('supportTickets').filter(t => t.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ tickets });
});

export default router;
