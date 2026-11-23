package com.example.ui

import android.app.Application
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AiShoppingRepository
import com.example.data.MPartnerAnalyticsAndTests
import com.example.data.MPartnerRepository
import com.example.model.*
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

private const val TAG = "MainViewModel"

sealed interface SmartListUiState {
    data object Idle : SmartListUiState
    data object Loading : SmartListUiState
    data class Success(val result: SmartListResult) : SmartListUiState
    data class Error(val message: String) : SmartListUiState
}

sealed interface ConciergeUiState {
    data object Idle : ConciergeUiState
    data object Loading : ConciergeUiState
    data class Streaming(val text: String) : ConciergeUiState
    data class Error(val message: String) : ConciergeUiState
}

data class ConciergeMessage(
    val isUser: Boolean,
    val text: String
)

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repo = MPartnerRepository(application.applicationContext)
    private val aiRepo = AiShoppingRepository()

    val database: StateFlow<DatabaseSchema> = repo.database
    val currentUser: StateFlow<User?> = repo.currentUser

    private val _snackbarMessage = MutableSharedFlow<String>(extraBufferCapacity = 8)
    val snackbarMessage: SharedFlow<String> = _snackbarMessage.asSharedFlow()

    private val _smartListState = MutableStateFlow<SmartListUiState>(SmartListUiState.Idle)
    val smartListState: StateFlow<SmartListUiState> = _smartListState.asStateFlow()

    private val _conciergeState = MutableStateFlow<ConciergeUiState>(ConciergeUiState.Idle)
    val conciergeState: StateFlow<ConciergeUiState> = _conciergeState.asStateFlow()

    private val _conciergeHistory = MutableStateFlow(
        listOf(
            ConciergeMessage(
                isUser = false,
                text = "Hello! I am your M-PARTNER AI Assistant. How can I help you with your neighborhood shopping, subscription plans, or local runner deliveries today?"
            )
        )
    )
    val conciergeHistory: StateFlow<List<ConciergeMessage>> = _conciergeHistory.asStateFlow()

    private val _testReport = MutableStateFlow<BusinessRuleTestReport?>(null)
    val testReport: StateFlow<BusinessRuleTestReport?> = _testReport.asStateFlow()

    init {
        runBusinessRuleTests()
    }

    private fun emitMessage(result: Result<Any?>, fallbackSuccess: String? = null) {
        result.onSuccess { value ->
            val msg = (value as? String) ?: fallbackSuccess
            if (!msg.isNullOrBlank()) _snackbarMessage.tryEmit(msg)
        }.onFailure { err ->
            _snackbarMessage.tryEmit(err.message ?: "Action failed")
        }
    }

    fun login(email: String, password: String, expectedRole: String?, onSuccess: (User) -> Unit) {
        repo.login(email, password, expectedRole)
            .onSuccess { user ->
                _snackbarMessage.tryEmit("Welcome back, ${user.name}!")
                onSuccess(user)
            }
            .onFailure { _snackbarMessage.tryEmit(it.message ?: "Login failed") }
    }

    fun switchDemo(role: String, onSuccess: (User) -> Unit) {
        repo.switchDemo(role)
            .onSuccess { user ->
                _snackbarMessage.tryEmit("Switched to ${user.name} (${user.role})")
                onSuccess(user)
            }
            .onFailure { _snackbarMessage.tryEmit(it.message ?: "Switch failed") }
    }

    fun logout(onComplete: () -> Unit) {
        repo.logout()
        _snackbarMessage.tryEmit("Signed out")
        onComplete()
    }

    fun registerCustomer(
        name: String, phone: String, email: String, password: String,
        address: String, building: String, locality: String, landmark: String,
        language: String, serviceAreaId: String, onSuccess: (User) -> Unit
    ) {
        repo.registerCustomer(name, phone, email, password, address, building, locality, landmark, language, serviceAreaId)
            .onSuccess { user ->
                _snackbarMessage.tryEmit("Registration complete! Assigned your dedicated local Runner.")
                onSuccess(user)
            }
            .onFailure { _snackbarMessage.tryEmit(it.message ?: "Registration failed") }
    }

    fun registerRunner(
        name: String, phone: String, email: String, password: String,
        address: String, serviceAreaId: String, languages: List<String>,
        vehicleType: String, onSuccess: (User) -> Unit
    ) {
        repo.registerRunner(name, phone, email, password, address, serviceAreaId, languages, vehicleType)
            .onSuccess { user ->
                _snackbarMessage.tryEmit("Runner application submitted! Pending Admin verification.")
                onSuccess(user)
            }
            .onFailure { _snackbarMessage.tryEmit(it.message ?: "Registration failed") }
    }

    fun computeCustomerAlerts(user: User, db: DatabaseSchema): List<CustomerAlert> {
        val wallet = db.wallets.find { it.userId == user.id }
        val activeSub = db.userSubscriptions.find { it.userId == user.id && it.status == "active" }
        val activeOrder = db.orders.find { it.customerId == user.id && it.status !in listOf("completed", "cancelled", "rejected") }
        val alerts = mutableListOf<CustomerAlert>()

        val bal = wallet?.balance ?: 0.0
        if (bal < db.settings.lowBalanceThreshold) {
            alerts += CustomerAlert("low_bal", true, "Low Wallet Balance", "Balance is ₹${bal.toInt()}. Add funds for upcoming grocery purchases.", "wallet")
        }
        if (activeSub != null && activeSub.creditsRemaining <= db.settings.lowCreditsThreshold) {
            alerts += CustomerAlert("low_cred", true, "Low Remaining Credits", "Only ${activeSub.creditsRemaining} delivery credit(s) left in ${activeSub.planName}.", "subscription")
        }
        if (activeOrder?.status == "price_confirmation_pending") {
            alerts += CustomerAlert("price_pend", true, "Price Confirmation Required", "Runner submitted ₹${(activeOrder.totalActualPrice ?: activeOrder.totalEstimatedPrice ?: 0.0).toInt()} bill. Review and approve.", "overview")
        }
        if (activeOrder?.status == "delivered_pending_completion") {
            alerts += CustomerAlert("otp_pend", false, "Runner at Doorstep", "Share Delivery OTP ${activeOrder.deliveryOtp} or confirm delivery receipt.", "overview")
        }
        return alerts
    }

    fun createOrder(items: List<OrderItem>, deliveryAddress: String, notes: String, preferredTime: String, onCreated: () -> Unit) {
        repo.createOrder(items, deliveryAddress, notes, preferredTime)
            .onSuccess { order ->
                _snackbarMessage.tryEmit("Order #${order.orderNumber} placed! Designated Runner notified.")
                onCreated()
            }
            .onFailure { _snackbarMessage.tryEmit(it.message ?: "Failed to place order") }
    }

    fun confirmPrice(orderId: String, approved: Boolean, reason: String = "") = emitMessage(repo.confirmPrice(orderId, approved, reason))
    fun confirmDeliveryByCustomer(orderId: String) = emitMessage(repo.confirmDeliveryByCustomer(orderId))
    fun cancelOrder(orderId: String, reason: String) = emitMessage(repo.cancelOrder(orderId, reason))
    fun requestWalletRecharge(amount: Double, reference: String, method: String) = emitMessage(repo.requestWalletRecharge(amount, reference, method), "Recharge request submitted!")
    fun purchaseSubscription(planId: String, reference: String) = emitMessage(repo.purchaseSubscription(planId, reference), "Subscription submitted for verification!")
    fun markAllNotificationsRead() = repo.markAllNotificationsRead()
    fun markNotificationRead(id: String) = repo.markNotificationRead(id)

    fun toggleRunnerAvailability(available: Boolean) {
        repo.toggleRunnerAvailability(available)
        _snackbarMessage.tryEmit("Availability updated to ${if (available) "Online" else "Offline"}")
    }

    fun acceptOrder(orderId: String) = emitMessage(repo.acceptOrder(orderId))
    fun rejectOrder(orderId: String, reason: String) = emitMessage(repo.rejectOrder(orderId, reason))
    fun startShopping(orderId: String) = emitMessage(repo.startShopping(orderId))
    fun submitPriceConfirmation(orderId: String, items: List<OrderItem>, shopName: String) = emitMessage(repo.submitPriceConfirmation(orderId, items, shopName))
    fun recordPurchase(orderId: String, amount: Double, shopName: String, method: String) = emitMessage(repo.recordPurchase(orderId, amount, shopName, method))
    fun markOutForDelivery(orderId: String) = emitMessage(repo.markOutForDelivery(orderId))
    fun requestCompletion(orderId: String) = emitMessage(repo.requestCompletion(orderId))
    fun completeOrderWithOtp(orderId: String, otp: String) = emitMessage(repo.completeOrderWithOtp(orderId, otp))

    fun sendChatMessage(orderId: String, text: String, onSent: () -> Unit = {}) {
        repo.sendChatMessage(orderId, text).onSuccess { onSent() }.onFailure { _snackbarMessage.tryEmit(it.message ?: "Failed to send message") }
    }

    fun reportMessage(messageId: String, reason: String) = emitMessage(repo.reportMessage(messageId, reason))

    fun submitSupportTicket(category: String, subject: String, message: String, name: String = "", email: String = "", phone: String = "", onSubmitted: () -> Unit = {}) {
        repo.submitSupportTicket(category, subject, message, name, email, phone)
            .onSuccess {
                _snackbarMessage.tryEmit("Support ticket submitted! Operations team notified.")
                onSubmitted()
            }
            .onFailure { _snackbarMessage.tryEmit(it.message ?: "Could not submit ticket") }
    }

    fun approveRunner(runnerId: String) = emitMessage(repo.approveRunner(runnerId))
    fun rejectRunner(runnerId: String) = emitMessage(repo.rejectRunner(runnerId))
    fun assignRunnerToCustomer(customerId: String, runnerId: String) = emitMessage(repo.assignRunnerToCustomer(customerId, runnerId))
    fun toggleUserStatus(userId: String) = emitMessage(repo.toggleUserStatus(userId))
    fun verifySubscription(subId: String) = emitMessage(repo.verifySubscription(subId))
    fun approveRecharge(rechargeId: String) = emitMessage(repo.approveRecharge(rechargeId))
    fun rejectRecharge(rechargeId: String, reason: String) = emitMessage(repo.rejectRecharge(rechargeId, reason))
    fun issueRefund(customerId: String, amount: Double, reason: String) = emitMessage(repo.issueRefund(customerId, amount, reason))
    fun overrideOrderStatus(orderId: String, status: String) = emitMessage(repo.overrideOrderStatus(orderId, status))
    fun updateSettings(upiId: String, supportPhone: String, supportEmail: String, requireOtp: Boolean, allowMultiRunner: Boolean) = emitMessage(repo.updateSettings(upiId, supportPhone, supportEmail, requireOtp, allowMultiRunner))
    fun createServiceArea(name: String, city: String, pincode: String) = emitMessage(repo.createServiceArea(name, city, pincode))
    fun resolveTicket(ticketId: String, notes: String) = emitMessage(repo.resolveTicket(ticketId, notes))
    fun resolveReport(reportId: String, action: String) = emitMessage(repo.resolveReport(reportId, action))

    fun shareCsvExport(context: Context, type: String) {
        val csv = MPartnerAnalyticsAndTests.buildCsvExport(_database.value, type)
        val intent = Intent(Intent.ACTION_SEND).apply {
            this.type = "text/csv"
            putExtra(Intent.EXTRA_SUBJECT, "M-PARTNER ${type.uppercase()} Export")
            putExtra(Intent.EXTRA_TEXT, csv)
        }
        context.startActivity(Intent.createChooser(intent, "Export M-PARTNER CSV"))
    }

    fun generateSmartList(prompt: String) {
        if (prompt.isBlank()) return
        viewModelScope.launch {
            _smartListState.value = SmartListUiState.Loading
            try {
                val result = aiRepo.generateSmartList(prompt)
                _smartListState.value = SmartListUiState.Success(result)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e(TAG, "Smart list generation error", e)
                _smartListState.value = SmartListUiState.Error(e.localizedMessage ?: "Failed to generate list with Gemini AI.")
            }
        }
    }

    fun askAiConcierge(question: String) {
        val trimmed = question.trim()
        if (trimmed.isEmpty()) return
        val user = _currentUser.value
        val contextSummary = if (user != null) "Role: ${user.role}, Locality: ${user.locality ?: "Ambarnath"}" else "Guest visitor"
        _conciergeHistory.value = _conciergeHistory.value + ConciergeMessage(isUser = true, text = trimmed)
        viewModelScope.launch {
            _conciergeState.value = ConciergeUiState.Loading
            var finalReply = ""
            try {
                aiRepo.streamConciergeResponse(trimmed, contextSummary).collect { partial ->
                    finalReply = partial
                    _conciergeState.value = ConciergeUiState.Streaming(partial)
                }
                if (finalReply.isNotBlank()) {
                    _conciergeHistory.value = _conciergeHistory.value + ConciergeMessage(isUser = false, text = finalReply)
                }
                _conciergeState.value = ConciergeUiState.Idle
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.e(TAG, "AI concierge error", e)
                _conciergeState.value = ConciergeUiState.Error(e.localizedMessage ?: "AI concierge error.")
            }
        }
    }

    fun runBusinessRuleTests() {
        _testReport.value = MPartnerAnalyticsAndTests.runAutomatedBusinessRuleTests(_database.value)
    }
}
