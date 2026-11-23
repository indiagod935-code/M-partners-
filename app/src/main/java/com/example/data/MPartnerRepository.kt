package com.example.data

import android.content.Context
import com.example.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File
import java.security.MessageDigest
import java.text.Normalizer
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.concurrent.ConcurrentHashMap
import kotlin.random.Random

class MPartnerRepository(private val context: Context) {

    private val json = Json {
        ignoreUnknownKeys = true
        prettyPrint = true
        encodeDefaults = true
    }

    private val dbFile = File(context.filesDir, "mpartner_db.json")
    private val prefs = context.getSharedPreferences("mpartner_session", Context.MODE_PRIVATE)
    private val rateLimitMap = ConcurrentHashMap<String, MutableList<Long>>()

    private val _database = MutableStateFlow(loadInitialDatabase())
    val database: StateFlow<DatabaseSchema> = _database.asStateFlow()

    private val _currentUser = MutableStateFlow<User?>(restoreInitialUser())
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private fun restoreInitialUser(): User? {
        val savedId = prefs.getString("user_id", "usr_customer_1")
        if (savedId.isNullOrBlank()) return null
        return _database.value.users.find { it.id == savedId }
    }

    private fun loadInitialDatabase(): DatabaseSchema {
        if (dbFile.exists()) {
            try {
                return json.decodeFromString<DatabaseSchema>(dbFile.readText())
            } catch (_: Exception) {
            }
        }
        val seedText = context.assets.open("db.json").bufferedReader().use { it.readText() }
        val parsed = json.decodeFromString<DatabaseSchema>(seedText)
        persistDatabase(parsed)
        return parsed
    }

    @Synchronized
    private fun updateDatabase(transform: (DatabaseSchema) -> DatabaseSchema) {
        val updated = transform(_database.value)
        _database.value = updated
        persistDatabase(updated)
        val curId = _currentUser.value?.id
        if (curId != null) {
            _currentUser.value = updated.users.find { it.id == curId }
        }
    }

    private fun persistDatabase(schema: DatabaseSchema) {
        try {
            dbFile.writeText(json.encodeToString(schema))
        } catch (_: Exception) {
        }
    }

    fun sha256(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    private fun nowIso(): String = Instant.now().toString()

    private fun DatabaseSchema.withAuditLog(
        actorId: String,
        actorName: String,
        actorRole: String,
        action: String,
        entityType: String,
        entityId: String,
        details: String
    ): DatabaseSchema {
        val entry = AuditLog(
            id = "aud_${System.currentTimeMillis()}_${Random.nextInt(100, 999)}",
            actorId = actorId,
            actorName = actorName,
            actorRole = actorRole,
            action = action,
            entityType = entityType,
            entityId = entityId,
            details = details,
            createdAt = nowIso()
        )
        return copy(auditLogs = listOf(entry) + auditLogs)
    }

    private fun DatabaseSchema.withNotification(
        userId: String,
        type: String,
        title: String,
        message: String,
        link: String? = null
    ): DatabaseSchema {
        val notif = AppNotification(
            id = "notif_${System.currentTimeMillis()}_${Random.nextInt(100, 999)}",
            userId = userId,
            type = type,
            title = title,
            message = message,
            link = link,
            isRead = false,
            createdAt = nowIso()
        )
        return copy(notifications = listOf(notif) + notifications)
    }

    fun login(email: String, password: String, expectedRole: String? = null): Result<User> {
        if (email.isBlank() || password.isBlank()) {
            return Result.failure(IllegalArgumentException("Email and password are required"))
        }
        val user = _database.value.users.find { it.email.equals(email.trim(), ignoreCase = true) }
            ?: return Result.failure(IllegalArgumentException("Invalid credentials. User not found."))
        if (user.passwordHash != sha256(password)) {
            return Result.failure(IllegalArgumentException("Invalid password. Please check your credentials."))
        }
        if (expectedRole != null && user.role != expectedRole) {
            return Result.failure(IllegalArgumentException("Account exists but role is ${user.role}, not $expectedRole."))
        }
        if (user.status == "suspended") {
            return Result.failure(IllegalStateException("This account has been suspended by administration. Please contact support."))
        }
        prefs.edit().putString("user_id", user.id).apply()
        _currentUser.value = user
        return Result.success(user)
    }

    fun switchDemo(role: String): Result<User> {
        val users = _database.value.users
        val target = when (role) {
            "admin" -> users.find { it.role == "admin" }
            "runner" -> users.find { it.role == "runner" && it.status == "active" }
            else -> users.find { it.role == "customer" }
        } ?: return Result.failure(IllegalStateException("Demo user for $role not found"))

        prefs.edit().putString("user_id", target.id).apply()
        _currentUser.value = target
        return Result.success(target)
    }

    fun logout() {
        prefs.edit().remove("user_id").apply()
        _currentUser.value = null
    }

    fun registerCustomer(
        name: String, phone: String, email: String, password: String,
        address: String, building: String, locality: String, landmark: String,
        language: String, serviceAreaId: String
    ): Result<User> {
        if (name.isBlank() || phone.isBlank() || password.isBlank() || address.isBlank() || locality.isBlank()) {
            return Result.failure(IllegalArgumentException("Name, phone, password, address, and locality are required fields."))
        }
        if (_database.value.users.any { it.phone == phone.trim() }) {
            return Result.failure(IllegalArgumentException("An account with this phone number already exists."))
        }
        val newId = "usr_cust_${System.currentTimeMillis()}"
        val runner = _database.value.runnerProfiles.find { it.isApproved && it.isAvailable }
        val cleanDigits = phone.filter { it.isDigit() }
        val newUser = User(
            id = newId,
            role = "customer",
            name = name.trim(),
            phone = phone.trim(),
            email = email.trim().ifBlank { "$cleanDigits@customer.mpartner.com" },
            passwordHash = sha256(password),
            address = address.trim(),
            building = building.trim(),
            locality = locality.trim(),
            landmark = landmark.trim(),
            language = language.ifBlank { "English" },
            status = "active",
            assignedRunnerId = runner?.userId,
            serviceAreaId = serviceAreaId.ifBlank { "area_1" },
            createdAt = nowIso()
        )
        val newWallet = Wallet("wal_${System.currentTimeMillis()}", newId, 0.0, nowIso())
        updateDatabase { db ->
            db.copy(users = db.users + newUser, wallets = db.wallets + newWallet)
                .withAuditLog(newId, newUser.name, "customer", "CUSTOMER_REGISTER", "customer", newId, "Customer registered: ${newUser.name}")
        }
        prefs.edit().putString("user_id", newId).apply()
        _currentUser.value = newUser
        return Result.success(newUser)
    }

    fun registerRunner(
        name: String, phone: String, email: String, password: String,
        address: String, serviceAreaId: String, languages: List<String>, vehicleType: String
    ): Result<User> {
        if (name.isBlank() || phone.isBlank() || password.isBlank() || serviceAreaId.isBlank()) {
            return Result.failure(IllegalArgumentException("Name, phone, password, and service area are required."))
        }
        if (_database.value.users.any { it.phone == phone.trim() }) {
            return Result.failure(IllegalArgumentException("An account with this phone number already exists."))
        }
        val newId = "usr_run_${System.currentTimeMillis()}"
        val cleanDigits = phone.filter { it.isDigit() }
        val langs = languages.ifEmpty { listOf("English") }
        val newUser = User(
            id = newId,
            role = "runner",
            name = name.trim(),
            phone = phone.trim(),
            email = email.trim().ifBlank { "$cleanDigits@runner.mpartner.com" },
            passwordHash = sha256(password),
            address = address.trim(),
            language = langs.joinToString(", "),
            status = "pending",
            serviceAreaId = serviceAreaId,
            createdAt = nowIso()
        )
        val profile = RunnerProfile("prof_${System.currentTimeMillis()}", newId, serviceAreaId, langs, false, false, 0, 5.0, vehicleType.ifBlank { "Two Wheeler" })
        updateDatabase { db ->
            db.copy(users = db.users + newUser, runnerProfiles = db.runnerProfiles + profile)
                .withAuditLog(newId, newUser.name, "runner", "RUNNER_REGISTER", "runner", newId, "Runner application submitted by ${newUser.name}")
        }
        prefs.edit().putString("user_id", newId).apply()
        _currentUser.value = newUser
        return Result.success(newUser)
    }

    fun createOrder(items: List<OrderItem>, deliveryAddress: String, notes: String, preferredDeliveryTime: String): Result<Order> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        if (user.role != "customer") return Result.failure(IllegalStateException("Customer access only"))
        if (items.isEmpty()) return Result.failure(IllegalArgumentException("Please add at least one item to order"))

        val db = _database.value
        val activeSub = db.userSubscriptions.find { it.userId == user.id && it.status == "active" }
            ?: return Result.failure(IllegalStateException("An active subscription is required to place an order."))
        if (activeSub.creditsRemaining <= 0) {
            return Result.failure(IllegalStateException("Your subscription order credits have been exhausted."))
        }
        if (runCatching { Instant.parse(activeSub.expiresAt).isBefore(Instant.now()) }.getOrDefault(false)) {
            updateDatabase { cur ->
                cur.copy(userSubscriptions = cur.userSubscriptions.map {
                    if (it.id == activeSub.id) it.copy(status = "expired") else it
                })
            }
            return Result.failure(IllegalStateException("Your subscription has expired. Please renew your plan."))
        }

        val runner = user.assignedRunnerId?.let { rid -> db.users.find { it.id == rid } }
        val orderNum = "MP-${Random.nextInt(1000, 9999)}"
        val orderId = "ord_${System.currentTimeMillis()}"
        val otp = Random.nextInt(1000, 9999).toString()
        val formattedItems = items.mapIndexed { idx, item -> item.copy(id = "itm_${System.currentTimeMillis()}_$idx", isAvailable = true) }
        val estTotal = formattedItems.sumOf { it.estimatedPrice ?: 0.0 }

        val newOrder = Order(
            id = orderId,
            orderNumber = orderNum,
            customerId = user.id,
            customerName = user.name,
            customerPhone = user.phone,
            deliveryAddress = deliveryAddress.ifBlank { user.address ?: "Registered address" },
            runnerId = runner?.id,
            runnerName = runner?.name,
            runnerPhone = runner?.phone,
            items = formattedItems,
            status = if (runner != null) "runner_assigned" else "order_placed",
            notes = notes,
            preferredDeliveryTime = preferredDeliveryTime.ifBlank { "As soon as possible" },
            totalEstimatedPrice = if (estTotal > 0) estTotal else null,
            deliveryOtp = otp,
            creditDeducted = false,
            walletDebited = false,
            createdAt = nowIso(),
            updatedAt = nowIso()
        )
        updateDatabase { cur ->
            var next = cur.copy(orders = listOf(newOrder) + cur.orders)
                .withAuditLog(user.id, user.name, "customer", "CREATE_ORDER", "order", orderId, "Placed order #$orderNum (${formattedItems.size} items)")
            if (runner != null) {
                next = next.withNotification(runner.id, "new_order", "New Order #$orderNum", "${user.name} placed a new order.")
            }
            next
        }
        return Result.success(newOrder)
    }

    fun confirmPrice(orderId: String, approved: Boolean, rejectionReason: String = ""): Result<String> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val order = _database.value.orders.find { it.id == orderId && it.customerId == user.id }
            ?: return Result.failure(IllegalArgumentException("Order not found"))
        if (order.status != "price_confirmation_pending") {
            return Result.failure(IllegalStateException("Cannot confirm price in status (${order.status})."))
        }
        updateDatabase { db ->
            val updatedOrder = if (approved) order.copy(status = "price_confirmed", updatedAt = nowIso())
            else order.copy(status = "cancelled", cancellationReason = rejectionReason.ifBlank { "Customer rejected prices" }, updatedAt = nowIso())
            db.copy(orders = db.orders.map { if (it.id == orderId) updatedOrder else it })
                .withAuditLog(user.id, user.name, "customer", if (approved) "CONFIRM_PRICE_APPROVED" else "CONFIRM_PRICE_REJECTED", "order", order.id, "Price ${if (approved) "approved" else "rejected"} for #${order.orderNumber}")
        }
        return Result.success(if (approved) "Price confirmed! Runner is proceeding to purchase." else "Price rejected. Order cancelled.")
    }

    fun confirmDeliveryByCustomer(orderId: String): Result<String> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val order = _database.value.orders.find { it.id == orderId && it.customerId == user.id }
            ?: return Result.failure(IllegalArgumentException("Order not found"))
        if (order.status == "completed") return Result.failure(IllegalStateException("Order already completed."))
        completeOrderAtomically(order, user.id, user.name, "customer")
        return Result.success("Delivery confirmed! 1 credit consumed. Thank you for using M-PARTNER.")
    }

    private fun completeOrderAtomically(order: Order, actorId: String, actorName: String, actorRole: String) {
        updateDatabase { db ->
            var subs = db.userSubscriptions
            var subLedger = db.subscriptionLedger
            var creditDeducted = order.creditDeducted

            if (!creditDeducted) {
                val activeSub = subs.find { it.userId == order.customerId && it.status == "active" }
                if (activeSub != null && activeSub.creditsRemaining > 0) {
                    val remaining = activeSub.creditsRemaining - 1
                    subs = subs.map {
                        if (it.id == activeSub.id) it.copy(creditsRemaining = remaining, status = if (remaining == 0) "exhausted" else it.status) else it
                    }
                    subLedger = subLedger + SubscriptionLedgerEntry("sledg_${System.currentTimeMillis()}", order.customerId, activeSub.id, order.id, -1, "Credit consumed for completed delivery #${order.orderNumber}", nowIso())
                    creditDeducted = true
                }
            }

            var wallets = db.wallets
            var walletLedger = db.walletLedger
            var walletDebited = order.walletDebited
            val actualCost = order.totalActualPrice ?: order.totalEstimatedPrice ?: 0.0

            if (actualCost > 0.0 && !walletDebited) {
                val wallet = wallets.find { it.userId == order.customerId }
                if (wallet != null) {
                    wallets = wallets.map { if (it.id == wallet.id) it.copy(balance = it.balance - actualCost, updatedAt = nowIso()) else it }
                    walletLedger = walletLedger + WalletLedgerEntry("wledg_${System.currentTimeMillis()}", wallet.id, order.customerId, "debit", actualCost, order.id, null, "approved", "Product cost for #${order.orderNumber}", nowIso())
                    walletDebited = true
                }
            }

            val completedOrder = order.copy(
                creditDeducted = creditDeducted,
                walletDebited = walletDebited,
                runnerCommission = order.runnerCommission ?: db.settings.runnerCommissionPerDelivery,
                runnerSettlementStatus = order.runnerSettlementStatus ?: "pending",
                status = "completed",
                updatedAt = nowIso()
            )
            db.copy(
                userSubscriptions = subs,
                subscriptionLedger = subLedger,
                wallets = wallets,
                walletLedger = walletLedger,
                orders = db.orders.map { if (it.id == order.id) completedOrder else it }
            )
                .withAuditLog(actorId, actorName, actorRole, "COMPLETE_ORDER", "order", order.id, "Order #${order.orderNumber} completed. 1 credit deducted.")
                .withNotification(order.customerId, "order_completed", "Delivery Completed", "Order #${order.orderNumber} completed!")
        }
    }

    fun cancelOrder(orderId: String, reason: String): Result<String> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val order = _database.value.orders.find { it.id == orderId && it.customerId == user.id }
            ?: return Result.failure(IllegalArgumentException("Order not found"))
        if (order.status in setOf("shopping_in_progress", "purchase_recorded", "out_for_delivery", "delivered_pending_completion", "completed")) {
            return Result.failure(IllegalStateException("Cannot cancel order once shopping has commenced."))
        }
        updateDatabase { db ->
            val updated = order.copy(status = "cancelled", cancellationReason = reason.ifBlank { "Cancelled by customer" }, updatedAt = nowIso())
            db.copy(orders = db.orders.map { if (it.id == orderId) updated else it })
                .withAuditLog(user.id, user.name, "customer", "CANCEL_ORDER", "order", order.id, "Order #${order.orderNumber} cancelled")
        }
        return Result.success("Order #${order.orderNumber} cancelled.")
    }

    fun requestWalletRecharge(amount: Double, paymentReference: String, paymentMethod: String): Result<RechargeRequest> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        if (amount < 50.0) return Result.failure(IllegalArgumentException("Minimum recharge amount is ₹50"))
        val req = RechargeRequest(
            id = "rech_${System.currentTimeMillis()}",
            userId = user.id,
            userName = user.name,
            amount = amount,
            paymentReference = paymentReference.ifBlank { "UPI-${System.currentTimeMillis().toString().takeLast(6)}" },
            paymentMethod = paymentMethod.ifBlank { "UPI Transfer" },
            status = "pending",
            createdAt = nowIso()
        )
        updateDatabase { db ->
            db.copy(rechargeRequests = listOf(req) + db.rechargeRequests)
                .withAuditLog(user.id, user.name, "customer", "REQUEST_WALLET_RECHARGE", "wallet", req.id, "Requested recharge ₹$amount")
        }
        return Result.success(req)
    }

    fun purchaseSubscription(planId: String, paymentReference: String): Result<UserSubscription> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val db = _database.value
        val plan = db.subscriptionPlans.find { it.id == planId && it.isActive }
            ?: return Result.failure(IllegalArgumentException("Subscription plan not found"))
        val existingActive = db.userSubscriptions.find { it.userId == user.id && it.status == "active" }
        if (existingActive != null && existingActive.creditsRemaining > 0) {
            return Result.failure(IllegalStateException("You already have an active ${existingActive.planName} plan with ${existingActive.creditsRemaining} credits remaining."))
        }
        val now = Instant.now()
        val expires = now.plus(plan.validityDays.toLong(), ChronoUnit.DAYS)
        val sub = UserSubscription("sub_${System.currentTimeMillis()}", user.id, plan.id, plan.name, "pending_verification", plan.credits, plan.credits, now.toString(), expires.toString(), paymentReference.ifBlank { "SUB-UPI-${System.currentTimeMillis().toString().takeLast(6)}" })
        updateDatabase { cur ->
            cur.copy(userSubscriptions = listOf(sub) + cur.userSubscriptions)
                .withAuditLog(user.id, user.name, "customer", "SUBMIT_SUBSCRIPTION_PURCHASE", "subscription", sub.id, "Submitted ${plan.name} plan")
        }
        return Result.success(sub)
    }

    fun markAllNotificationsRead() {
        val user = _currentUser.value ?: return
        updateDatabase { db ->
            db.copy(notifications = db.notifications.map { if (it.userId == user.id) it.copy(isRead = true) else it })
        }
    }

    fun markNotificationRead(id: String) {
        val user = _currentUser.value ?: return
        updateDatabase { db ->
            db.copy(notifications = db.notifications.map { if (it.id == id && it.userId == user.id) it.copy(isRead = true) else it })
        }
    }

    fun toggleRunnerAvailability(available: Boolean) {
        val user = _currentUser.value ?: return
        updateDatabase { db ->
            db.copy(runnerProfiles = db.runnerProfiles.map { if (it.userId == user.id) it.copy(isAvailable = available) else it })
        }
    }

    fun acceptOrder(orderId: String): Result<String> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val order = _database.value.orders.find { it.id == orderId && it.runnerId == user.id }
            ?: return Result.failure(IllegalArgumentException("Order not found"))
        if (order.status !in listOf("order_placed", "runner_assigned")) return Result.failure(IllegalStateException("Invalid order status"))
        updateDatabase { db ->
            db.copy(orders = db.orders.map { if (it.id == orderId) it.copy(status = "order_accepted", updatedAt = nowIso()) else it })
                .withAuditLog(user.id, user.name, "runner", "ACCEPT_ORDER", "order", order.id, "Accepted #${order.orderNumber}")
                .withNotification(order.customerId, "order_accepted", "Order Accepted", "Runner ${user.name} accepted #${order.orderNumber}.")
        }
        return Result.success("Order accepted!")
    }

    fun rejectOrder(orderId: String, reason: String): Result<String> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val order = _database.value.orders.find { it.id == orderId && it.runnerId == user.id }
            ?: return Result.failure(IllegalArgumentException("Order not found"))
        val note = reason.ifBlank { "Runner unavailable" }
        updateDatabase { db ->
            db.copy(orders = db.orders.map { if (it.id == orderId) it.copy(status = "rejected", cancellationReason = note, updatedAt = nowIso()) else it })
                .withAuditLog(user.id, user.name, "runner", "REJECT_ORDER", "order", order.id, "Rejected #${order.orderNumber}")
                .withNotification(order.customerId, "order_status", "Order Update", "Runner could not accept #${order.orderNumber}: $note")
        }
        return Result.success("Order rejected.")
    }

    fun startShopping(orderId: String): Result<String> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val order = _database.value.orders.find { it.id == orderId && it.runnerId == user.id }
            ?: return Result.failure(IllegalArgumentException("Order not found"))
        updateDatabase { db ->
            db.copy(orders = db.orders.map { if (it.id == orderId) it.copy(status = "shopping_in_progress", updatedAt = nowIso()) else it })
                .withAuditLog(user.id, user.name, "runner", "START_SHOPPING", "order", order.id, "Started shopping for #${order.orderNumber}")
                .withNotification(order.customerId, "order_status", "Runner Shopping", "Your Runner ${user.name} has started shopping.")
        }
        return Result.success("Shopping in progress.")
    }

    fun submitPriceConfirmation(orderId: String, updatedItems: List<OrderItem>, shopName: String): Result<String> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val order = _database.value.orders.find { it.id == orderId && it.runnerId == user.id }
            ?: return Result.failure(IllegalArgumentException("Order not found"))
        val total = updatedItems.sumOf { it.confirmedPrice ?: it.unitPrice ?: 0.0 }
        val resolvedShop = shopName.ifBlank { order.shopName ?: "Local Partner Store" }
        updateDatabase { db ->
            db.copy(orders = db.orders.map {
                if (it.id == orderId) it.copy(items = updatedItems, shopName = resolvedShop, totalActualPrice = total, totalEstimatedPrice = total, status = "price_confirmation_pending", updatedAt = nowIso()) else it
            })
                .withAuditLog(user.id, user.name, "runner", "SUBMIT_PRICE_CONFIRMATION", "order", order.id, "Submitted ₹$total at $resolvedShop")
                .withNotification(order.customerId, "price_confirmation_pending", "Price Approval Required", "Runner submitted ₹$total bill at $resolvedShop.")
        }
        return Result.success("Price verification sent to customer!")
    }

    fun recordPurchase(orderId: String, actualAmount: Double, shopName: String, paymentMethod: String): Result<String> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        if (actualAmount <= 0.0) return Result.failure(IllegalArgumentException("Enter a valid purchase amount"))
        val order = _database.value.orders.find { it.id == orderId && it.runnerId == user.id }
            ?: return Result.failure(IllegalArgumentException("Order not found"))
        val resolvedShop = shopName.ifBlank { order.shopName ?: "Local Partner Store" }
        val resolvedMethod = paymentMethod.ifBlank { "UPI / QR Code" }
        updateDatabase { db ->
            db.copy(orders = db.orders.map {
                if (it.id == orderId) it.copy(totalActualPrice = actualAmount, amountPaidToShop = actualAmount, amountChargedToCustomer = actualAmount, shopName = resolvedShop, shopPaymentMethod = resolvedMethod, status = "purchase_recorded", updatedAt = nowIso()) else it
            })
                .withAuditLog(user.id, user.name, "runner", "RECORD_PURCHASE", "order", order.id, "Paid ₹$actualAmount at $resolvedShop")
                .withNotification(order.customerId, "order_status", "Purchase Completed", "Runner paid ₹$actualAmount at $resolvedShop.")
        }
        return Result.success("Purchase recorded!")
    }

    fun markOutForDelivery(orderId: String): Result<String> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val order = _database.value.orders.find { it.id == orderId && it.runnerId == user.id }
            ?: return Result.failure(IllegalArgumentException("Order not found"))
        updateDatabase { db ->
            db.copy(orders = db.orders.map { if (it.id == orderId) it.copy(status = "out_for_delivery", updatedAt = nowIso()) else it })
                .withAuditLog(user.id, user.name, "runner", "OUT_FOR_DELIVERY", "order", order.id, "#${order.orderNumber} out for delivery")
                .withNotification(order.customerId, "out_for_delivery", "Out for Delivery", "Runner heading to you with #${order.orderNumber}.")
        }
        return Result.success("Marked Out for Delivery!")
    }

    fun requestCompletion(orderId: String): Result<String> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val order = _database.value.orders.find { it.id == orderId && it.runnerId == user.id }
            ?: return Result.failure(IllegalArgumentException("Order not found"))
        updateDatabase { db ->
            db.copy(orders = db.orders.map { if (it.id == orderId) it.copy(status = "delivered_pending_completion", updatedAt = nowIso()) else it })
                .withAuditLog(user.id, user.name, "runner", "REQUEST_COMPLETION", "order", order.id, "Arrived for #${order.orderNumber}")
                .withNotification(order.customerId, "order_delivered", "Runner at Doorstep", "Share Delivery OTP ${order.deliveryOtp} for #${order.orderNumber}.")
        }
        return Result.success("Marked arrived! Ask customer for 4-digit OTP.")
    }

    fun completeOrderWithOtp(orderId: String, otp: String): Result<String> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val db = _database.value
        val order = db.orders.find { it.id == orderId && it.runnerId == user.id }
            ?: return Result.failure(IllegalArgumentException("Order not found"))
        if (order.status == "completed") return Result.failure(IllegalStateException("Order already completed"))
        if (db.settings.requireDeliveryOtp && !order.deliveryOtp.isNullOrBlank() && otp.trim() != order.deliveryOtp.trim()) {
            return Result.failure(IllegalArgumentException("Invalid Delivery OTP. Please verify with customer."))
        }
        completeOrderAtomically(order, user.id, user.name, "runner")
        return Result.success("Order #${order.orderNumber} completed and verified!")
    }

    fun sendChatMessage(orderId: String, text: String): Result<ChatMessage> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val cleanText = text.trim()
        if (cleanText.isEmpty()) return Result.failure(IllegalArgumentException("Message text is required"))

        val nowMs = System.currentTimeMillis()
        val recent = rateLimitMap.getOrPut(user.id) { mutableListOf() }.filter { nowMs - it < 10_000L }.toMutableList()
        if (recent.size >= 5) return Result.failure(IllegalStateException("You are sending messages too quickly. Please wait a few seconds."))
        recent.add(nowMs)
        rateLimitMap[user.id] = recent

        val db = _database.value
        val order = db.orders.find { it.id == orderId } ?: return Result.failure(IllegalArgumentException("Order not found"))
        if (user.role == "customer" && order.customerId != user.id) return Result.failure(IllegalStateException("Access denied"))
        if (user.role == "runner" && order.runnerId != user.id) return Result.failure(IllegalStateException("Access denied"))

        if (db.settings.chatModerationEnabled) {
            val normalized = Normalizer.normalize(cleanText.lowercase(), Normalizer.Form.NFKD).replace(Regex("[\\u0300-\\u036f]"), "")
            val flagged = db.settings.bannedKeywords.filter { kw ->
                Regex("\\b${Regex.escape(kw.lowercase())}\\b", RegexOption.IGNORE_CASE).containsMatchIn(normalized)
            }
            if (flagged.isNotEmpty()) {
                val modLog = ModerationLog("mod_${System.currentTimeMillis()}", user.id, user.name, cleanText, flagged, "blocked", nowIso())
                updateDatabase { cur ->
                    cur.copy(moderationLogs = listOf(modLog) + cur.moderationLogs)
                        .withAuditLog(user.id, user.name, user.role, "MESSAGE_BLOCKED", "moderation", orderId, "Blocked message violating community guidelines.")
                }
                return Result.failure(IllegalArgumentException("Your message could not be sent because it violates the community guidelines."))
            }
        }

        val msg = ChatMessage("msg_${System.currentTimeMillis()}_${Random.nextInt(100, 999)}", orderId, user.id, user.name, user.role, cleanText, createdAt = nowIso())
        val receiverId = if (user.role == "customer") order.runnerId else order.customerId
        updateDatabase { cur ->
            var next = cur.copy(messages = cur.messages + msg)
            if (receiverId != null) next = next.withNotification(receiverId, "new_message", "New Message from ${user.name}", "${cleanText.take(50)} (#${order.orderNumber})")
            next
        }
        return Result.success(msg)
    }

    fun reportMessage(messageId: String, reason: String): Result<String> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("Authentication required"))
        val msg = _database.value.messages.find { it.id == messageId } ?: return Result.failure(IllegalArgumentException("Message not found"))
        val report = ContentReport("rep_${System.currentTimeMillis()}", user.id, user.name, msg.senderId, msg.senderName, msg.id, msg.orderId, msg.text, reason.ifBlank { "Inappropriate content" }, "pending", createdAt = nowIso())
        updateDatabase { db ->
            db.copy(
                messages = db.messages.map { if (it.id == messageId) it.copy(isReported = true, reportCount = (it.reportCount ?: 0) + 1) else it },
                contentReports = listOf(report) + db.contentReports
            ).withAuditLog(user.id, user.name, user.role, "REPORT_MESSAGE", "moderation", msg.id, "Reported message by ${msg.senderName}")
        }
        return Result.success("Thank you for reporting. Moderation team notified.")
    }

    fun submitSupportTicket(category: String, subject: String, message: String, guestName: String = "", guestEmail: String = "", guestPhone: String = ""): Result<SupportTicket> {
        if (subject.isBlank() || message.isBlank()) return Result.failure(IllegalArgumentException("Subject and message are required"))
        val user = _currentUser.value
        val finalMsg = if (user == null && guestPhone.isNotBlank()) "$message\n\nPhone: $guestPhone" else message
        val ticket = SupportTicket("tkt_${System.currentTimeMillis()}", user?.id ?: "guest", user?.name ?: guestName.ifBlank { "Guest User" }, user?.email ?: guestEmail.ifBlank { "guest@mpartner.in" }, user?.role ?: "guest", category.ifBlank { "general" }, subject.trim(), finalMsg.trim(), "open", createdAt = nowIso(), updatedAt = nowIso())
        updateDatabase { db -> db.copy(supportTickets = listOf(ticket) + db.supportTickets) }
        return Result.success(ticket)
    }

    fun approveRunner(runnerId: String): Result<String> {
        val admin = _currentUser.value ?: return Result.failure(IllegalStateException("Admin required"))
        val target = _database.value.users.find { it.id == runnerId && it.role == "runner" } ?: return Result.failure(IllegalArgumentException("Runner not found"))
        updateDatabase { db ->
            db.copy(
                users = db.users.map { if (it.id == runnerId) it.copy(status = "active") else it },
                runnerProfiles = db.runnerProfiles.map { if (it.userId == runnerId) it.copy(isApproved = true, isAvailable = true) else it }
            ).withAuditLog(admin.id, admin.name, "admin", "APPROVE_RUNNER", "runner", runnerId, "Approved runner ${target.name}")
        }
        return Result.success("Runner ${target.name} approved and activated!")
    }

    fun rejectRunner(runnerId: String): Result<String> {
        val admin = _currentUser.value ?: return Result.failure(IllegalStateException("Admin required"))
        val target = _database.value.users.find { it.id == runnerId && it.role == "runner" } ?: return Result.failure(IllegalArgumentException("Runner not found"))
        updateDatabase { db ->
            db.copy(
                users = db.users.map { if (it.id == runnerId) it.copy(status = "suspended") else it },
                runnerProfiles = db.runnerProfiles.map { if (it.userId == runnerId) it.copy(isApproved = false, isAvailable = false) else it }
            ).withAuditLog(admin.id, admin.name, "admin", "REJECT_RUNNER", "runner", runnerId, "Rejected runner ${target.name}")
        }
        return Result.success("Runner ${target.name} rejected.")
    }

    fun assignRunnerToCustomer(customerId: String, runnerId: String): Result<String> {
        val admin = _currentUser.value ?: return Result.failure(IllegalStateException("Admin required"))
        val cust = _database.value.users.find { it.id == customerId } ?: return Result.failure(IllegalArgumentException("Customer not found"))
        val runner = _database.value.users.find { it.id == runnerId && it.role == "runner" }
        updateDatabase { db ->
            db.copy(users = db.users.map { if (it.id == customerId) it.copy(assignedRunnerId = runner?.id) else it })
                .withAuditLog(admin.id, admin.name, "admin", "ASSIGN_DESIGNATED_RUNNER", "customer", customerId, "Assigned ${runner?.name ?: "None"} to ${cust.name}")
        }
        return Result.success(if (runner != null) "Runner ${runner.name} assigned to ${cust.name}" else "Runner unassigned.")
    }

    fun toggleUserStatus(userId: String): Result<String> {
        val admin = _currentUser.value ?: return Result.failure(IllegalStateException("Admin required"))
        if (userId == admin.id) return Result.failure(IllegalArgumentException("Admin cannot suspend own account"))
        val target = _database.value.users.find { it.id == userId } ?: return Result.failure(IllegalArgumentException("User not found"))
        val nextStatus = if (target.status == "active") "suspended" else "active"
        updateDatabase { db ->
            db.copy(users = db.users.map { if (it.id == userId) it.copy(status = nextStatus) else it })
                .withAuditLog(admin.id, admin.name, "admin", "TOGGLE_USER_STATUS", target.role, userId, "Changed ${target.name} status to $nextStatus")
        }
        return Result.success("${target.name} status set to $nextStatus.")
    }

    fun verifySubscription(subId: String): Result<String> {
        val admin = _currentUser.value ?: return Result.failure(IllegalStateException("Admin required"))
        val sub = _database.value.userSubscriptions.find { it.id == subId } ?: return Result.failure(IllegalArgumentException("Subscription not found"))
        val now = Instant.now()
        val expires = now.plus(30, ChronoUnit.DAYS)
        val entry = SubscriptionLedgerEntry("sledg_${System.currentTimeMillis()}", sub.userId, sub.id, null, sub.creditsTotal, "Subscription verified by Admin (${sub.planName}: +${sub.creditsTotal} credits)", nowIso())
        updateDatabase { db ->
            db.copy(
                userSubscriptions = db.userSubscriptions.map {
                    if (it.id == subId) it.copy(status = "active", verifiedAt = nowIso(), startDate = now.toString(), expiresAt = expires.toString()) else it
                },
                subscriptionLedger = listOf(entry) + db.subscriptionLedger
            ).withAuditLog(admin.id, admin.name, "admin", "VERIFY_SUBSCRIPTION", "subscription", subId, "Verified ${sub.planName}")
        }
        return Result.success("Subscription activated! ${sub.creditsTotal} credits issued.")
    }

    fun approveRecharge(rechargeId: String): Result<String> {
        val admin = _currentUser.value ?: return Result.failure(IllegalStateException("Admin required"))
        val req = _database.value.rechargeRequests.find { it.id == rechargeId } ?: return Result.failure(IllegalArgumentException("Recharge not found"))
        if (req.status == "approved") return Result.failure(IllegalStateException("Already approved"))
        updateDatabase { db ->
            val existingWallet = db.wallets.find { it.userId == req.userId }
            val wallet = existingWallet ?: Wallet("wal_${System.currentTimeMillis()}", req.userId, 0.0, nowIso())
            val newBal = wallet.balance + req.amount
            val updatedWallets = if (existingWallet != null) {
                db.wallets.map { if (it.id == wallet.id) it.copy(balance = newBal, updatedAt = nowIso()) else it }
            } else {
                db.wallets + wallet.copy(balance = newBal)
            }
            val ledger = WalletLedgerEntry("wledg_${System.currentTimeMillis()}", wallet.id, req.userId, "credit", req.amount, null, req.id, "approved", "Wallet recharge verified (Ref: ${req.paymentReference ?: "UPI"})", nowIso())
            db.copy(
                wallets = updatedWallets,
                walletLedger = listOf(ledger) + db.walletLedger,
                rechargeRequests = db.rechargeRequests.map {
                    if (it.id == rechargeId) it.copy(status = "approved", reviewedBy = admin.id, reviewedAt = nowIso()) else it
                }
            ).withAuditLog(admin.id, admin.name, "admin", "APPROVE_WALLET_RECHARGE", "wallet", rechargeId, "Approved ₹${req.amount} recharge")
        }
        return Result.success("Recharge of ₹${req.amount} approved!")
    }

    fun rejectRecharge(rechargeId: String, reason: String): Result<String> {
        val admin = _currentUser.value ?: return Result.failure(IllegalStateException("Admin required"))
        val req = _database.value.rechargeRequests.find { it.id == rechargeId } ?: return Result.failure(IllegalArgumentException("Recharge not found"))
        val note = reason.ifBlank { "Payment not received or invalid reference." }
        updateDatabase { db ->
            db.copy(rechargeRequests = db.rechargeRequests.map {
                if (it.id == rechargeId) it.copy(status = "rejected", reviewedBy = admin.id, reviewedAt = nowIso(), adminNote = note) else it
            }).withAuditLog(admin.id, admin.name, "admin", "REJECT_WALLET_RECHARGE", "wallet", rechargeId, "Rejected ₹${req.amount} recharge")
        }
        return Result.success("Recharge rejected.")
    }

    fun issueRefund(customerId: String, amount: Double, reason: String): Result<String> {
        val admin = _currentUser.value ?: return Result.failure(IllegalStateException("Admin required"))
        if (amount <= 0) return Result.failure(IllegalArgumentException("Enter a valid refund amount"))
        if (reason.isBlank()) return Result.failure(IllegalArgumentException("Mandatory reason required for issuing a refund."))
        val wallet = _database.value.wallets.find { it.userId == customerId } ?: return Result.failure(IllegalArgumentException("Customer wallet not found"))
        val entry = WalletLedgerEntry("wledg_${System.currentTimeMillis()}", wallet.id, customerId, "refund", amount, null, null, "approved", "Admin refund: ${reason.trim()}", nowIso())
        updateDatabase { db ->
            db.copy(
                wallets = db.wallets.map { if (it.id == wallet.id) it.copy(balance = it.balance + amount, updatedAt = nowIso()) else it },
                walletLedger = listOf(entry) + db.walletLedger
            ).withAuditLog(admin.id, admin.name, "admin", "ISSUE_REFUND", "wallet", wallet.id, "Issued ₹$amount refund to $customerId")
        }
        return Result.success("Refund of ₹$amount credited.")
    }

    fun overrideOrderStatus(orderId: String, newStatus: String): Result<String> {
        val admin = _currentUser.value ?: return Result.failure(IllegalStateException("Admin required"))
        val order = _database.value.orders.find { it.id == orderId } ?: return Result.failure(IllegalArgumentException("Order not found"))
        updateDatabase { db ->
            db.copy(orders = db.orders.map { if (it.id == orderId) it.copy(status = newStatus, updatedAt = nowIso()) else it })
                .withAuditLog(admin.id, admin.name, "admin", "OVERRIDE_ORDER_STATUS", "order", orderId, "Changed #${order.orderNumber} to $newStatus")
        }
        return Result.success("Order #${order.orderNumber} updated to $newStatus")
    }

    fun updateSettings(upiId: String, supportPhone: String, supportEmail: String, requireOtp: Boolean, allowMultiRunner: Boolean): Result<String> {
        val admin = _currentUser.value ?: return Result.failure(IllegalStateException("Admin required"))
        updateDatabase { db ->
            db.copy(
                settings = db.settings.copy(
                    upiId = upiId.ifBlank { db.settings.upiId },
                    supportPhone = supportPhone.ifBlank { db.settings.supportPhone },
                    supportEmail = supportEmail.ifBlank { db.settings.supportEmail },
                    requireDeliveryOtp = requireOtp,
                    allowMultiRunnerSelection = allowMultiRunner
                )
            ).withAuditLog(admin.id, admin.name, "admin", "UPDATE_SETTINGS", "system", "settings", "Updated platform configuration")
        }
        return Result.success("Platform settings saved.")
    }

    fun createServiceArea(name: String, city: String, pincode: String): Result<String> {
        val admin = _currentUser.value ?: return Result.failure(IllegalStateException("Admin required"))
        if (name.isBlank() || city.isBlank()) return Result.failure(IllegalArgumentException("Area name and city are required"))
        val area = ServiceArea("area_${System.currentTimeMillis()}", name.trim(), city.trim(), true, pincode.trim())
        updateDatabase { db ->
            db.copy(serviceAreas = db.serviceAreas + area)
                .withAuditLog(admin.id, admin.name, "admin", "CREATE_SERVICE_AREA", "system", area.id, "Added zone ${area.name}")
        }
        return Result.success("Service area ${area.name} added.")
    }

    fun resolveTicket(ticketId: String, notes: String): Result<String> {
        updateDatabase { db ->
            db.copy(supportTickets = db.supportTickets.map {
                if (it.id == ticketId) it.copy(status = "resolved", adminNotes = notes.ifBlank { "Resolved by operations team" }, updatedAt = nowIso()) else it
            })
        }
        return Result.success("Ticket marked resolved.")
    }

    fun resolveReport(reportId: String, action: String): Result<String> {
        val admin = _currentUser.value ?: return Result.failure(IllegalStateException("Admin required"))
        val report = _database.value.contentReports.find { it.id == reportId } ?: return Result.failure(IllegalArgumentException("Report not found"))
        val status = if (action == "dismiss") "dismissed" else "action_taken"
        updateDatabase { db ->
            var nextUsers = db.users
            if (action == "suspend_account" && report.reportedUserId != null) {
                nextUsers = db.users.map { if (it.id == report.reportedUserId) it.copy(status = "suspended") else it }
            }
            db.copy(
                users = nextUsers,
                contentReports = db.contentReports.map { if (it.id == reportId) it.copy(status = status) else it }
            ).withAuditLog(admin.id, admin.name, "admin", "RESOLVE_CONTENT_REPORT", "moderation", reportId, "Action: $action")
        }
        return Result.success("Content report updated ($status).")
    }
}
