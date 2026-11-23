package com.example.ui.screens.admin

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.MPartnerAnalyticsAndTests
import com.example.model.DatabaseSchema
import com.example.model.Order
import com.example.model.User
import com.example.ui.MainViewModel
import com.example.ui.components.KpiMetricCard
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusPill
import com.example.ui.components.formatInr
import com.example.ui.theme.*

@Composable
fun AdminDashboardScreen(
    user: User,
    db: DatabaseSchema,
    viewModel: MainViewModel
) {
    val context = LocalContext.current
    var activeTab by remember { mutableStateOf("overview") }

    val accounting = remember(db) { MPartnerAnalyticsAndTests.computeAccountingSummary(db) }
    val runnerSummaries = remember(db) { MPartnerAnalyticsAndTests.computeAdminRunners(db) }
    val customerSummaries = remember(db) { MPartnerAnalyticsAndTests.computeAdminCustomers(db) }
    val areaPerformance = remember(db) { MPartnerAnalyticsAndTests.computeAreaPerformance(db) }

    val pendingRecharges = db.rechargeRequests.filter { it.status == "pending" }
    val pendingSubs = db.userSubscriptions.filter { it.status == "pending_verification" }
    val pendingRunners = runnerSummaries.filter { it.profile?.isApproved != true }

    Column(modifier = Modifier.fillMaxSize()) {
        val tabs = listOf(
            "overview" to "Overview",
            "payments" to "Accounting",
            "approvals" to "Approvals (${pendingRecharges.size + pendingSubs.size + pendingRunners.size})",
            "people" to "Runners & Users",
            "orders" to "Orders (${db.orders.size})",
            "reports" to "Analytics",
            "safety" to "Moderation",
            "settings" to "Zones & Audit"
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
                    modifier = Modifier.testTag("admin_tab_$key")
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
                item {
                    SectionHeader(
                        title = "M-PARTNER Operations",
                        subtitle = "Signed in as ${user.name}"
                    )
                }
                item {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        KpiMetricCard("Customers", "${customerSummaries.size}", "${db.userSubscriptions.count { it.status == "active" }} active plans", Icons.Default.People, BrandBlack, Modifier.weight(1f))
                        KpiMetricCard("Runners", "${runnerSummaries.size}", "${pendingRunners.size} pending approval", Icons.Default.DirectionsBike, BrandIndigo, Modifier.weight(1f))
                    }
                }
                item {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        KpiMetricCard("Total Wallet Pool", formatInr(db.wallets.sumOf { it.balance }), "${pendingRecharges.size} pending recharges", Icons.Default.AccountBalanceWallet, BrandEmerald, Modifier.weight(1f))
                        KpiMetricCard("Orders", "${db.orders.size}", "${db.orders.count { it.status == "completed" }} completed", Icons.Default.ShoppingBag, BrandAmber, Modifier.weight(1f))
                    }
                }
                item {
                    SectionHeader(title = "Recent Orders")
                }
                items(db.orders.take(5)) { o ->
                    Surface(color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                        Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("#${o.orderNumber} • ${o.customerName}", fontWeight = FontWeight.Bold)
                                Text("Runner: ${o.runnerName ?: "Unassigned"}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                            }
                            StatusPill(o.status)
                        }
                    }
                }
            }

            "payments" -> AdminAccountingTab(
                accounting = accounting,
                walletLedger = db.walletLedger.sortedByDescending { it.createdAt }.take(25),
                onExportCsv = { viewModel.shareCsvExport(context, "ledger") }
            )

            "approvals" -> AdminApprovalsTab(
                pendingRecharges = pendingRecharges,
                pendingSubs = pendingSubs,
                pendingRunners = pendingRunners,
                users = db.users,
                onApproveRecharge = { viewModel.approveRecharge(it) },
                onRejectRecharge = { id, r -> viewModel.rejectRecharge(id, r) },
                onVerifySub = { viewModel.verifySubscription(it) },
                onApproveRunner = { viewModel.approveRunner(it) },
                onRejectRunner = { viewModel.rejectRunner(it) }
            )

            "people" -> AdminPeopleTab(
                runners = runnerSummaries,
                customers = customerSummaries,
                onAssignRunner = { cid, rid -> viewModel.assignRunnerToCustomer(cid, rid) },
                onToggleUserStatus = { uid -> viewModel.toggleUserStatus(uid) },
                onIssueRefund = { cid, amt, rsn -> viewModel.issueRefund(cid, amt, rsn) }
            )

            "orders" -> AdminOrdersTab(
                orders = db.orders.sortedByDescending { it.createdAt },
                onOverrideStatus = { oid, status -> viewModel.overrideOrderStatus(oid, status) },
                onExportOrdersCsv = { viewModel.shareCsvExport(context, "orders") }
            )

            "reports" -> AdminAnalyticsTab(
                db = db,
                areaPerformance = areaPerformance,
                onExportCsv = { viewModel.shareCsvExport(context, "orders") }
            )

            "safety" -> AdminModerationTab(
                reports = db.contentReports,
                logs = db.moderationLogs,
                onResolveReport = { rid, act -> viewModel.resolveReport(rid, act) }
            )

            "settings" -> AdminSettingsAndAuditTab(
                db = db,
                onUpdateSettings = { upi, ph, em, otp, multi ->
                    viewModel.updateSettings(upi, ph, em, otp, multi)
                },
                onCreateArea = { name, city, pin -> viewModel.createServiceArea(name, city, pin) },
                onResolveTicket = { tid, notes -> viewModel.resolveTicket(tid, notes) }
            )
        }
    }
}

@Composable
private fun AdminOrdersTab(
    orders: List<Order>,
    onOverrideStatus: (orderId: String, status: String) -> Unit,
    onExportOrdersCsv: () -> Unit
) {
    var statusFilter by remember { mutableStateOf("all") }
    var overrideTarget by remember { mutableStateOf<Order?>(null) }
    val filtered = remember(orders, statusFilter) {
        if (statusFilter == "all") orders else orders.filter { it.status == statusFilter }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            SectionHeader(
                title = "Orders Supervision",
                actionLabel = "Export CSV",
                onActionClick = onExportOrdersCsv
            )
        }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(listOf("all", "runner_assigned", "shopping_in_progress", "price_confirmation_pending", "delivered_pending_completion", "completed", "cancelled")) { s ->
                    FilterChip(
                        selected = statusFilter == s,
                        onClick = { statusFilter = s },
                        label = { Text(s.replace("_", " ")) }
                    )
                }
            }
        }
        items(filtered) { o ->
            Surface(color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("#${o.orderNumber} • ${o.customerName}", fontWeight = FontWeight.Bold)
                        StatusPill(o.status)
                    }
                    Text("Runner: ${o.runnerName ?: "Unassigned"} • Bill: ${formatInr(o.totalActualPrice ?: o.totalEstimatedPrice)}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                    OutlinedButton(onClick = { overrideTarget = o }, modifier = Modifier.heightIn(min = 44.dp)) {
                        Text("Override Status")
                    }
                }
            }
        }
    }

    overrideTarget?.let { order ->
        val statuses = listOf("order_placed", "runner_assigned", "order_accepted", "shopping_in_progress", "out_for_delivery", "completed", "cancelled")
        var chosen by remember { mutableStateOf(order.status) }
        AlertDialog(
            onDismissRequest = { overrideTarget = null },
            title = { Text("Override Order #${order.orderNumber}") },
            text = {
                LazyColumn(modifier = Modifier.heightIn(max = 280.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    items(statuses) { st ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(selected = chosen == st, onClick = { chosen = st })
                            Text(st)
                        }
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    onOverrideStatus(order.id, chosen)
                    overrideTarget = null
                }) { Text("Apply Override") }
            },
            dismissButton = { TextButton(onClick = { overrideTarget = null }) { Text("Cancel") } }
        )
    }
}
