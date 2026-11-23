package com.example.ui.screens.customer

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.firebase.DeliveryRequest
import com.example.model.*
import com.example.ui.FirestoreUiState
import com.example.ui.MainViewModel
import com.example.ui.components.*
import com.example.ui.theme.*
import kotlin.random.Random

@Composable
fun CustomerDashboardScreen(
    user: User,
    db: DatabaseSchema,
    viewModel: MainViewModel,
    firestoreRequestsState: FirestoreUiState<List<DeliveryRequest>>,
    isSubmittingFirestore: Boolean,
    onSubmitFirestoreRequest: (itemsText: String, address: String, preferredTime: String, notes: String, onClear: () -> Unit) -> Unit,
    onEditFirestoreRequest: (req: DeliveryRequest, itemsText: String, address: String, notes: String) -> Unit,
    onCancelFirestoreRequest: (requestId: String) -> Unit,
    onDeleteFirestoreRequest: (requestId: String) -> Unit,
    onOpenAiForOrder: ((List<OrderItem>, String) -> Unit) -> Unit
) {
    var activeTab by remember { mutableStateOf("overview") }

    val wallet = db.wallets.find { it.userId == user.id }
    val activeSub = db.userSubscriptions.find { it.userId == user.id && it.status == "active" }
    val customerOrders = remember(db.orders, user.id) {
        db.orders.filter { it.customerId == user.id }.sortedByDescending { it.createdAt }
    }
    val activeOrder = customerOrders.firstOrNull {
        it.status !in listOf("completed", "cancelled", "rejected")
    }
    val designatedRunner = user.assignedRunnerId?.let { rid -> db.users.find { it.id == rid } }
    val runnerProfile = designatedRunner?.let { r -> db.runnerProfiles.find { it.userId == r.id } }
    val alerts = remember(user, db) { viewModel.computeCustomerAlerts(user, db) }
    val unreadNotifs = db.notifications.count { it.userId == user.id && !it.isRead }

    var aiDraftText by remember { mutableStateOf<String?>(null) }
    var draftItems by remember {
        mutableStateOf(
            listOf(
                OrderItem(
                    id = "draft_${System.currentTimeMillis()}",
                    name = "",
                    quantity = 1.0,
                    unit = "kg",
                    estimatedPrice = 0.0
                )
            )
        )
    }
    var deliveryAddress by remember(user.id) {
        mutableStateOf(
            listOfNotNull(user.building, user.address, user.locality)
                .filter { it.isNotBlank() }
                .joinToString(", ")
                .ifBlank { user.locality ?: "Ambarnath (West)" }
        )
    }
    var orderNotes by remember { mutableStateOf("") }
    var preferredTime by remember { mutableStateOf("ASAP (Within 45 mins)") }

    var priceConfirmOrder by remember { mutableStateOf<Order?>(null) }
    var cancelOrderTarget by remember { mutableStateOf<Order?>(null) }

    Column(modifier = Modifier.fillMaxSize()) {
        Surface(color = BrandSurface, border = BorderStroke(1.dp, BrandBorder)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Hello, ${user.name}", fontWeight = FontWeight.Bold)
                    Text(
                        text = "${user.locality ?: "Ambarnath"} • Runner: ${designatedRunner?.name ?: "Assigning..."}",
                        style = MaterialTheme.typography.bodySmall,
                        color = BrandMutedText
                    )
                }
                if (unreadNotifs > 0) {
                    AssistChip(
                        onClick = { activeTab = "help" },
                        leadingIcon = { Icon(Icons.Default.Notifications, contentDescription = null, modifier = Modifier.size(16.dp)) },
                        label = { Text("$unreadNotifs New") },
                        modifier = Modifier.testTag("customer_unread_notifs_chip")
                    )
                }
            }
        }

        val tabs = listOf(
            "overview" to "Overview",
            "new_order" to "New Request",
            "orders" to "Orders (${customerOrders.size})",
            "wallet" to "Wallet",
            "subscription" to "Plans",
            "chat" to "Runner Chat",
            "help" to "Help"
        )

        LazyRow(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(tabs) { (key, label) ->
                FilterChip(
                    selected = activeTab == key,
                    onClick = { activeTab = key },
                    label = { Text(label) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = BrandBlack,
                        selectedLabelColor = BrandPureWhite
                    ),
                    modifier = Modifier.testTag("customer_tab_$key")
                )
            }
        }
        HorizontalDivider()

        when (activeTab) {
            "overview" -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (alerts.isNotEmpty()) {
                    items(alerts) { alert ->
                        Surface(
                            color = if (alert.isWarning) BrandAmberContainer else BrandEmeraldContainer,
                            shape = MaterialTheme.shapes.medium,
                            border = BorderStroke(1.dp, if (alert.isWarning) BrandAmber else BrandEmerald),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Text(alert.title, fontWeight = FontWeight.Bold)
                                    Text(alert.message, style = MaterialTheme.typography.bodySmall)
                                }
                                TextButton(
                                    onClick = { activeTab = alert.actionTab },
                                    modifier = Modifier.heightIn(min = 48.dp)
                                ) {
                                    Text("View", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                item {
                    DeliveryRequestComposerCard(
                        defaultAddress = deliveryAddress,
                        isSubmitting = isSubmittingFirestore,
                        externalItemsDraft = aiDraftText,
                        onConsumeExternalDraft = { aiDraftText = null },
                        onOpenAiSmartList = {
                            onOpenAiForOrder { aiItems, runnerNotes ->
                                val formatted = aiItems.joinToString("\n") { item ->
                                    "• ${item.name} (${item.unit}) ~₹${(item.estimatedPrice ?: 0.0).toInt()}"
                                }
                                aiDraftText = if (runnerNotes.isNotBlank()) "$formatted\nNote: $runnerNotes" else formatted
                            }
                        },
                        onSaveToFirestore = onSubmitFirestoreRequest
                    )
                }

                item {
                    FirestoreRequestsFeed(
                        state = firestoreRequestsState,
                        onEditRequest = onEditFirestoreRequest,
                        onCancelRequest = onCancelFirestoreRequest,
                        onDeleteRequest = onDeleteFirestoreRequest
                    )
                }

                item {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        KpiMetricCard(
                            title = "Wallet Balance",
                            value = formatInr(wallet?.balance ?: 0.0),
                            subtitle = "Pay for items at MRP",
                            icon = Icons.Default.AccountBalanceWallet,
                            accentColor = BrandEmerald,
                            modifier = Modifier.weight(1f)
                        )
                        KpiMetricCard(
                            title = "Plan Credits",
                            value = "${activeSub?.creditsRemaining ?: 0}",
                            subtitle = activeSub?.planName ?: "No active plan",
                            icon = Icons.Default.ConfirmationNumber,
                            accentColor = BrandBlack,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                item {
                    SectionHeader(title = "Active Neighborhood Order")
                }
                if (activeOrder != null) {
                    item {
                        CustomerOrderCard(
                            order = activeOrder,
                            onReviewPrices = { priceConfirmOrder = activeOrder },
                            onConfirmDelivery = { viewModel.confirmDeliveryByCustomer(activeOrder.id) },
                            onCancel = { cancelOrderTarget = activeOrder },
                            onOpenChat = { activeTab = "chat" }
                        )
                    }
                } else {
                    item {
                        Surface(
                            color = BrandSurface,
                            shape = MaterialTheme.shapes.medium,
                            border = BorderStroke(1.dp, BrandBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("No Active Runner Order Right Now", fontWeight = FontWeight.Bold)
                                Text(
                                    "Use Quick Delivery Request above or build a detailed itemized request in New Request.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = BrandMutedText
                                )
                            }
                        }
                    }
                }

                item {
                    SectionHeader(title = "Your Designated Partner Runner")
                }
                item {
                    Surface(
                        color = BrandPureWhite,
                        shape = MaterialTheme.shapes.large,
                        border = BorderStroke(1.dp, BrandBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            if (designatedRunner != null) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text(designatedRunner.name, fontWeight = FontWeight.ExtraBold)
                                    StatusPill(if (runnerProfile?.isAvailable == true) "Online" else "Offline")
                                }
                                Text(
                                    "${designatedRunner.phone} • ${runnerProfile?.vehicleType ?: "Two Wheeler"} • ★ ${runnerProfile?.rating ?: 4.95}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = BrandMutedText
                                )
                                if (runnerProfile?.languages?.isNotEmpty() == true) {
                                    Text("Languages: ${runnerProfile.languages.joinToString(", ")}", style = MaterialTheme.typography.bodySmall)
                                }
                            } else {
                                Text("Runner assignment pending by operations.", color = BrandMutedText)
                            }
                        }
                    }
                }
            }

            "new_order" -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    DeliveryRequestComposerCard(
                        defaultAddress = deliveryAddress,
                        isSubmitting = isSubmittingFirestore,
                        externalItemsDraft = aiDraftText,
                        onConsumeExternalDraft = { aiDraftText = null },
                        onOpenAiSmartList = {
                            onOpenAiForOrder { aiItems, runnerNotes ->
                                val formatted = aiItems.joinToString("\n") { item ->
                                    "• ${item.name} (${item.unit}) ~₹${(item.estimatedPrice ?: 0.0).toInt()}"
                                }
                                aiDraftText = if (runnerNotes.isNotBlank()) "$formatted\nNote: $runnerNotes" else formatted
                            }
                        },
                        onSaveToFirestore = onSubmitFirestoreRequest
                    )
                }

                item { HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp)) }

                item {
                    SectionHeader(
                        title = "Detailed Itemized Runner Order",
                        subtitle = if (activeSub != null) "1 delivery credit will be used (${activeSub.creditsRemaining} left)" else "Active subscription required to order"
                    )
                }

                item {
                    FilledTonalButton(
                        onClick = {
                            onOpenAiForOrder { aiItems, runnerNotes ->
                                if (aiItems.isNotEmpty()) {
                                    draftItems = aiItems
                                    if (runnerNotes.isNotBlank()) orderNotes = runnerNotes
                                }
                            }
                        },
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = BrandIndigoContainer,
                            contentColor = BrandIndigo
                        ),
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("new_order_ai_fill_button")
                    ) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Generate Items with Gemini AI Smart List")
                    }
                }

                itemsIndexed(draftItems) { idx, item ->
                    Surface(
                        color = BrandSurface,
                        shape = MaterialTheme.shapes.medium,
                        border = BorderStroke(1.dp, BrandBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Item #${idx + 1}", fontWeight = FontWeight.Bold)
                                if (draftItems.size > 1) {
                                    IconButton(
                                        onClick = {
                                            draftItems = draftItems.toMutableList().apply { removeAt(idx) }
                                        }
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = "Remove Item", tint = BrandRose)
                                    }
                                }
                            }
                            OutlinedTextField(
                                value = item.name,
                                onValueChange = { v ->
                                    draftItems = draftItems.toMutableList().apply { set(idx, item.copy(name = v)) }
                                },
                                label = { Text("Item Name (e.g. Amul Taaza Milk)") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth().testTag("order_item_name_$idx")
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(
                                    value = if (item.quantity == item.quantity.toInt().toDouble()) item.quantity.toInt().toString() else item.quantity.toString(),
                                    onValueChange = { v ->
                                        val qty = v.toDoubleOrNull() ?: 1.0
                                        draftItems = draftItems.toMutableList().apply { set(idx, item.copy(quantity = qty)) }
                                    },
                                    label = { Text("Qty") },
                                    singleLine = true,
                                    modifier = Modifier.weight(1f)
                                )
                                OutlinedTextField(
                                    value = item.unit,
                                    onValueChange = { v ->
                                        draftItems = draftItems.toMutableList().apply { set(idx, item.copy(unit = v)) }
                                    },
                                    label = { Text("Unit (kg, L, pkt)") },
                                    singleLine = true,
                                    modifier = Modifier.weight(1f)
                                )
                                OutlinedTextField(
                                    value = (item.estimatedPrice ?: 0.0).toInt().toString(),
                                    onValueChange = { v ->
                                        val est = v.toDoubleOrNull() ?: 0.0
                                        draftItems = draftItems.toMutableList().apply { set(idx, item.copy(estimatedPrice = est)) }
                                    },
                                    label = { Text("Est ₹") },
                                    singleLine = true,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }

                item {
                    OutlinedButton(
                        onClick = {
                            draftItems = draftItems + OrderItem(
                                id = "draft_${System.currentTimeMillis()}_${Random.nextInt(10, 99)}",
                                name = "",
                                quantity = 1.0,
                                unit = "piece",
                                estimatedPrice = 0.0
                            )
                        },
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("add_order_item_button")
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add Another Item")
                    }
                }

                item {
                    OutlinedTextField(
                        value = deliveryAddress,
                        onValueChange = { deliveryAddress = it },
                        label = { Text("Delivery Address") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                item {
                    OutlinedTextField(
                        value = preferredTime,
                        onValueChange = { preferredTime = it },
                        label = { Text("Preferred Time Slot") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                item {
                    OutlinedTextField(
                        value = orderNotes,
                        onValueChange = { orderNotes = it },
                        label = { Text("Shop / Brand Preferences or Runner Instructions") },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item {
                    val estTotal = draftItems.sumOf { (it.estimatedPrice ?: 0.0) }
                    Button(
                        onClick = {
                            val validItems = draftItems.filter { it.name.isNotBlank() }
                            val summaryText = validItems.joinToString(", ") {
                                "${it.name} (${it.quantity} ${it.unit})"
                            }
                            onSubmitFirestoreRequest(summaryText, deliveryAddress, preferredTime, orderNotes) {}
                            viewModel.createOrder(validItems, deliveryAddress, orderNotes, preferredTime) {
                                draftItems = listOf(
                                    OrderItem(
                                        id = "draft_${System.currentTimeMillis()}",
                                        name = "",
                                        quantity = 1.0,
                                        unit = "kg",
                                        estimatedPrice = 0.0
                                    )
                                )
                                orderNotes = ""
                                activeTab = "orders"
                            }
                        },
                        enabled = draftItems.any { it.name.isNotBlank() },
                        modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp).testTag("submit_order_button")
                    ) {
                        Text("Submit Order Request (Est. ${formatInr(estTotal)})")
                    }
                }
            }

            "orders" -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    FirestoreRequestsFeed(
                        state = firestoreRequestsState,
                        onEditRequest = onEditFirestoreRequest,
                        onCancelRequest = onCancelFirestoreRequest,
                        onDeleteRequest = onDeleteFirestoreRequest
                    )
                }
                item { SectionHeader(title = "Runner Order History & Live Tracking") }
                if (customerOrders.isEmpty()) {
                    item {
                        Text("No runner orders placed yet.", color = BrandMutedText)
                    }
                } else {
                    items(customerOrders) { order ->
                        CustomerOrderCard(
                            order = order,
                            onReviewPrices = { priceConfirmOrder = order },
                            onConfirmDelivery = { viewModel.confirmDeliveryByCustomer(order.id) },
                            onCancel = { cancelOrderTarget = order },
                            onOpenChat = { activeTab = "chat" }
                        )
                    }
                }
            }

            "wallet" -> CustomerWalletTab(
                wallet = wallet,
                ledger = db.walletLedger.filter { it.userId == user.id }.sortedByDescending { it.createdAt },
                recharges = db.rechargeRequests.filter { it.userId == user.id }.sortedByDescending { it.createdAt },
                settings = db.settings,
                onRequestRecharge = { amount, ref, method ->
                    viewModel.requestWalletRecharge(amount, ref, method)
                }
            )

            "subscription" -> CustomerPlansTab(
                plans = db.subscriptionPlans.filter { it.isActive },
                userSubs = db.userSubscriptions.filter { it.userId == user.id }.sortedByDescending { it.startDate },
                settings = db.settings,
                onPurchasePlan = { planId, ref ->
                    viewModel.purchaseSubscription(planId, ref)
                }
            )

            "chat" -> CustomerChatTab(
                currentUser = user,
                orders = customerOrders,
                messages = db.messages,
                onSendMessage = { oid, txt, onDone -> viewModel.sendChatMessage(oid, txt, onDone) },
                onReportMessage = { mid, reason -> viewModel.reportMessage(mid, reason) }
            )

            "help" -> CustomerHelpTab(
                notifications = db.notifications.filter { it.userId == user.id }.sortedByDescending { it.createdAt },
                tickets = db.supportTickets.filter { it.userId == user.id }.sortedByDescending { it.createdAt },
                settings = db.settings,
                onMarkAllRead = { viewModel.markAllNotificationsRead() },
                onSubmitTicket = { cat, subj, msg, onDone ->
                    viewModel.submitSupportTicket(cat, subj, msg, onSubmitted = onDone)
                }
            )
        }
    }

    priceConfirmOrder?.let { order ->
        var rejectReason by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { priceConfirmOrder = null },
            title = { Text("Confirm Store Prices (#${order.orderNumber})") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Store: ${order.shopName ?: "Local Store"}", fontWeight = FontWeight.SemiBold)
                    order.items.forEach { it ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${it.name} (${it.quantity} ${it.unit})", modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodySmall)
                            Text(formatInr(it.confirmedPrice ?: it.estimatedPrice), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                    HorizontalDivider()
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Total Verified Bill", fontWeight = FontWeight.Bold)
                        Text(formatInr(order.totalActualPrice ?: order.totalEstimatedPrice), fontWeight = FontWeight.ExtraBold, color = BrandEmerald)
                    }
                    OutlinedTextField(
                        value = rejectReason,
                        onValueChange = { rejectReason = it },
                        label = { Text("Reason if rejecting (optional)") },
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.confirmPrice(order.id, approved = true)
                        priceConfirmOrder = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald),
                    modifier = Modifier.testTag("customer_approve_price_button")
                ) { Text("Approve Prices") }
            },
            dismissButton = {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    TextButton(onClick = {
                        viewModel.confirmPrice(order.id, approved = false, reason = rejectReason)
                        priceConfirmOrder = null
                    }) { Text("Request Changes", color = BrandRose) }
                    TextButton(onClick = { priceConfirmOrder = null }) { Text("Close") }
                }
            }
        )
    }

    cancelOrderTarget?.let { order ->
        var reason by remember { mutableStateOf("Changed my mind") }
        AlertDialog(
            onDismissRequest = { cancelOrderTarget = null },
            title = { Text("Cancel Order #${order.orderNumber}") },
            text = {
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Cancellation Reason") }
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.cancelOrder(order.id, reason)
                        cancelOrderTarget = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BrandRose)
                ) { Text("Confirm Cancel") }
            },
            dismissButton = {
                TextButton(onClick = { cancelOrderTarget = null }) { Text("Keep Order") }
            }
        )
    }
}

@Composable
private fun CustomerOrderCard(
    order: Order,
    onReviewPrices: () -> Unit,
    onConfirmDelivery: () -> Unit,
    onCancel: () -> Unit,
    onOpenChat: () -> Unit
) {
    Surface(
        color = BrandPureWhite,
        shape = MaterialTheme.shapes.large,
        border = BorderStroke(1.dp, BrandBorder),
        modifier = Modifier.fillMaxWidth().testTag("customer_order_card_${order.orderNumber}")
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("#${order.orderNumber} • ${order.runnerName ?: "Unassigned"}", fontWeight = FontWeight.ExtraBold)
                    Text(order.deliveryAddress, style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                }
                StatusPill(order.status)
            }

            OrderStepBadgeRow(order.status)

            order.items.forEach { it ->
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("• ${it.name} (${it.quantity} ${it.unit})", style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                    Text(
                        formatInr(it.confirmedPrice ?: it.estimatedPrice),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            if (!order.deliveryOtp.isNullOrBlank() && order.status !in listOf("completed", "cancelled", "rejected")) {
                Surface(color = BrandEmeraldContainer, shape = MaterialTheme.shapes.small, border = BorderStroke(1.dp, BrandEmerald)) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("4-Digit Delivery Verification OTP", style = MaterialTheme.typography.labelLarge, color = BrandEmerald)
                        Text(order.deliveryOtp, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = BrandEmerald)
                    }
                }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (order.status == "price_confirmation_pending") {
                    Button(
                        onClick = onReviewPrices,
                        colors = ButtonDefaults.buttonColors(containerColor = BrandAmber),
                        modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("review_prices_${order.orderNumber}")
                    ) { Text("Review Prices") }
                }
                if (order.status == "delivered_pending_completion") {
                    Button(
                        onClick = onConfirmDelivery,
                        colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald),
                        modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("confirm_delivery_${order.orderNumber}")
                    ) { Text("Confirm Delivery") }
                }
                if (order.status in listOf("order_placed", "runner_assigned", "order_accepted", "shopping_in_progress", "price_confirmation_pending")) {
                    OutlinedButton(
                        onClick = onCancel,
                        modifier = Modifier.heightIn(min = 48.dp)
                    ) { Text("Cancel", color = BrandRose) }
                }
                OutlinedButton(
                    onClick = onOpenChat,
                    modifier = Modifier.heightIn(min = 48.dp)
                ) {
                    Icon(Icons.Default.ChatBubbleOutline, contentDescription = "Open Order Chat", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Chat")
                }
            }
        }
    }
}
