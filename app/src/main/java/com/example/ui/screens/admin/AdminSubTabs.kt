package com.example.ui.screens.admin

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.model.*
import com.example.ui.components.KpiMetricCard
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusPill
import com.example.ui.components.formatInr
import com.example.ui.theme.*

@Composable
fun AdminAccountingTab(
    accounting: AccountingSummary,
    walletLedger: List<WalletLedgerEntry>,
    onExportCsv: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            SectionHeader(
                title = "Payments & Accounting",
                subtitle = "6-bucket financial reconciliation",
                actionLabel = "Export CSV",
                onActionClick = onExportCsv
            )
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                KpiMetricCard("Sub Revenue", formatInr(accounting.grossSubscriptionRevenue), "Verified plans", Icons.Default.ConfirmationNumber, BrandEmerald, Modifier.weight(1f))
                KpiMetricCard("Wallet Deposits", formatInr(accounting.grossWalletDeposits), "Approved top-ups", Icons.Default.AddCard, BrandIndigo, Modifier.weight(1f))
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                KpiMetricCard("Paid to Shops", formatInr(accounting.totalAmountPaidToShops), "Runner outlays", Icons.Default.Store, BrandBlack, Modifier.weight(1f))
                KpiMetricCard("Charged Wallets", formatInr(accounting.totalAmountChargedToCustomers), "Customer debits", Icons.Default.ReceiptLong, BrandBlack, Modifier.weight(1f))
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                KpiMetricCard("Runner Payouts", formatInr(accounting.totalRunnerCommissions), "Commissions", Icons.Default.DirectionsBike, BrandAmber, Modifier.weight(1f))
                KpiMetricCard("Refunds Issued", formatInr(accounting.totalRefunds), "Audited credits", Icons.Default.Replay, BrandRose, Modifier.weight(1f))
            }
        }
        item { SectionHeader(title = "Recent Wallet Ledger") }
        items(walletLedger) { entry ->
            Surface(color = BrandSurface, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(entry.notes, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                        Text("${entry.type.uppercase()} • ${entry.userId}", style = MaterialTheme.typography.labelSmall, color = BrandMutedText)
                    }
                    Text(formatInr(entry.amount), fontWeight = FontWeight.ExtraBold)
                }
            }
        }
    }
}

@Composable
fun AdminApprovalsTab(
    pendingRecharges: List<RechargeRequest>,
    pendingSubs: List<UserSubscription>,
    pendingRunners: List<AdminRunnerSummary>,
    users: List<User>,
    onApproveRecharge: (String) -> Unit,
    onRejectRecharge: (String, String) -> Unit,
    onVerifySub: (String) -> Unit,
    onApproveRunner: (String) -> Unit,
    onRejectRunner: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item { SectionHeader(title = "Pending Wallet Recharges (${pendingRecharges.size})") }
        if (pendingRecharges.isEmpty()) {
            item { Text("No pending recharge requests.", style = MaterialTheme.typography.bodySmall, color = BrandMutedText) }
        } else {
            items(pendingRecharges) { r ->
                Surface(color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("${r.userName} • ${formatInr(r.amount)}", fontWeight = FontWeight.Bold)
                        Text("Ref: ${r.paymentReference} (${r.paymentMethod})", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = { onApproveRecharge(r.id) }, colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald), modifier = Modifier.weight(1f).heightIn(min = 44.dp)) {
                                Text("Approve Credit")
                            }
                            OutlinedButton(onClick = { onRejectRecharge(r.id, "Invalid UPI reference") }, modifier = Modifier.weight(1f).heightIn(min = 44.dp)) {
                                Text("Reject")
                            }
                        }
                    }
                }
            }
        }

        item { SectionHeader(title = "Pending Subscriptions (${pendingSubs.size})") }
        if (pendingSubs.isEmpty()) {
            item { Text("No pending subscription verifications.", style = MaterialTheme.typography.bodySmall, color = BrandMutedText) }
        } else {
            items(pendingSubs) { s ->
                val cust = users.find { it.id == s.userId }
                Surface(color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("${cust?.name ?: s.userId} • ${s.planName} (${s.creditsTotal} credits)", fontWeight = FontWeight.Bold)
                        Text("Ref: ${s.paymentRef ?: "UPI"}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                        Button(onClick = { onVerifySub(s.id) }, colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald), modifier = Modifier.fillMaxWidth().heightIn(min = 44.dp)) {
                            Text("Verify Payment & Activate Credits")
                        }
                    }
                }
            }
        }

        item { SectionHeader(title = "Pending Runner Applications (${pendingRunners.size})") }
        if (pendingRunners.isEmpty()) {
            item { Text("All Runner applications verified.", style = MaterialTheme.typography.bodySmall, color = BrandMutedText) }
        } else {
            items(pendingRunners) { r ->
                Surface(color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("${r.user.name} (${r.user.phone})", fontWeight = FontWeight.Bold)
                        Text("Zone: ${r.areaName}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = { onApproveRunner(r.user.id) }, colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald), modifier = Modifier.weight(1f).heightIn(min = 44.dp)) {
                                Text("Approve")
                            }
                            OutlinedButton(onClick = { onRejectRunner(r.user.id) }, modifier = Modifier.weight(1f).heightIn(min = 44.dp)) {
                                Text("Reject")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AdminPeopleTab(
    runners: List<AdminRunnerSummary>,
    customers: List<AdminCustomerSummary>,
    onAssignRunner: (customerId: String, runnerId: String) -> Unit,
    onToggleUserStatus: (userId: String) -> Unit,
    onIssueRefund: (customerId: String, amount: Double, reason: String) -> Unit
) {
    var assignTarget by remember { mutableStateOf<AdminCustomerSummary?>(null) }
    var refundTarget by remember { mutableStateOf<AdminCustomerSummary?>(null) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { SectionHeader(title = "Customers & Designated Runners") }
        items(customers) { c ->
            Surface(color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(c.user.name, fontWeight = FontWeight.Bold)
                        StatusPill(c.user.status)
                    }
                    Text("${c.areaName} • Wallet: ${formatInr(c.walletBalance)} • Plan: ${c.subscriptionPlan} (${c.subscriptionCreditsRemaining} cr)", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                    Text("Designated Runner: ${c.assignedRunnerName}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = { assignTarget = c }, modifier = Modifier.heightIn(min = 44.dp)) { Text("Assign Runner") }
                        OutlinedButton(onClick = { refundTarget = c }, modifier = Modifier.heightIn(min = 44.dp)) { Text("Refund") }
                        OutlinedButton(onClick = { onToggleUserStatus(c.user.id) }, modifier = Modifier.heightIn(min = 44.dp)) {
                            Text(if (c.user.status == "active") "Suspend" else "Activate")
                        }
                    }
                }
            }
        }

        item { SectionHeader(title = "Neighborhood Runners") }
        items(runners) { r ->
            Surface(color = BrandSurface, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(r.user.name, fontWeight = FontWeight.Bold)
                        StatusPill(if (r.profile?.isApproved == true) "approved" else "pending")
                    }
                    Text("${r.areaName} • Customers: ${r.assignedCustomersCount} • Completed: ${r.completedJobs}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                }
            }
        }
    }

    assignTarget?.let { cust ->
        var chosenRunnerId by remember { mutableStateOf(cust.user.assignedRunnerId ?: runners.firstOrNull()?.user?.id ?: "") }
        AlertDialog(
            onDismissRequest = { assignTarget = null },
            title = { Text("Assign Runner to ${cust.user.name}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    runners.forEach { r ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(selected = chosenRunnerId == r.user.id, onClick = { chosenRunnerId = r.user.id })
                            Text("${r.user.name} (${r.areaName})")
                        }
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    onAssignRunner(cust.user.id, chosenRunnerId)
                    assignTarget = null
                }) { Text("Assign") }
            },
            dismissButton = { TextButton(onClick = { assignTarget = null }) { Text("Cancel") } }
        )
    }

    refundTarget?.let { cust ->
        var amount by remember { mutableStateOf("100") }
        var reason by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { refundTarget = null },
            title = { Text("Issue Wallet Refund (${cust.user.name})") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = amount, onValueChange = { amount = it }, label = { Text("Refund Amount (₹)") }, singleLine = true)
                    OutlinedTextField(value = reason, onValueChange = { reason = it }, label = { Text("Mandatory Audit Reason *") })
                }
            },
            confirmButton = {
                Button(onClick = {
                    onIssueRefund(cust.user.id, amount.toDoubleOrNull() ?: 0.0, reason)
                    refundTarget = null
                }) { Text("Credit Refund") }
            },
            dismissButton = { TextButton(onClick = { refundTarget = null }) { Text("Cancel") } }
        )
    }
}

@Composable
fun AdminAnalyticsTab(
    db: DatabaseSchema,
    areaPerformance: List<AreaPerformance>,
    onExportCsv: () -> Unit
) {
    val issued = db.subscriptionLedger.filter { it.changeAmount > 0 }.sumOf { it.changeAmount }
    val consumed = db.subscriptionLedger.filter { it.changeAmount < 0 }.sumOf { kotlin.math.abs(it.changeAmount) }
    val activeCredits = db.userSubscriptions.filter { it.status == "active" }.sumOf { it.creditsRemaining }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            SectionHeader(title = "Reports & Analytics", actionLabel = "Export CSV", onActionClick = onExportCsv)
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                KpiMetricCard("Credits Issued", "$issued", "Lifetime", Icons.Default.ConfirmationNumber, BrandEmerald, Modifier.weight(1f))
                KpiMetricCard("Credits Used", "$consumed", "$activeCredits active left", Icons.Default.DoneAll, BrandBlack, Modifier.weight(1f))
            }
        }
        item { SectionHeader(title = "Area Hub Performance") }
        items(areaPerformance) { a ->
            Surface(color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                Row(modifier = Modifier.padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(a.areaName, fontWeight = FontWeight.Bold)
                        Text("${a.city} • ${a.customerCount} customers", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                    }
                    Text("${a.completedCount}/${a.ordersCount} orders", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun AdminModerationTab(
    reports: List<ContentReport>,
    logs: List<ModerationLog>,
    onResolveReport: (reportId: String, action: String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { SectionHeader(title = "Reported Messages (${reports.size})") }
        if (reports.isEmpty()) {
            item { Text("No reported messages in queue.", style = MaterialTheme.typography.bodySmall, color = BrandMutedText) }
        } else {
            items(reports) { r ->
                Surface(color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Reported: ${r.reportedUserName ?: "User"}", fontWeight = FontWeight.Bold)
                            StatusPill(r.status)
                        }
                        Text("\"${r.messageText}\"", style = MaterialTheme.typography.bodySmall)
                        Text("Reason: ${r.reason}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                        if (r.status == "pending") {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedButton(onClick = { onResolveReport(r.id, "warn") }, modifier = Modifier.heightIn(min = 44.dp)) { Text("Warn") }
                                OutlinedButton(onClick = { onResolveReport(r.id, "suspend_account") }, modifier = Modifier.heightIn(min = 44.dp)) { Text("Suspend") }
                                TextButton(onClick = { onResolveReport(r.id, "dismiss") }, modifier = Modifier.heightIn(min = 44.dp)) { Text("Dismiss") }
                            }
                        }
                    }
                }
            }
        }

        item { SectionHeader(title = "Auto-Blocked Keyword Logs (${logs.size})") }
        items(logs) { l ->
            Surface(color = BrandRoseContainer, shape = MaterialTheme.shapes.medium, modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("${l.senderName} • Keywords: ${l.flaggedKeywords.joinToString()}", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall)
                    Text("\"${l.text}\"", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@Composable
fun AdminSettingsAndAuditTab(
    db: DatabaseSchema,
    onUpdateSettings: (upi: String, phone: String, email: String, requireOtp: Boolean, allowMulti: Boolean) -> Unit,
    onCreateArea: (name: String, city: String, pincode: String) -> Unit,
    onResolveTicket: (ticketId: String, notes: String) -> Unit
) {
    var upi by remember(db.settings.upiId) { mutableStateOf(db.settings.upiId) }
    var phone by remember(db.settings.supportPhone) { mutableStateOf(db.settings.supportPhone) }
    var email by remember(db.settings.supportEmail) { mutableStateOf(db.settings.supportEmail) }
    var requireOtp by remember(db.settings.requireDeliveryOtp) { mutableStateOf(db.settings.requireDeliveryOtp) }
    var allowMulti by remember(db.settings.allowMultiRunnerSelection) { mutableStateOf(db.settings.allowMultiRunnerSelection) }

    var areaName by remember { mutableStateOf("") }
    var areaCity by remember { mutableStateOf("") }
    var areaPin by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { SectionHeader(title = "Platform Configuration") }
        item { OutlinedTextField(value = upi, onValueChange = { upi = it }, label = { Text("Settlement UPI ID") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
        item { OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Support Phone") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
        item { OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Support Email") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Require 4-Digit Delivery OTP")
                Switch(checked = requireOtp, onCheckedChange = { requireOtp = it })
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Allow Multi-Runner Selection")
                Switch(checked = allowMulti, onCheckedChange = { allowMulti = it })
            }
        }
        item {
            Button(
                onClick = { onUpdateSettings(upi, phone, email, requireOtp, allowMulti) },
                modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
            ) { Text("Save Settings") }
        }

        item { SectionHeader(title = "Add Service Area Hub") }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = areaName, onValueChange = { areaName = it }, label = { Text("Area Name") }, singleLine = true, modifier = Modifier.weight(1f))
                OutlinedTextField(value = areaCity, onValueChange = { areaCity = it }, label = { Text("City") }, singleLine = true, modifier = Modifier.weight(1f))
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(value = areaPin, onValueChange = { areaPin = it }, label = { Text("Pincode") }, singleLine = true, modifier = Modifier.weight(1f))
                Button(
                    onClick = {
                        onCreateArea(areaName, areaCity, areaPin)
                        areaName = ""
                        areaCity = ""
                        areaPin = ""
                    },
                    modifier = Modifier.heightIn(min = 52.dp)
                ) { Text("Add Zone") }
            }
        }

        item { SectionHeader(title = "Support Tickets (${db.supportTickets.size})") }
        items(db.supportTickets) { t ->
            Surface(color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("${t.subject} (${t.userName})", fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        StatusPill(t.status)
                    }
                    Text(t.message, style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                    if (t.status != "resolved") {
                        OutlinedButton(onClick = { onResolveTicket(t.id, "Resolved by Admin Operations") }, modifier = Modifier.heightIn(min = 44.dp)) {
                            Text("Mark Resolved")
                        }
                    }
                }
            }
        }

        item { SectionHeader(title = "Immutable Audit Trail") }
        items(db.auditLogs.take(20)) { log ->
            Surface(color = BrandSurface, shape = MaterialTheme.shapes.small, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text("${log.action} • ${log.actorName} (${log.actorRole})", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall)
                    Text(log.details, style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                }
            }
        }
    }
}
