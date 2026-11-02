import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  role: 'customer' | 'runner' | 'admin';
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  address?: string;
  building?: string;
  locality?: string;
  landmark?: string;
  language?: string;
  status: 'active' | 'pending' | 'suspended';
  assignedRunnerId?: string;
  serviceAreaId?: string;
  createdAt: string;
}

export interface RunnerProfile {
  id: string;
  userId: string;
  serviceAreaId: string;
  languages: string[];
  isApproved: boolean;
  isAvailable: boolean;
  activeOrderCount: number;
  rating: number;
  vehicleType?: string;
  upiId?: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  city: string;
  isActive: boolean;
  pincode?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  validityDays: number;
  isActive: boolean;
  description: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'active' | 'expired' | 'exhausted' | 'pending_verification';
  creditsTotal: number;
  creditsRemaining: number;
  startDate: string;
  expiresAt: string;
  paymentRef?: string;
  verifiedAt?: string;
}

export interface SubscriptionLedgerEntry {
  id: string;
  userId: string;
  subscriptionId: string;
  orderId?: string;
  changeAmount: number; // e.g. +20 on purchase, -1 on completed order
  reason: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  updatedAt: string;
}

export interface WalletLedgerEntry {
  id: string;
  walletId: string;
  userId: string;
  type: 'credit' | 'debit' | 'refund';
  amount: number;
  orderId?: string;
  rechargeRequestId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  notes: string;
  createdAt: string;
}

export interface RechargeRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  paymentProofUrl?: string;
  paymentReference?: string;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  brandPreference?: string;
  notes?: string;
  unitPrice?: number;
  estimatedPrice?: number;
  confirmedPrice?: number;
  isAvailable?: boolean;
  substitutionNotes?: string;
}

export type OrderStatus =
  | 'order_placed'
  | 'runner_assigned'
  | 'order_accepted'
  | 'price_confirmation_pending'
  | 'price_confirmed'
  | 'shopping_in_progress'
  | 'purchase_recorded'
  | 'out_for_delivery'
  | 'delivered_pending_completion'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  runnerId?: string;
  runnerName?: string;
  runnerPhone?: string;
  items: OrderItem[];
  status: OrderStatus;
  notes?: string;
  preferredDeliveryTime?: string;
  totalEstimatedPrice?: number;
  totalActualPrice?: number;
  purchaseReceiptUrl?: string;
  shopName?: string;
  shopPaymentMethod?: string;
  deliveryOtp?: string;
  creditDeducted: boolean;
  walletDebited: boolean;
  amountPaidToShop?: number;
  amountChargedToCustomer?: number;
  runnerCommission?: number;
  runnerSettlementStatus?: 'pending' | 'settled';
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'runner' | 'admin';
  text: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'receipt' | 'payment_qr';
  isReported?: boolean;
  reportCount?: number;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ContentReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId?: string;
  reportedUserName?: string;
  messageId: string;
  orderId: string;
  messageText: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
}

export interface ModerationLog {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  flaggedKeywords: string[];
  action: 'blocked' | 'flagged';
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  category: 'general' | 'order' | 'wallet' | 'subscription' | 'complaint';
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: 'order' | 'wallet' | 'subscription' | 'runner' | 'customer' | 'system' | 'moderation';
  entityId: string;
  details: string;
  createdAt: string;
}

export interface PlatformSettings {
  platformName: string;
  parentBrand: string;
  brandingText: string;
  primaryTagline: string;
  upiId: string;
  supportPhone: string;
  supportEmail: string;
  allowMultiRunnerSelection: boolean;
  requireDeliveryOtp: boolean;
  runnerCommissionPerDelivery: number;
  lowBalanceThreshold: number;
  lowCreditsThreshold: number;
  subscriptionWarningDays: number;
  enableAutoDebitOnComplete: boolean;
  chatModerationEnabled: boolean;
  maintenanceMode: boolean;
  bannedKeywords: string[];
}

export interface DatabaseSchema {
  users: User[];
  runnerProfiles: RunnerProfile[];
  serviceAreas: ServiceArea[];
  subscriptionPlans: SubscriptionPlan[];
  userSubscriptions: UserSubscription[];
  subscriptionLedger: SubscriptionLedgerEntry[];
  wallets: Wallet[];
  walletLedger: WalletLedgerEntry[];
  rechargeRequests: RechargeRequest[];
  orders: Order[];
  messages: ChatMessage[];
  notifications: AppNotification[];
  contentReports: ContentReport[];
  moderationLogs: ModerationLog[];
  supportTickets: SupportTicket[];
  auditLogs: AuditLog[];
  settings: PlatformSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getInitialData(): DatabaseSchema {
  const adminId = 'usr_admin_1';
  const runnerUserId = 'usr_runner_1';
  const customerUserId = 'usr_customer_1';
  const customer2UserId = 'usr_customer_2';

  const defaultAreas: ServiceArea[] = [
    { id: 'area_1', name: 'Indiranagar', city: 'Bengaluru', isActive: true, pincode: '560038' },
    { id: 'area_2', name: 'Koramangala', city: 'Bengaluru', isActive: true, pincode: '560034' },
    { id: 'area_3', name: 'HSR Layout', city: 'Bengaluru', isActive: true, pincode: '560102' },
    { id: 'area_4', name: 'Whitefield', city: 'Bengaluru', isActive: true, pincode: '560066' },
    { id: 'area_5', name: 'Jayanagar', city: 'Bengaluru', isActive: true, pincode: '560011' },
  ];

  const defaultPlans: SubscriptionPlan[] = [
    { id: 'plan_starter', name: 'Starter', price: 200, credits: 20, validityDays: 30, isActive: true, description: '20 completed deliveries allowance (₹10/delivery)' },
    { id: 'plan_standard', name: 'Standard', price: 400, credits: 40, validityDays: 30, isActive: true, description: '40 completed deliveries allowance (₹10/delivery)' },
    { id: 'plan_plus', name: 'Plus', price: 600, credits: 60, validityDays: 30, isActive: true, description: '60 completed deliveries allowance (₹10/delivery)' },
    { id: 'plan_premium', name: 'Premium', price: 800, credits: 80, validityDays: 30, isActive: true, description: '80 completed deliveries allowance (₹10/delivery)' },
    { id: 'plan_pro', name: 'Pro', price: 1000, credits: 100, validityDays: 30, isActive: true, description: '100 completed deliveries allowance (₹10/delivery)' },
  ];

  const users: User[] = [
    {
      id: adminId,
      role: 'admin',
      name: 'M-PARTNER Operations Admin',
      phone: '+91 98765 00001',
      email: 'admin@mpartner.com',
      passwordHash: hashPassword('admin123'),
      address: 'M-PARTNER Hub, 100 Feet Rd, Indiranagar',
      locality: 'Indiranagar',
      language: 'English',
      status: 'active',
      createdAt: '2026-10-01T08:00:00.000Z',
    },
    {
      id: runnerUserId,
      role: 'runner',
      name: 'Rohan Verma',
      phone: '+91 98765 11111',
      email: 'rohan.runner@mpartner.com',
      passwordHash: hashPassword('runner123'),
      address: 'House #42, 6th Cross, CMH Road, Indiranagar',
      locality: 'Indiranagar',
      language: 'English, Kannada, Hindi',
      status: 'active',
      serviceAreaId: 'area_1',
      createdAt: '2026-10-05T09:30:00.000Z',
    },
    {
      id: customerUserId,
      role: 'customer',
      name: 'Aarav Sharma',
      phone: '+91 98765 22222',
      email: 'aarav.sharma@gmail.com',
      passwordHash: hashPassword('customer123'),
      address: 'Flat 402, Oakwood Heights, 12th Main Road, HAL 2nd Stage',
      building: 'Oakwood Heights',
      locality: 'Indiranagar',
      landmark: 'Near 12th Main Corner House',
      language: 'English',
      status: 'active',
      assignedRunnerId: runnerUserId,
      serviceAreaId: 'area_1',
      createdAt: '2026-10-10T10:00:00.000Z',
    },
    {
      id: customer2UserId,
      role: 'customer',
      name: 'Priya Sundaram',
      phone: '+91 98765 33333',
      email: 'priya.s@gmail.com',
      passwordHash: hashPassword('customer123'),
      address: 'Villa 18, Palm Meadows, Whitefield Main Rd',
      building: 'Palm Meadows',
      locality: 'Whitefield',
      landmark: 'Opposite ITPL Back Gate',
      language: 'English, Tamil',
      status: 'active',
      serviceAreaId: 'area_4',
      createdAt: '2026-10-20T11:15:00.000Z',
    },
  ];

  const runnerProfiles: RunnerProfile[] = [
    {
      id: 'prof_runner_1',
      userId: runnerUserId,
      serviceAreaId: 'area_1',
      languages: ['English', 'Hindi', 'Kannada'],
      isApproved: true,
      isAvailable: true,
      activeOrderCount: 1,
      rating: 4.95,
      vehicleType: 'Electric Scooter',
      upiId: 'rohan.verma@okaxis',
    },
  ];

  const subId = 'sub_cust_1';
  const userSubscriptions: UserSubscription[] = [
    {
      id: subId,
      userId: customerUserId,
      planId: 'plan_starter',
      planName: 'Starter',
      status: 'active',
      creditsTotal: 20,
      creditsRemaining: 17,
      startDate: '2026-10-15T10:00:00.000Z',
      expiresAt: '2026-11-14T10:00:00.000Z',
      paymentRef: 'UPI-SUB-89421',
      verifiedAt: '2026-10-15T10:05:00.000Z',
    },
  ];

  const subscriptionLedger: SubscriptionLedgerEntry[] = [
    {
      id: 'sledg_1',
      userId: customerUserId,
      subscriptionId: subId,
      changeAmount: 20,
      reason: 'Starter Subscription plan activated (20 credits valid 30 days)',
      createdAt: '2026-10-15T10:05:00.000Z',
    },
    {
      id: 'sledg_2',
      userId: customerUserId,
      subscriptionId: subId,
      orderId: 'ord_sample_prev_1',
      changeAmount: -1,
      reason: 'Credit consumed for completed delivery order #MP-1001',
      createdAt: '2026-10-18T14:30:00.000Z',
    },
    {
      id: 'sledg_3',
      userId: customerUserId,
      subscriptionId: subId,
      orderId: 'ord_sample_prev_2',
      changeAmount: -1,
      reason: 'Credit consumed for completed delivery order #MP-1002',
      createdAt: '2026-10-22T17:10:00.000Z',
    },
    {
      id: 'sledg_4',
      userId: customerUserId,
      subscriptionId: subId,
      orderId: 'ord_sample_prev_3',
      changeAmount: -1,
      reason: 'Credit consumed for completed delivery order #MP-1003',
      createdAt: '2026-10-28T12:45:00.000Z',
    },
  ];

  const wallets: Wallet[] = [
    { id: 'wal_1', userId: customerUserId, balance: 1450, updatedAt: '2026-10-28T12:45:00.000Z' },
    { id: 'wal_2', userId: customer2UserId, balance: 500, updatedAt: '2026-10-20T11:15:00.000Z' },
  ];

  const walletLedger: WalletLedgerEntry[] = [
    {
      id: 'wledg_1',
      walletId: 'wal_1',
      userId: customerUserId,
      type: 'credit',
      amount: 2000,
      rechargeRequestId: 'rech_1',
      status: 'approved',
      notes: 'Initial wallet recharge verified by Admin',
      createdAt: '2026-10-15T10:10:00.000Z',
    },
    {
      id: 'wledg_2',
      walletId: 'wal_1',
      userId: customerUserId,
      type: 'debit',
      amount: 230,
      orderId: 'ord_sample_prev_1',
      status: 'approved',
      notes: 'Product cost debit for order #MP-1001 (Groceries)',
      createdAt: '2026-10-18T14:30:00.000Z',
    },
    {
      id: 'wledg_3',
      walletId: 'wal_1',
      userId: customerUserId,
      type: 'debit',
      amount: 180,
      orderId: 'ord_sample_prev_2',
      status: 'approved',
      notes: 'Product cost debit for order #MP-1002 (Dairy & Snacks)',
      createdAt: '2026-10-22T17:10:00.000Z',
    },
    {
      id: 'wledg_4',
      walletId: 'wal_1',
      userId: customerUserId,
      type: 'debit',
      amount: 140,
      orderId: 'ord_sample_prev_3',
      status: 'approved',
      notes: 'Product cost debit for order #MP-1003 (Fruits)',
      createdAt: '2026-10-28T12:45:00.000Z',
    },
  ];

  const rechargeRequests: RechargeRequest[] = [
    {
      id: 'rech_1',
      userId: customerUserId,
      userName: 'Aarav Sharma',
      amount: 2000,
      paymentReference: 'UPI-TXN-77889922',
      paymentMethod: 'UPI / PhonePe',
      status: 'approved',
      reviewedBy: 'usr_admin_1',
      reviewedAt: '2026-10-15T10:10:00.000Z',
      adminNote: 'Funds received in primary account',
      createdAt: '2026-10-15T10:08:00.000Z',
    },
  ];

  const sampleOrderId = 'ord_live_1004';
  const orders: Order[] = [
    {
      id: sampleOrderId,
      orderNumber: 'MP-1004',
      customerId: customerUserId,
      customerName: 'Aarav Sharma',
      customerPhone: '+91 98765 22222',
      deliveryAddress: 'Flat 402, Oakwood Heights, 12th Main Road, Indiranagar',
      runnerId: runnerUserId,
      runnerName: 'Rohan Verma',
      runnerPhone: '+91 98765 11111',
      items: [
        { id: 'itm_1', name: 'Tata Salt Crystal', quantity: 1, unit: 'kg', brandPreference: 'Tata Salt', unitPrice: 28, estimatedPrice: 28, confirmedPrice: 28, isAvailable: true },
        { id: 'itm_2', name: 'Fortune Sunlite Sunflower Oil', quantity: 1, unit: 'litre', brandPreference: 'Fortune', unitPrice: 145, estimatedPrice: 145, confirmedPrice: 145, isAvailable: true },
        { id: 'itm_3', name: 'Fresh Robusta Bananas', quantity: 12, unit: 'pieces', notes: 'Medium ripe, not over-ripened', unitPrice: 6, estimatedPrice: 72, confirmedPrice: 72, isAvailable: true },
        { id: 'itm_4', name: 'Kashmir Royal Gala Apples', quantity: 500, unit: 'g', notes: 'Crisp and fresh', unitPrice: 90, estimatedPrice: 90, confirmedPrice: 90, isAvailable: true },
        { id: 'itm_5', name: 'Mysore Sandal Soap', quantity: 1, unit: 'piece', brandPreference: 'Karnataka Soaps', unitPrice: 58, estimatedPrice: 58, confirmedPrice: 58, isAvailable: true },
      ],
      status: 'shopping_in_progress',
      notes: 'Please check expiry dates carefully. Call if brand unavailable.',
      preferredDeliveryTime: 'Today by 4:00 PM',
      totalEstimatedPrice: 393,
      totalActualPrice: 393,
      shopName: 'Sri Venkateshwara Provision Stores, 12th Main',
      shopPaymentMethod: 'UPI to Shop QR',
      deliveryOtp: '4829',
      creditDeducted: false,
      walletDebited: false,
      createdAt: '2026-11-02T06:15:00.000Z',
      updatedAt: '2026-11-02T06:45:00.000Z',
    },
  ];

  const messages: ChatMessage[] = [
    {
      id: 'msg_1',
      orderId: sampleOrderId,
      senderId: customerUserId,
      senderName: 'Aarav Sharma',
      senderRole: 'customer',
      text: 'Hi Rohan! I placed order MP-1004. Please check if they have the 1L pouch for Fortune Oil.',
      createdAt: '2026-11-02T06:20:00.000Z',
    },
    {
      id: 'msg_2',
      orderId: sampleOrderId,
      senderId: runnerUserId,
      senderName: 'Rohan Verma',
      senderRole: 'runner',
      text: 'Hello Aarav! Yes, I am at Sri Venkateshwara Provision Stores now. They have the 1L pouch for ₹145 and fresh Kashmir apples at ₹90/500g.',
      createdAt: '2026-11-02T06:30:00.000Z',
    },
    {
      id: 'msg_3',
      orderId: sampleOrderId,
      senderId: runnerUserId,
      senderName: 'Rohan Verma',
      senderRole: 'runner',
      text: 'Total verified bill is ₹393. I have updated the price breakdown for your confirmation.',
      createdAt: '2026-11-02T06:35:00.000Z',
    },
    {
      id: 'msg_4',
      orderId: customerUserId,
      senderId: customerUserId,
      senderName: 'Aarav Sharma',
      senderRole: 'customer',
      text: 'Perfect! Price confirmed. Please go ahead with the purchase.',
      createdAt: '2026-11-02T06:40:00.000Z',
    },
  ];

  const supportTickets: SupportTicket[] = [
    {
      id: 'tkt_1',
      userId: customerUserId,
      userName: 'Aarav Sharma',
      userEmail: 'aarav.sharma@gmail.com',
      userRole: 'customer',
      category: 'general',
      subject: 'Question on service hours on public holidays',
      message: 'Are Runners available during festival holidays in Indiranagar area?',
      status: 'resolved',
      adminNotes: 'Informed customer that service runs 7 days a week, 8 AM - 9 PM.',
      createdAt: '2026-10-25T14:00:00.000Z',
      updatedAt: '2026-10-25T16:30:00.000Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud_1',
      actorId: adminId,
      actorName: 'M-PARTNER Operations Admin',
      actorRole: 'admin',
      action: 'APPROVE_RUNNER',
      entityType: 'runner',
      entityId: runnerUserId,
      details: 'Approved runner Rohan Verma for Indiranagar zone',
      createdAt: '2026-10-05T09:35:00.000Z',
    },
    {
      id: 'aud_2',
      actorId: adminId,
      actorName: 'M-PARTNER Operations Admin',
      actorRole: 'admin',
      action: 'ASSIGN_RUNNER_TO_CUSTOMER',
      entityType: 'customer',
      entityId: customerUserId,
      details: 'Assigned designated runner Rohan Verma to Aarav Sharma',
      createdAt: '2026-10-10T10:05:00.000Z',
    },
    {
      id: 'aud_3',
      actorId: adminId,
      actorName: 'M-PARTNER Operations Admin',
      actorRole: 'admin',
      action: 'VERIFY_SUBSCRIPTION',
      entityType: 'subscription',
      entityId: subId,
      details: 'Verified Starter plan for Aarav Sharma (+20 credits)',
      createdAt: '2026-10-15T10:05:00.000Z',
    },
    {
      id: 'aud_4',
      actorId: adminId,
      actorName: 'M-PARTNER Operations Admin',
      actorRole: 'admin',
      action: 'APPROVE_WALLET_RECHARGE',
      entityType: 'wallet',
      entityId: 'wal_1',
      details: 'Approved recharge of ₹2000 for Aarav Sharma (Ref: UPI-TXN-77889922)',
      createdAt: '2026-10-15T10:10:00.000Z',
    },
  ];

  const settings: PlatformSettings = {
    platformName: 'M-PARTNER',
    parentBrand: 'Mãrçò 💯',
    brandingText: 'Powered by Mãrçò 💯',
    primaryTagline: 'Your Needs. Your Trusted Partner.',
    upiId: 'mpartner.marcohun@icici',
    supportPhone: '+91 80 4920 8000',
    supportEmail: 'support@mpartner.marcohun.com',
    allowMultiRunnerSelection: false,
    requireDeliveryOtp: true,
    runnerCommissionPerDelivery: 35,
    lowBalanceThreshold: 100,
    lowCreditsThreshold: 3,
    subscriptionWarningDays: 3,
    enableAutoDebitOnComplete: true,
    chatModerationEnabled: true,
    maintenanceMode: false,
    bannedKeywords: ['abuse', 'offensive', 'scam', 'porn', 'nude', 'sexual', 'hate', 'slur', 'threat', 'violence'],
  };

  const notifications: AppNotification[] = [
    {
      id: 'notif_1',
      userId: customerUserId,
      type: 'order_status',
      title: 'Order MP-1004 In Progress',
      message: 'Your designated Runner Rohan Verma is currently shopping at Sri Venkateshwara Provision Stores.',
      link: '/orders',
      isRead: false,
      createdAt: '2026-11-02T06:30:00.000Z',
    },
    {
      id: 'notif_2',
      userId: customerUserId,
      type: 'subscription_activated',
      title: 'Starter Plan Active',
      message: 'Your Starter subscription is active with 17 credits remaining valid until 14 Nov 2026.',
      link: '/subscription',
      isRead: true,
      createdAt: '2026-10-15T10:05:00.000Z',
    },
  ];

  const contentReports: ContentReport[] = [];
  const moderationLogs: ModerationLog[] = [];

  return {
    users,
    runnerProfiles,
    serviceAreas: defaultAreas,
    subscriptionPlans: defaultPlans,
    userSubscriptions,
    subscriptionLedger,
    wallets,
    walletLedger,
    rechargeRequests,
    orders,
    messages,
    notifications,
    contentReports,
    moderationLogs,
    supportTickets,
    auditLogs,
    settings,
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
    // Ensure all collections exist
    if (!this.data.notifications) this.data.notifications = [];
    if (!this.data.contentReports) this.data.contentReports = [];
    if (!this.data.moderationLogs) this.data.moderationLogs = [];
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.contentReports) parsed.contentReports = [];
        if (!parsed.moderationLogs) parsed.moderationLogs = [];
        return parsed;
      } catch (err) {
        console.error('Error reading db.json, initializing fresh data:', err);
      }
    }
    const initial = getInitialData();
    this.saveDataDirect(initial);
    return initial;
  }

  private saveDataDirect(data: DatabaseSchema) {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public save() {
    this.saveDataDirect(this.data);
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]) {
    this.data[key] = value;
    this.save();
  }

  public addAuditLog(actorId: string, actorName: string, actorRole: string, action: string, entityType: AuditLog['entityType'], entityId: string, details: string) {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      actorId,
      actorName,
      actorRole,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    this.save();
    return log;
  }

  public addNotification(userId: string, type: string, title: string, message: string, link?: string) {
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId,
      type,
      title,
      message,
      link,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  public addModerationLog(senderId: string, senderName: string, text: string, flaggedKeywords: string[], action: 'blocked' | 'flagged') {
    const log: ModerationLog = {
      id: `mod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      senderId,
      senderName,
      text,
      flaggedKeywords,
      action,
      createdAt: new Date().toISOString(),
    };
    this.data.moderationLogs.unshift(log);
    this.save();
    return log;
  }

  public moderateText(text: string): { allowed: boolean; reason?: string; flaggedKeywords?: string[] } {
    if (!this.data.settings.chatModerationEnabled) {
      return { allowed: true };
    }

    // Normalized text inspection
    const normalized = text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    const words = normalized.split(/\s+/);
    const banned = this.data.settings.bannedKeywords || [];

    const flagged: string[] = [];
    for (const b of banned) {
      const bNorm = b.toLowerCase();
      // Match whole words or obvious substring unless it's a UPI handle or URL
      const regex = new RegExp(`\\b${bNorm}\\b`, 'i');
      if (regex.test(normalized)) {
        flagged.push(b);
      }
    }

    if (flagged.length > 0) {
      return {
        allowed: false,
        reason: 'Your message could not be sent because it violates the community guidelines.',
        flaggedKeywords: flagged,
      };
    }

    return { allowed: true };
  }
}

export const db = new Database();
export { hashPassword };
