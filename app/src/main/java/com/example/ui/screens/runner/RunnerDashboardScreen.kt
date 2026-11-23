package com.example.ui.screens.runner

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
import com.example.data.MPartnerAnalyticsAndTests
import com.example.model.DatabaseSchema
import com.example.model.Order
import com.example.model.OrderItem
import com.example.model.User
import com.example.ui.MainViewModel
import com.example.ui.components.KpiMetricCard
import com.example.ui.components.OrderStepBadgeRow
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusPill
import com.example.ui.components.formatInr
import com.example.ui.screens.customer.CustomerChatTab
import com.example.ui.theme.*

@Composable
fun RunnerDashboardScreen(
    user: User,
    db: DatabaseSchema,
    viewModel: MainViewModel
) {
    var activeTab by remember { mutableStateOf("orders") }
    val profile = db.runnerProfiles.find { it.userId == user.id }
    val runnerOrders = remember(db.orders, user.id) {
        db.orders.filter { it.runnerId == user.id }.sortedByDescending { it.createdAt }
    }
    val activeOrders = runnerOrders.filter { it.status !in listOf("completed", "cancelled", "rejected") }
    val completedOrders = runnerOrders.filter { it.status == "completed" }
    val assignedCustomers = remember(db, user.id) {
        MPartnerAnalyticsAndTests.computeRunnerCustomers(db, user.id)
    }
    val earningsEstimate = completedOrders.sumOf { it.runnerCommission ?: db.settings.runnerCommissionPerDelivery }

    var pricingOrder by remember { mutableStateOf<Order?>(null) }
    var purchaseOrder by remember { mutableStateOf<Order?>(null) }
    var otpOrder by remember { mutableStateOf<Order?>(null) }
    var rejectOrder by remember { mutableStateOf<Order?>(null) }

    Column(modifier = Modifier.fillMaxSize()) {
        // Runner Status Strip
        Surface(color = BrandSurface, border = BorderStroke(1.dp, BrandBorder)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Runner: ${user.name}", fontWeight = FontWeight.Bold)
                    Text(
                        text = "${profile?.vehicleType ?: "Two Wheeler"} • ★ ${profile?.rating ?: 4.95}",
                        style = MaterialTheme.typography.bodySmall,
                        color = BrandMutedText
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusPill(if (profile?.isAvailable == true) "Online" else "Offline")
                    Switch(
                        checked = profile?.isAvailable == true,
                        onCheckedChange = { viewModel.toggleRunnerAvailability(it) },
                        modifier = Modifier.testTag("runner_availability_switch")
                    )
                }
            }
        }

        val tabs = listOf(
            "orders" to "Assigned Orders (${runnerOrders.size})",
            "customers" to "Customers (${assignedCustomers.size})",
            "earnings" to "Earnings",
            "chat" to "Customer Chat"
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
                    modifier = Modifier.testTag("runner_tab_$key")
                )
            }
        }
        HorizontalDivider()

        when (activeTab) {
            "orders" -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        KpiMetricCard("Active Jobs", "${activeOrders.size}", "In progress", Icons.Default.DirectionsBike, BrandBlack, Modifier.weight(1f))
                        KpiMetricCard("Completed", "${completedOrders.size}", "Delivered", Icons.Default.Verified, BrandEmerald, Modifier.weight(1f))
                    }
                }

                items(runnerOrders) { o ->
                    Surface(
                        color = BrandPureWhite,
                        shape = MaterialTheme.shapes.large,
                        border = BorderStroke(1.dp, BrandBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Column {
                                    Text("#${o.orderNumber} • ${o.customerName}", fontWeight = FontWeight.ExtraBold)
                                    Text(o.deliveryAddress, style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                                }
                                StatusPill(o.status)
                            }

                            OrderStepBadgeRow(o.status)

                            o.items.forEach { it ->
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("• ${it.name} (${it.quantity} ${it.unit})", style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                                    Text(formatInr(it.confirmedPrice ?: it.estimatedPrice), style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                                }
                            }

                            if (!o.notes.isNullOrBlank()) {
                                Text("Notes: ${o.notes}", style = MaterialTheme.typography.bodySmall, color = BrandAmber)
                            }

                            // 7-Step Action Controls
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                when (o.status) {
                                    "order_placed", "runner_assigned" -> {
                                        Button(
                                            onClick = { viewModel.acceptOrder(o.id) },
                                            colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald),
                                            modifier = Modifier.weight(1f).heightIn(min = 48.dp)
                                        ) { Text("Accept Order") }
                                        OutlinedButton(
                                            onClick = { rejectOrder = o },
                                            modifier = Modifier.weight(1f).heightIn(min = 48.dp)
                                        ) { Text("Reject") }
                                    }

                                    "order_accepted" -> {
                                        Button(
                                            onClick = { viewModel.startShopping(o.id) },
                                            modifier = Modifier.weight(1f).heightIn(min = 48.dp)
                                        ) { Text("Start Shopping") }
                                        OutlinedButton(
                                            onClick = { pricingOrder = o },
                                            modifier = Modifier.weight(1f).heightIn(min = 48.dp)
                                        ) { Text("Submit Prices") }
                                    }

                                    "shopping_in_progress" -> {
                                        Button(
                                            onClick = { pricingOrder = o },
                                            modifier = Modifier.weight(1f).heightIn(min = 48.dp)
                                        ) { Text("Verify Prices") }
                                        OutlinedButton(
                                            onClick = { purchaseOrder = o },
                                            modifier = Modifier.weight(1f).heightIn(min = 48.dp)
                                        ) { Text("Record Bill") }
                                    }

                                    "price_confirmed" -> {
                                        Button(
                                            onClick = { purchaseOrder = o },
                                            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                                        ) { Text("Record Store Purchase") }
                                    }

                                    "purchase_recorded" -> {
                                        Button(
                                            onClick = { viewModel.markOutForDelivery(o.id) },
                                            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                                        ) { Text("Mark Out for Delivery") }
                                    }

                                    "out_for_delivery" -> {
                                        Button(
                                            onClick = { viewModel.requestCompletion(o.id) },
                                            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                                        ) { Text("Arrived at Doorstep") }
                                    }

                                    "delivered_pending_completion" -> {
                                        Button(
                                            onClick = { otpOrder = o },
                                            colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald),
                                            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                                        ) { Text("Verify 4-Digit OTP & Complete") }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            "customers" -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item { SectionHeader(title = "Assigned Neighborhood Customers") }
                items(assignedCustomers) { summary ->
                    val c = summary.customer
                    Surface(
                        color = BrandPureWhite,
                        shape = MaterialTheme.shapes.medium,
                        border = BorderStroke(1.dp, BrandBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(c.name, fontWeight = FontWeight.Bold)
                                if (summary.activeOrderNumber != null) {
                                    StatusPill("Order #${summary.activeOrderNumber}")
                                }
                            }
                            Text("${c.phone} • ${c.locality ?: ""}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                            Text(c.address ?: "", style = MaterialTheme.typography.bodySmall)
                            if (!c.landmark.isNullOrBlank()) {
                                Text("Landmark: ${c.landmark}", style = MaterialTheme.typography.bodySmall, color = BrandIndigo)
                            }
                        }
                    }
                }
            }

            "earnings" -> LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    KpiMetricCard(
                        title = "Total Runner Commission Earnings",
                        value = formatInr(earningsEstimate),
                        subtitle = "${completedOrders.size} completed deliveries @ ${formatInr(db.settings.runnerCommissionPerDelivery)} each",
                        icon = Icons.Default.Payments,
                        accentColor = BrandEmerald
                    )
                }
                items(completedOrders) { o ->
                    Surface(
                        color = BrandSurface,
                        shape = MaterialTheme.shapes.medium,
                        border = BorderStroke(1.dp, BrandBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("#${o.orderNumber} • ${o.customerName}", fontWeight = FontWeight.Bold)
                                Text("Settlement: ${o.runnerSettlementStatus ?: "pending"}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                            }
                            Text("+${formatInr(o.runnerCommission ?: db.settings.runnerCommissionPerDelivery)}", fontWeight = FontWeight.ExtraBold, color = BrandEmerald)
                        }
                    }
                }
            }

            "chat" -> CustomerChatTab(
                currentUser = user,
                orders = runnerOrders,
                messages = db.messages,
                onSendMessage = { oid, txt, onDone -> viewModel.sendChatMessage(oid, txt, onDone) },
                onReportMessage = { mid, reason -> viewModel.reportMessage(mid, reason) }
            )
        }
    }

    // Price Verification Modal
    pricingOrder?.let { order ->
        var shop by remember { mutableStateOf(order.shopName ?: "Shree Ganesh General Store") }
        var itemPrices by remember {
            mutableStateOf(order.items.map { (it.confirmedPrice ?: it.estimatedPrice ?: 50.0).toString() })
        }
        AlertDialog(
            onDismissRequest = { pricingOrder = null },
            title = { Text("Submit Verified Store Prices (#${order.orderNumber})") },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.heightIn(max = 360.dp)) {
                    item { OutlinedTextField(value = shop, onValueChange = { shop = it }, label = { Text("Store Name") }, singleLine = true) }
                    itemsIndexed(order.items) { idx, it ->
                        OutlinedTextField(
                            value = itemPrices[idx],
                            onValueChange = { v -> itemPrices = itemPrices.toMutableList().apply { set(idx, v) } },
                            label = { Text("${it.name} (₹)") },
                            singleLine = true
                        )
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    val updated: List<OrderItem> = order.items.mapIndexed { idx, old ->
                        val p = itemPrices[idx].toDoubleOrNull() ?: 0.0
                        old.copy(confirmedPrice = p, unitPrice = p, isAvailable = true)
                    }
                    viewModel.submitPriceConfirmation(order.id, updated, shop)
                    pricingOrder = null
                }) { Text("Send for Approval") }
            },
            dismissButton = { TextButton(onClick = { pricingOrder = null }) { Text("Cancel") } }
        )
    }

    // Record Purchase Modal
    purchaseOrder?.let { order ->
        var amount by remember { mutableStateOf((order.totalActualPrice ?: order.totalEstimatedPrice ?: 200.0).toInt().toString()) }
        var shop by remember { mutableStateOf(order.shopName ?: "Local Partner Store") }
        var method by remember { mutableStateOf("UPI to Shop QR") }
        AlertDialog(
            onDismissRequest = { purchaseOrder = null },
            title = { Text("Record Shop Purchase (#${order.orderNumber})") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = amount, onValueChange = { amount = it }, label = { Text("Actual Bill Paid (₹)") }, singleLine = true)
                    OutlinedTextField(value = shop, onValueChange = { shop = it }, label = { Text("Shop Name") }, singleLine = true)
                    OutlinedTextField(value = method, onValueChange = { method = it }, label = { Text("Payment Method") }, singleLine = true)
                }
            },
            confirmButton = {
                Button(onClick = {
                    viewModel.recordPurchase(order.id, amount.toDoubleOrNull() ?: 0.0, shop, method)
                    purchaseOrder = null
                }) { Text("Save Purchase") }
            },
            dismissButton = { TextButton(onClick = { purchaseOrder = null }) { Text("Cancel") } }
        )
    }

    // OTP Completion Modal
    otpOrder?.let { order ->
        var otp by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { otpOrder = null },
            title = { Text("Complete Order #${order.orderNumber}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Enter the 4-digit Delivery OTP shared by ${order.customerName}.", style = MaterialTheme.typography.bodySmall)
                    OutlinedTextField(
                        value = otp,
                        onValueChange = { otp = it },
                        label = { Text("4-Digit Delivery OTP") },
                        singleLine = true,
                        modifier = Modifier.testTag("runner_otp_input")
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    viewModel.completeOrderWithOtp(order.id, otp)
                    otpOrder = null
                }) { Text("Verify & Complete") }
            },
            dismissButton = { TextButton(onClick = { otpOrder = null }) { Text("Cancel") } }
        )
    }

    // Reject Modal
    rejectOrder?.let { order ->
        var reason by remember { mutableStateOf("Runner unavailable for this slot") }
        AlertDialog(
            onDismissRequest = { rejectOrder = null },
            title = { Text("Reject Order #${order.orderNumber}") },
            text = { OutlinedTextField(value = reason, onValueChange = { reason = it }, label = { Text("Reason") }) },
            confirmButton = {
                Button(onClick = {
                    viewModel.rejectOrder(order.id, reason)
                    rejectOrder = null
                }) { Text("Confirm Reject") }
            },
            dismissButton = { TextButton(onClick = { rejectOrder = null }) { Text("Cancel") } }
        )
    }
}
