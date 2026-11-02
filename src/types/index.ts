export type UserRole = 'customer' | 'runner' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  address?: string;
  building?: string;
  locality?: string;
  landmark?: string;
  language?: string;
  status: 'active' | 'pending' | 'suspended';
  assignedRunnerId?: string;
  serviceAreaId?: string;
  walletBalance?: number;
  activeSubscription?: UserSubscription | null;
  assignedRunner?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    isAvailable: boolean;
    vehicleType?: string;
    languages?: string[];
  } | null;
}

export interface ServiceArea {
  id: string;
  name: string;
  city: string;
  isActive: boolean;
  pincode?: string;
  runnerCount?: number;
  customerCount?: number;
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
  changeAmount: number;
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
