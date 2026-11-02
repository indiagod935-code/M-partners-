import { Router, Request, Response } from 'express';
import { db, Order, OrderItem, SubscriptionLedgerEntry, WalletLedgerEntry } from '../db.ts';
import { authenticateUser } from './auth.ts';

const router = Router();

function requireRunner(req: Request, res: Response, next: () => void) {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.role !== 'runner') {
    return res.status(403).json({ error: 'Runner access only' });
  }
  (req as any).user = user;
  next();
}

router.use(requireRunner);

// GET /overview
router.get('/overview', (req: Request, res: Response) => {
  const user = (req as any).user;
  const profiles = db.get('runnerProfiles');
  const profile = profiles.find(p => p.userId === user.id);

  const allUsers = db.get('users');
  const assignedCustomers = allUsers.filter(u => u.role === 'customer' && u.assignedRunnerId === user.id);

  const orders = db.get('orders').filter(o => o.runnerId === user.id);
  const activeOrders = orders.filter(o => !['completed', 'cancelled', 'rejected'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed');

  return res.json({
    runner: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      status: user.status,
      profile: profile || null,
    },
    assignedCustomersCount: assignedCustomers.length,
    activeOrders,
    completedOrdersCount: completedOrders.length,
    totalEarningsEstimate: completedOrders.length * 15, // Commission per delivery
  });
});

// GET /customers - List assigned customers
router.get('/customers', (req: Request, res: Response) => {
  const user = (req as any).user;
  const allUsers = db.get('users');
  const assignedCustomers = allUsers.filter(u => u.role === 'customer' && u.assignedRunnerId === user.id);

  const orders = db.get('orders');
  const customerList = assignedCustomers.map(c => {
    const custOrders = orders.filter(o => o.customerId === c.id);
    const activeOrder = custOrders.find(o => !['completed', 'cancelled', 'rejected'].includes(o.status));
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      building: c.building,
      locality: c.locality,
      landmark: c.landmark,
      language: c.language,
      totalOrders: custOrders.length,
      hasActiveOrder: !!activeOrder,
      activeOrderNumber: activeOrder?.orderNumber,
    };
  });

  return res.json({ customers: customerList });
});

// POST /availability - Toggle availability
router.post('/availability', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { isAvailable } = req.body;

  const profiles = db.get('runnerProfiles');
  const profileIndex = profiles.findIndex(p => p.userId === user.id);
  if (profileIndex === -1) {
    return res.status(404).json({ error: 'Runner profile not found' });
  }

  profiles[profileIndex].isAvailable = Boolean(isAvailable);
  db.set('runnerProfiles', profiles);

  return res.json({
    message: `Availability updated to ${isAvailable ? 'Online' : 'Offline'}`,
    isAvailable: profiles[profileIndex].isAvailable,
  });
});

// GET /orders - Get assigned orders
router.get('/orders', (req: Request, res: Response) => {
  const user = (req as any).user;
  const orders = db.get('orders')
    .filter(o => o.runnerId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ orders });
});

// POST /orders/:id/accept
router.post('/orders/:id/accept', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;

  const orders = db.get('orders');
  const orderIndex = orders.findIndex(o => o.id === id && o.runnerId === user.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found or not assigned to you' });
  }

  const order = orders[orderIndex];
  if (!['order_placed', 'runner_assigned'].includes(order.status)) {
    return res.status(400).json({ error: `Cannot accept order in status ${order.status}` });
  }

  order.status = 'order_accepted';
  order.updatedAt = new Date().toISOString();
  orders[orderIndex] = order;
  db.set('orders', orders);

  db.addAuditLog(user.id, user.name, 'runner', 'ACCEPT_ORDER', 'order', order.id, `Runner accepted order #${order.orderNumber}`);
  db.addNotification(order.customerId, 'order_accepted', 'Order Accepted', `Your Runner ${user.name} has accepted order #${order.orderNumber}.`, '/orders');

  return res.json({ message: 'Order accepted! You can now start shopping or verify prices.', order });
});

// POST /orders/:id/reject
router.post('/orders/:id/reject', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { reason } = req.body;

  const orders = db.get('orders');
  const orderIndex = orders.findIndex(o => o.id === id && o.runnerId === user.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIndex];
  order.status = 'rejected';
  order.cancellationReason = reason || 'Runner currently unavailable for delivery in this slot';
  order.updatedAt = new Date().toISOString();
  orders[orderIndex] = order;
  db.set('orders', orders);

  db.addAuditLog(user.id, user.name, 'runner', 'REJECT_ORDER', 'order', order.id, `Runner rejected order #${order.orderNumber}. Reason: ${order.cancellationReason}`);
  db.addNotification(order.customerId, 'order_status', 'Order Update', `Runner could not accept order #${order.orderNumber}: ${order.cancellationReason}. Admin has been notified for reassignment.`, '/orders');

  return res.json({ message: 'Order rejected. Customer will be notified.', order });
});

// POST /orders/:id/start-shopping
router.post('/orders/:id/start-shopping', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;

  const orders = db.get('orders');
  const orderIndex = orders.findIndex(o => o.id === id && o.runnerId === user.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIndex];
  order.status = 'shopping_in_progress';
  order.updatedAt = new Date().toISOString();
  orders[orderIndex] = order;
  db.set('orders', orders);

  db.addAuditLog(user.id, user.name, 'runner', 'START_SHOPPING', 'order', order.id, `Runner started shopping for order #${order.orderNumber}`);
  db.addNotification(order.customerId, 'order_status', 'Runner Shopping', `Your Runner ${user.name} has started shopping for your items.`, '/orders');

  return res.json({ message: 'Shopping in progress. Customer is informed.', order });
});

// POST /orders/:id/update-price - Submit verified prices for customer confirmation
router.post('/orders/:id/update-price', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { items, shopName } = req.body;

  const orders = db.get('orders');
  const orderIndex = orders.findIndex(o => o.id === id && o.runnerId === user.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIndex];
  let calculatedTotal = 0;

  if (items && Array.isArray(items)) {
    order.items = items.map((itm: any) => {
      const price = Number(itm.confirmedPrice || itm.unitPrice || 0);
      calculatedTotal += price;
      return {
        ...itm,
        confirmedPrice: price,
        isAvailable: itm.isAvailable ?? true,
      };
    });
  }

  order.shopName = shopName || order.shopName || 'Local Partner Store';
  order.totalActualPrice = calculatedTotal;
  order.totalEstimatedPrice = calculatedTotal;
  order.status = 'price_confirmation_pending';
  order.updatedAt = new Date().toISOString();

  orders[orderIndex] = order;
  db.set('orders', orders);

  db.addAuditLog(user.id, user.name, 'runner', 'SUBMIT_PRICE_CONFIRMATION', 'order', order.id, `Runner submitted bill total ₹${calculatedTotal} at ${order.shopName} for customer confirmation.`);
  db.addNotification(order.customerId, 'price_confirmation_pending', 'Price Approval Required', `Your Runner submitted a store bill of ₹${calculatedTotal} at ${order.shopName}. Please review and approve.`, '/orders');

  return res.json({
    message: 'Prices updated and sent to customer for confirmation!',
    order,
  });
});

// POST /orders/:id/record-purchase - Record purchase at shop with payment proof & method
router.post('/orders/:id/record-purchase', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { actualAmount, shopName, shopPaymentMethod, purchaseReceiptUrl } = req.body;

  const amount = Number(actualAmount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid purchase amount' });
  }

  const orders = db.get('orders');
  const orderIndex = orders.findIndex(o => o.id === id && o.runnerId === user.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIndex];
  order.totalActualPrice = amount;
  order.amountPaidToShop = amount; // Exact amount paid by runner at shop
  order.amountChargedToCustomer = amount; // Separate customer wallet debit liability
  order.shopName = shopName || order.shopName || 'Local Partner Store';
  order.shopPaymentMethod = shopPaymentMethod || 'UPI / QR Code';
  if (purchaseReceiptUrl) {
    order.purchaseReceiptUrl = purchaseReceiptUrl;
  }
  order.status = 'purchase_recorded';
  order.updatedAt = new Date().toISOString();

  // Check customer wallet balance to ensure customer has sufficient funds
  const wallets = db.get('wallets');
  const customerWallet = wallets.find(w => w.userId === order.customerId);
  const balance = customerWallet ? customerWallet.balance : 0;
  const isSufficient = balance >= amount;

  orders[orderIndex] = order;
  db.set('orders', orders);

  db.addAuditLog(user.id, user.name, 'runner', 'RECORD_PURCHASE', 'order', order.id, `Runner purchased goods worth ₹${amount} at ${order.shopName} via ${order.shopPaymentMethod}`);
  db.addNotification(order.customerId, 'order_status', 'Purchase Completed by Runner', `Runner paid ₹${amount} at ${order.shopName}. Receipt recorded.`, '/orders');

  return res.json({
    message: 'Purchase recorded successfully!',
    order,
    customerWalletBalance: balance,
    isSufficient,
  });
});

// POST /orders/:id/out-for-delivery
router.post('/orders/:id/out-for-delivery', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;

  const orders = db.get('orders');
  const orderIndex = orders.findIndex(o => o.id === id && o.runnerId === user.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIndex];
  order.status = 'out_for_delivery';
  order.updatedAt = new Date().toISOString();
  orders[orderIndex] = order;
  db.set('orders', orders);

  db.addAuditLog(user.id, user.name, 'runner', 'OUT_FOR_DELIVERY', 'order', order.id, `Order #${order.orderNumber} is out for delivery`);
  db.addNotification(order.customerId, 'out_for_delivery', 'Out for Delivery', `Your Runner is heading to your address with order #${order.orderNumber}.`, '/orders');

  return res.json({ message: 'Order marked as Out for Delivery!', order });
});

// POST /orders/:id/request-completion - Mark delivered, pending OTP or customer confirmation
router.post('/orders/:id/request-completion', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;

  const orders = db.get('orders');
  const orderIndex = orders.findIndex(o => o.id === id && o.runnerId === user.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIndex];
  order.status = 'delivered_pending_completion';
  order.updatedAt = new Date().toISOString();
  orders[orderIndex] = order;
  db.set('orders', orders);

  db.addAuditLog(user.id, user.name, 'runner', 'REQUEST_COMPLETION', 'order', order.id, `Runner arrived at delivery location for order #${order.orderNumber}. Awaiting OTP / customer confirmation.`);
  db.addNotification(order.customerId, 'order_delivered', 'Runner at Doorstep', `Your Runner has arrived with order #${order.orderNumber}. Please provide your OTP: ${order.deliveryOtp}`, '/orders');

  return res.json({
    message: 'Arrived at delivery address. Ask the customer for their 4-digit Delivery OTP to complete!',
    order,
  });
});

// POST /orders/:id/complete-with-otp - Runner submits delivery OTP provided by customer
router.post('/orders/:id/complete-with-otp', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { otp } = req.body;

  const orders = db.get('orders');
  const orderIndex = orders.findIndex(o => o.id === id && o.runnerId === user.id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders[orderIndex];
  if (order.status === 'completed') {
    return res.status(400).json({ error: 'Order already completed' });
  }

  const settings = db.get('settings');
  if (settings.requireDeliveryOtp && order.deliveryOtp) {
    if (!otp || String(otp).trim() !== String(order.deliveryOtp).trim()) {
      return res.status(400).json({ error: 'Invalid Delivery OTP. Please verify with customer.' });
    }
  }

  // Atomically consume exactly 1 credit from customer's subscription ledger
  if (!order.creditDeducted) {
    const subscriptions = db.get('userSubscriptions');
    const activeSub = subscriptions.find(s => s.userId === order.customerId && s.status === 'active');

    if (activeSub && activeSub.creditsRemaining > 0) {
      activeSub.creditsRemaining -= 1;
      if (activeSub.creditsRemaining === 0) {
        activeSub.status = 'exhausted';
      }
      db.set('userSubscriptions', subscriptions);

      const subLedger = db.get('subscriptionLedger');
      const entry: SubscriptionLedgerEntry = {
        id: `sledg_${Date.now()}`,
        userId: order.customerId,
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

  // Atomically debit customer wallet for actual product cost
  const actualCost = order.totalActualPrice || order.totalEstimatedPrice || 0;
  if (actualCost > 0 && !order.walletDebited) {
    const wallets = db.get('wallets');
    const wallet = wallets.find(w => w.userId === order.customerId);
    if (wallet) {
      wallet.balance -= actualCost;
      wallet.updatedAt = new Date().toISOString();
      db.set('wallets', wallets);

      const walletLedger = db.get('walletLedger');
      const debitEntry: WalletLedgerEntry = {
        id: `wledg_${Date.now()}`,
        walletId: wallet.id,
        userId: order.customerId,
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

  // Record runner commission and settlement status
  order.runnerCommission = settings.runnerCommissionPerDelivery || 35;
  order.runnerSettlementStatus = 'pending';
  order.status = 'completed';
  order.updatedAt = new Date().toISOString();
  orders[orderIndex] = order;
  db.set('orders', orders);

  db.addAuditLog(user.id, user.name, 'runner', 'ORDER_COMPLETED', 'order', order.id, `Runner completed order #${order.orderNumber} via OTP verification. 1 credit deducted. Commission: ₹${order.runnerCommission}`);
  db.addNotification(order.customerId, 'order_completed', 'Delivery Completed', `Order #${order.orderNumber} has been verified and completed. Thank you for using M-PARTNER!`, '/orders');

  return res.json({
    message: `Order #${order.orderNumber} successfully completed and verified!`,
    order,
  });
});

export default router;
