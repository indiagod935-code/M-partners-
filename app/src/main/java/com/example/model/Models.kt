package com.example.model

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val role: String,
    val name: String,
    val phone: String,
    val email: String,
    val passwordHash: String = "",
    val address: String? = null,
    val building: String? = null,
    val locality: String? = null,
    val landmark: String? = null,
    val language: String? = null,
    val status: String = "active",
    val assignedRunnerId: String? = null,
    val serviceAreaId: String? = null,
    val createdAt: String = ""
)

@Serializable
data class RunnerProfile(
    val id: String,
    val userId: String,
    val serviceAreaId: String,
    val languages: List<String> = emptyList(),
    val isApproved: Boolean = false,
    val isAvailable: Boolean = false,
    val activeOrderCount: Int = 0,
    val rating: Double = 5.0,
    val vehicleType: String? = null,
    val upiId: String? = null
)

@Serializable
data class ServiceArea(
    val id: String,
    val name: String,
    val city: String,
    val isActive: Boolean = true,
    val pincode: String? = null
)

@Serializable
data class SubscriptionPlan(
    val id: String,
    val name: String,
    val price: Double,
    val credits: Int,
    val validityDays: Int,
    val isActive: Boolean = true,
    val description: String = ""
)

@Serializable
data class UserSubscription(
    val id: String,
    val userId: String,
    val planId: String,
    val planName: String,
    val status: String,
    val creditsTotal: Int,
    val creditsRemaining: Int,
    val startDate: String,
    val expiresAt: String,
    val paymentRef: String? = null,
    val verifiedAt: String? = null
)

@Serializable
data class SubscriptionLedgerEntry(
    val id: String,
    val userId: String,
    val subscriptionId: String,
    val orderId: String? = null,
    val changeAmount: Int,
    val reason: String,
    val createdAt: String
)

@Serializable
data class Wallet(
    val id: String,
    val userId: String,
    val balance: Double,
    val updatedAt: String
)

@Serializable
data class WalletLedgerEntry(
    val id: String,
    val walletId: String,
    val userId: String,
    val type: String,
    val amount: Double,
    val orderId: String? = null,
    val rechargeRequestId: String? = null,
    val status: String = "approved",
    val notes: String = "",
    val createdAt: String
)

@Serializable
data class RechargeRequest(
    val id: String,
    val userId: String,
    val userName: String,
    val amount: Double,
    val paymentProofUrl: String? = null,
    val paymentReference: String? = null,
    val paymentMethod: String = "UPI Transfer",
    val status: String = "pending",
    val reviewedBy: String? = null,
    val reviewedAt: String? = null,
    val adminNote: String? = null,
    val createdAt: String
)

@Serializable
data class OrderItem(
    val id: String,
    val name: String,
    val quantity: Double = 1.0,
    val unit: String = "piece",
    val brandPreference: String? = null,
    val notes: String? = null,
    val unitPrice: Double? = null,
    val estimatedPrice: Double? = null,
    val confirmedPrice: Double? = null,
    val isAvailable: Boolean? = true,
    val substitutionNotes: String? = null
)

@Serializable
data class Order(
    val id: String,
    val orderNumber: String,
    val customerId: String,
    val customerName: String,
    val customerPhone: String,
    val deliveryAddress: String,
    val runnerId: String? = null,
    val runnerName: String? = null,
    val runnerPhone: String? = null,
    val items: List<OrderItem> = emptyList(),
    val status: String = "order_placed",
    val notes: String? = null,
    val preferredDeliveryTime: String? = null,
    val totalEstimatedPrice: Double? = null,
    val totalActualPrice: Double? = null,
    val purchaseReceiptUrl: String? = null,
    val shopName: String? = null,
    val shopPaymentMethod: String? = null,
    val deliveryOtp: String? = null,
    val creditDeducted: Boolean = false,
    val walletDebited: Boolean = false,
    val amountPaidToShop: Double? = null,
    val amountChargedToCustomer: Double? = null,
    val runnerCommission: Double? = null,
    val runnerSettlementStatus: String? = null,
    val cancellationReason: String? = null,
    val createdAt: String = "",
    val updatedAt: String = ""
)

@Serializable
data class ChatMessage(
    val id: String,
    val orderId: String,
    val senderId: String,
    val senderName: String,
    val senderRole: String,
    val text: String,
    val attachmentUrl: String? = null,
    val attachmentType: String? = null,
    val isReported: Boolean? = null,
    val reportCount: Int? = null,
    val createdAt: String
)

@Serializable
data class AppNotification(
    val id: String,
    val userId: String,
    val type: String,
    val title: String,
    val message: String,
    val link: String? = null,
    val isRead: Boolean = false,
    val createdAt: String
)

@Serializable
data class ContentReport(
    val id: String,
    val reporterId: String,
    val reporterName: String,
    val reportedUserId: String? = null,
    val reportedUserName: String? = null,
    val messageId: String,
    val orderId: String,
    val messageText: String,
    val reason: String,
    val status: String = "pending",
    val adminNotes: String? = null,
    val createdAt: String
)

@Serializable
data class ModerationLog(
    val id: String,
    val senderId: String,
    val senderName: String,
    val text: String,
    val flaggedKeywords: List<String> = emptyList(),
    val action: String = "blocked",
    val createdAt: String
)

@Serializable
data class SupportTicket(
    val id: String,
    val userId: String,
    val userName: String,
    val userEmail: String,
    val userRole: String,
    val category: String = "general",
    val subject: String,
    val message: String,
    val status: String = "open",
    val adminNotes: String? = null,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class AuditLog(
    val id: String,
    val actorId: String,
    val actorName: String,
    val actorRole: String,
    val action: String,
    val entityType: String,
    val entityId: String,
    val details: String,
    val createdAt: String
)

@Serializable
data class PlatformSettings(
    val platformName: String = "M-PARTNER",
    val parentBrand: String = "Mãrçò 💯",
    val brandingText: String = "Powered by Mãrçò 💯",
    val primaryTagline: String = "Your Needs. Your Trusted Partner.",
    val upiId: String = "8828822808@okaxis",
    val supportPhone: String = "+91 88288 22808",
    val supportEmail: String = "indiagod935@gmail.com",
    val allowMultiRunnerSelection: Boolean = false,
    val requireDeliveryOtp: Boolean = true,
    val runnerCommissionPerDelivery: Double = 35.0,
    val lowBalanceThreshold: Double = 100.0,
    val lowCreditsThreshold: Int = 3,
    val subscriptionWarningDays: Int = 3,
    val enableAutoDebitOnComplete: Boolean = true,
    val chatModerationEnabled: Boolean = true,
    val maintenanceMode: Boolean = false,
    val bannedKeywords: List<String> = listOf(
        "abuse", "offensive", "scam", "porn", "nude", "sexual", "hate", "slur", "threat", "violence"
    )
)

@Serializable
data class DatabaseSchema(
    val users: List<User> = emptyList(),
    val runnerProfiles: List<RunnerProfile> = emptyList(),
    val serviceAreas: List<ServiceArea> = emptyList(),
    val subscriptionPlans: List<SubscriptionPlan> = emptyList(),
    val userSubscriptions: List<UserSubscription> = emptyList(),
    val subscriptionLedger: List<SubscriptionLedgerEntry> = emptyList(),
    val wallets: List<Wallet> = emptyList(),
    val walletLedger: List<WalletLedgerEntry> = emptyList(),
    val rechargeRequests: List<RechargeRequest> = emptyList(),
    val orders: List<Order> = emptyList(),
    val messages: List<ChatMessage> = emptyList(),
    val notifications: List<AppNotification> = emptyList(),
    val contentReports: List<ContentReport> = emptyList(),
    val moderationLogs: List<ModerationLog> = emptyList(),
    val supportTickets: List<SupportTicket> = emptyList(),
    val auditLogs: List<AuditLog> = emptyList(),
    val settings: PlatformSettings = PlatformSettings()
)

data class CustomerAlert(
    val id: String,
    val isWarning: Boolean,
    val title: String,
    val message: String,
    val actionTab: String
)

data class SmartListItem(
    val id: String,
    val name: String,
    val quantity: String,
    val category: String,
    val estimatedPriceInr: Double,
    val storeType: String
)

data class SmartListResult(
    val summary: String,
    val items: List<SmartListItem>,
    val totalEstimatedPrice: Double,
    val suggestedStores: List<String>,
    val runnerInstructions: String
)

data class TestCaseResult(
    val id: Int,
    val rule: String,
    val passed: Boolean,
    val details: String,
    val timestamp: String
)

data class BusinessRuleTestReport(
    val total: Int,
    val passed: Int,
    val failed: Int,
    val results: List<TestCaseResult>
)

data class AccountingSummary(
    val grossSubscriptionRevenue: Double,
    val grossWalletDeposits: Double,
    val totalAmountPaidToShops: Double,
    val totalAmountChargedToCustomers: Double,
    val totalRunnerCommissions: Double,
    val totalRefunds: Double
)

data class RunnerCustomerSummary(
    val customer: User,
    val totalOrders: Int,
    val activeOrderNumber: String?
)

data class AdminRunnerSummary(
    val user: User,
    val profile: RunnerProfile?,
    val areaName: String,
    val assignedCustomersCount: Int,
    val activeJobs: Int,
    val completedJobs: Int
)

data class AdminCustomerSummary(
    val user: User,
    val areaName: String,
    val walletBalance: Double,
    val subscriptionPlan: String,
    val subscriptionCreditsRemaining: Int,
    val subscriptionExpiresAt: String?,
    val assignedRunnerName: String,
    val assignedRunnerPhone: String?
)

data class AreaPerformance(
    val areaName: String,
    val city: String,
    val customerCount: Int,
    val ordersCount: Int,
    val completedCount: Int
)
