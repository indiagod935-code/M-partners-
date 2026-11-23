package com.example.ui.screens.customer

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.model.*
import com.example.ui.components.KpiMetricCard
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusPill
import com.example.ui.components.formatInr
import com.example.ui.theme.*

@Composable
fun CustomerWalletTab(
    wallet: Wallet?,
    ledger: List<WalletLedgerEntry>,
    recharges: List<RechargeRequest>,
    settings: PlatformSettings,
    onRequestRecharge: (Double, String, String) -> Unit
) {
    var rechargeAmount by remember { mutableStateOf("500") }
    var paymentRef by remember { mutableStateOf("") }
    var paymentMethod by remember { mutableStateOf("UPI Transfer") }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            KpiMetricCard(
                title = "Available Purchase Wallet",
                value = formatInr(wallet?.balance ?: 0.0),
                subtitle = "Used strictly for actual MRP shop bills upon delivery",
                icon = Icons.Default.AccountBalanceWallet,
                accentColor = BrandEmerald
            )
        }

        item {
            Surface(
                color = BrandSurface,
                shape = MaterialTheme.shapes.large,
                border = BorderStroke(1.dp, BrandBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Request Wallet Recharge via UPI", fontWeight = FontWeight.Bold)
                    Text("Pay to Official UPI ID: ${settings.upiId}", style = MaterialTheme.typography.bodySmall, color = BrandIndigo, fontWeight = FontWeight.SemiBold)
                    OutlinedTextField(
                        value = rechargeAmount,
                        onValueChange = { rechargeAmount = it },
                        label = { Text("Amount (₹)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("wallet_recharge_amount")
                    )
                    OutlinedTextField(
                        value = paymentRef,
                        onValueChange = { paymentRef = it },
                        label = { Text("UPI Reference / UTR Number") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("wallet_recharge_ref")
                    )
                    OutlinedTextField(
                        value = paymentMethod,
                        onValueChange = { paymentMethod = it },
                        label = { Text("Payment Method") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Button(
                        onClick = {
                            val amt = rechargeAmount.toDoubleOrNull() ?: 0.0
                            onRequestRecharge(amt, paymentRef, paymentMethod)
                            paymentRef = ""
                        },
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("wallet_recharge_submit")
                    ) {
                        Text("Submit Recharge Request")
                    }
                }
            }
        }

        if (recharges.isNotEmpty()) {
            item { SectionHeader(title = "Recent Recharge Requests") }
            items(recharges) { r ->
                Surface(
                    color = BrandPureWhite,
                    shape = MaterialTheme.shapes.medium,
                    border = BorderStroke(1.dp, BrandBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("${formatInr(r.amount)} • ${r.paymentMethod}", fontWeight = FontWeight.Bold)
                            Text("Ref: ${r.paymentReference ?: "N/A"}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                        }
                        StatusPill(r.status)
                    }
                }
            }
        }

        item { SectionHeader(title = "Wallet Transaction Ledger") }
        if (ledger.isEmpty()) {
            item { Text("No wallet transactions yet.", color = BrandMutedText) }
        } else {
            items(ledger) { entry ->
                val isCredit = entry.type == "credit" || entry.type == "refund"
                Surface(
                    color = BrandPureWhite,
                    shape = MaterialTheme.shapes.medium,
                    border = BorderStroke(1.dp, BrandBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(entry.notes.ifBlank { entry.type.uppercase() }, fontWeight = FontWeight.SemiBold)
                            Text(entry.createdAt.take(10), style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                        }
                        Text(
                            text = "${if (isCredit) "+" else "-"}${formatInr(entry.amount)}",
                            fontWeight = FontWeight.ExtraBold,
                            color = if (isCredit) BrandEmerald else BrandRose
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun CustomerPlansTab(
    plans: List<SubscriptionPlan>,
    userSubs: List<UserSubscription>,
    settings: PlatformSettings,
    onPurchasePlan: (String, String) -> Unit
) {
    var selectedPlan by remember { mutableStateOf<SubscriptionPlan?>(null) }
    var paymentRef by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (userSubs.isNotEmpty()) {
            item { SectionHeader(title = "My Subscriptions") }
            items(userSubs) { sub ->
                Surface(
                    color = BrandPureWhite,
                    shape = MaterialTheme.shapes.medium,
                    border = BorderStroke(1.dp, BrandBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text(sub.planName, fontWeight = FontWeight.ExtraBold)
                            StatusPill(sub.status)
                        }
                        Text("Credits Remaining: ${sub.creditsRemaining} / ${sub.creditsTotal}", style = MaterialTheme.typography.bodyMedium)
                        Text("Expires: ${sub.expiresAt.take(10)}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                    }
                }
            }
        }

        item {
            SectionHeader(
                title = "Subscription Delivery Plans",
                subtitle = "Zero delivery markups — pay only for delivery credits"
            )
        }

        items(plans) { plan ->
            Surface(
                color = BrandSurface,
                shape = MaterialTheme.shapes.large,
                border = BorderStroke(1.dp, BrandBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(plan.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
                        Text(formatInr(plan.price), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = BrandEmerald)
                    }
                    Text("${plan.credits} Delivery Credits • Valid ${plan.validityDays} days", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodySmall)
                    Text(plan.description, style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                    Button(
                        onClick = { selectedPlan = plan },
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("subscribe_plan_${plan.id}")
                    ) {
                        Text("Select ${plan.name}")
                    }
                }
            }
        }
    }

    selectedPlan?.let { plan ->
        AlertDialog(
            onDismissRequest = { selectedPlan = null },
            title = { Text("Subscribe to ${plan.name}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Transfer ${formatInr(plan.price)} to UPI ID: ${settings.upiId}", style = MaterialTheme.typography.bodySmall)
                    OutlinedTextField(
                        value = paymentRef,
                        onValueChange = { paymentRef = it },
                        label = { Text("UPI Transaction / UTR Reference") },
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    onPurchasePlan(plan.id, paymentRef)
                    paymentRef = ""
                    selectedPlan = null
                }) { Text("Submit Subscription") }
            },
            dismissButton = { TextButton(onClick = { selectedPlan = null }) { Text("Cancel") } }
        )
    }
}

@Composable
fun CustomerChatTab(
    currentUser: User,
    orders: List<Order>,
    messages: List<ChatMessage>,
    onSendMessage: (String, String, () -> Unit) -> Unit,
    onReportMessage: (String, String) -> Unit
) {
    var selectedOrderId by remember(orders) { mutableStateOf(orders.firstOrNull()?.id ?: "") }
    var draftMessage by remember { mutableStateOf("") }
    var reportTarget by remember { mutableStateOf<ChatMessage?>(null) }

    val activeMessages = remember(messages, selectedOrderId) {
        messages.filter { it.orderId == selectedOrderId }.sortedBy { it.createdAt }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        if (orders.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                Text("Place or accept an order to start moderated real-time order chat.", color = BrandMutedText)
            }
            return
        }

        LazyRow(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(orders) { o ->
                FilterChip(
                    selected = o.id == selectedOrderId,
                    onClick = { selectedOrderId = o.id },
                    label = { Text("#${o.orderNumber} (${o.status.replace("_", " ")})") }
                )
            }
        }
        HorizontalDivider()

        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (activeMessages.isEmpty()) {
                item {
                    Text("No messages on this order yet. Say hi!", color = BrandMutedText)
                }
            } else {
                items(activeMessages) { msg ->
                    val isMine = msg.senderId == currentUser.id
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = if (isMine) Alignment.End else Alignment.Start
                    ) {
                        Surface(
                            color = if (isMine) BrandBlack else BrandSurfaceVariant,
                            shape = MaterialTheme.shapes.medium,
                            modifier = Modifier.widthIn(max = 300.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        "${msg.senderName} (${msg.senderRole})",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (isMine) BrandPureWhite.copy(alpha = 0.75f) else BrandMutedText
                                    )
                                    if (!isMine) {
                                        IconButton(
                                            onClick = { reportTarget = msg },
                                            modifier = Modifier.size(20.dp)
                                        ) {
                                            Icon(Icons.Default.Flag, contentDescription = "Report message", tint = BrandRose, modifier = Modifier.size(14.dp))
                                        }
                                    }
                                }
                                Text(
                                    msg.text,
                                    color = if (isMine) BrandPureWhite else BrandBlack,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        }
                    }
                }
            }
        }

        Surface(color = BrandSurface, border = BorderStroke(1.dp, BrandBorder)) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = draftMessage,
                    onValueChange = { draftMessage = it },
                    placeholder = { Text("Message about items or doorstep...") },
                    singleLine = true,
                    modifier = Modifier.weight(1f).testTag("order_chat_input")
                )
                IconButton(
                    onClick = {
                        if (selectedOrderId.isNotBlank() && draftMessage.isNotBlank()) {
                            onSendMessage(selectedOrderId, draftMessage) {
                                draftMessage = ""
                            }
                        }
                    },
                    modifier = Modifier.size(48.dp).testTag("order_chat_send")
                ) {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send message", tint = BrandBlack)
                }
            }
        }
    }

    reportTarget?.let { msg ->
        var reason by remember { mutableStateOf("Inappropriate content") }
        AlertDialog(
            onDismissRequest = { reportTarget = null },
            title = { Text("Report Message") },
            text = {
                OutlinedTextField(value = reason, onValueChange = { reason = it }, label = { Text("Reason") })
            },
            confirmButton = {
                Button(
                    onClick = {
                        onReportMessage(msg.id, reason)
                        reportTarget = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BrandRose)
                ) { Text("Submit Report") }
            },
            dismissButton = { TextButton(onClick = { reportTarget = null }) { Text("Cancel") } }
        )
    }
}

@Composable
fun CustomerHelpTab(
    notifications: List<AppNotification>,
    tickets: List<SupportTicket>,
    settings: PlatformSettings,
    onMarkAllRead: () -> Unit,
    onSubmitTicket: (String, String, String, () -> Unit) -> Unit
) {
    var category by remember { mutableStateOf("order") }
    var subject by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            SectionHeader(
                title = "Notifications",
                actionLabel = if (notifications.any { !it.isRead }) "Mark all read" else null,
                onActionClick = onMarkAllRead
            )
        }

        if (notifications.isEmpty()) {
            item { Text("No notifications right now.", color = BrandMutedText) }
        } else {
            items(notifications.take(10)) { n ->
                Surface(
                    color = if (n.isRead) BrandPureWhite else BrandIndigoContainer,
                    shape = MaterialTheme.shapes.medium,
                    border = BorderStroke(1.dp, BrandBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(n.title, fontWeight = FontWeight.Bold)
                        Text(n.message, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }

        item {
            SectionHeader(
                title = "Raise a Support Ticket",
                subtitle = "Direct helpdesk: ${settings.supportPhone} • ${settings.supportEmail}"
            )
        }

        item {
            Surface(
                color = BrandSurface,
                shape = MaterialTheme.shapes.large,
                border = BorderStroke(1.dp, BrandBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = category,
                        onValueChange = { category = it },
                        label = { Text("Category (order, wallet, subscription, runner)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = subject,
                        onValueChange = { subject = it },
                        label = { Text("Subject") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = message,
                        onValueChange = { message = it },
                        label = { Text("Describe your issue") },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Button(
                        onClick = {
                            onSubmitTicket(category, subject, message) {
                                subject = ""
                                message = ""
                            }
                        },
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                    ) { Text("Submit Support Ticket") }
                }
            }
        }

        if (tickets.isNotEmpty()) {
            item { SectionHeader(title = "My Support Tickets") }
            items(tickets) { t ->
                Surface(
                    color = BrandPureWhite,
                    shape = MaterialTheme.shapes.medium,
                    border = BorderStroke(1.dp, BrandBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text(t.subject, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                            StatusPill(t.status)
                        }
                        Text(t.message, style = MaterialTheme.typography.bodySmall)
                        if (!t.adminNotes.isNullOrBlank()) {
                            Text("Admin Note: ${t.adminNotes}", style = MaterialTheme.typography.bodySmall, color = BrandEmerald)
                        }
                    }
                }
            }
        }
    }
}
