package com.example.ui.screens.public

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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.model.BusinessRuleTestReport
import com.example.model.PlatformSettings
import com.example.model.SubscriptionPlan
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusPill
import com.example.ui.components.formatInr
import com.example.ui.theme.*

@Composable
fun HowItWorksScreen(onStartOrder: () -> Unit) {
    val steps = remember {
        listOf(
            "1. Activate Subscription" to "Choose Starter (₹200) to Pro (₹1000) and transfer via UPI for 30-day delivery credits.",
            "2. Load Shopping Wallet" to "Pre-fund or top up your Shopping Wallet so your Runner has zero friction at store billing.",
            "3. Assigned Dedicated Runner" to "Operations assigns one verified local neighborhood Runner who learns your preferences.",
            "4. Build Your Item List" to "Add grocery, dairy, produce, or pharmacy items manually or via Gemini AI Smart List Maker.",
            "5. Runner Reviews & Visits Store" to "Your Runner accepts the order and visits trusted kirana, dairy, or chemist partners.",
            "6. Price Verification Alert" to "Runner submits verified item prices & store name; you review and confirm before purchase.",
            "7. Real Store Purchase & Receipt" to "Once confirmed, Runner pays the store and logs actual receipt amount.",
            "8. Doorstep Delivery + 4-Digit OTP" to "Runner brings items to your flat/building and verifies your unique 4-digit OTP.",
            "9. Atomic Credit & Wallet Settlement" to "Exactly 1 subscription credit is deducted and actual MRP bill is debited from wallet.",
            "10. Full Immutable Ledger" to "Every rupee and credit entry is permanently recorded in your wallet and subscription ledgers.",
            "11. 24/7 Operations & Safety" to "Moderated chat, report tools, and direct Admin support ensure trusted local service."
        )
    }

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { SectionHeader("How M-PARTNER Works", "11-step transparent local errand lifecycle") }
        items(steps) { (title, desc) ->
            Surface(color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(title, fontWeight = FontWeight.Bold)
                    Text(desc, style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                }
            }
        }
        item {
            Button(onClick = onStartOrder, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) { Text("Open Customer Portal") }
        }
    }
}

@Composable
fun PlansScreen(plans: List<SubscriptionPlan>, settings: PlatformSettings, onSubscribeClick: () -> Unit) {
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { SectionHeader("Subscription Plans", "UPI ID: ${settings.upiId} • All plans valid for 30 days") }
        items(plans) { plan ->
            Surface(
                color = if (plan.id == "plan_standard") BrandBlack else BrandPureWhite,
                contentColor = if (plan.id == "plan_standard") BrandPureWhite else BrandBlack,
                shape = MaterialTheme.shapes.large,
                border = BorderStroke(1.dp, if (plan.id == "plan_standard") BrandBlack else BrandBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(plan.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
                        Text(formatInr(plan.price), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                    }
                    Text(plan.description, style = MaterialTheme.typography.bodyMedium)
                    Text("${plan.credits} Completed Deliveries • ${plan.validityDays} Days Validity", style = MaterialTheme.typography.labelLarge)
                    Button(
                        onClick = onSubscribeClick,
                        colors = ButtonDefaults.buttonColors(containerColor = if (plan.id == "plan_standard") BrandEmerald else BrandBlack, contentColor = BrandPureWhite),
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)
                    ) { Text("Subscribe to ${plan.name}") }
                }
            }
        }
    }
}

@Composable
fun FaqScreen() {
    var query by remember { mutableStateOf("") }
    val faqs = remember {
        listOf(
            "What is the difference between Subscription Credits and Wallet Balance?" to "Subscription Credits pay exclusively for your Runner's delivery visits (e.g. 20 visits for ₹200). Wallet Balance pays purely for the groceries/medicines at actual shop MRP.",
            "When is a delivery credit deducted?" to "Credits are NEVER deducted when placing an order. Exactly 1 credit is deducted only after OTP-verified doorstep delivery completion.",
            "What if a shop charges a different price?" to "Your Runner submits itemized verified prices via the Price Confirmation flow. You must approve the bill before purchase proceeds.",
            "Can I switch my Runner?" to "For trust and neighborhood safety, M-PARTNER assigns one dedicated local Runner per customer. Admin Operations can reassign if needed.",
            "What happens to unused credits after 30 days?" to "Subscription credits remain valid for 30 days from Admin payment activation and expire at the end of the cycle."
        )
    }
    val filtered = faqs.filter { query.isBlank() || it.first.contains(query, true) || it.second.contains(query, true) }

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { SectionHeader("Frequently Asked Questions") }
        item {
            OutlinedTextField(value = query, onValueChange = { query = it }, placeholder = { Text("Search FAQ topics...") }, leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) }, singleLine = true, modifier = Modifier.fillMaxWidth())
        }
        items(filtered) { (q, a) ->
            var expanded by remember { mutableStateOf(true) }
            Surface(onClick = { expanded = !expanded }, color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(q, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                        Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, contentDescription = null)
                    }
                    if (expanded) Text(a, style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                }
            }
        }
    }
}

@Composable
fun AboutScreen(settings: PlatformSettings) {
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Surface(color = BrandBlack, contentColor = BrandPureWhite, shape = MaterialTheme.shapes.large) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(settings.brandingText, style = MaterialTheme.typography.labelSmall, color = BrandEmerald)
                    Text("About M-PARTNER", style = MaterialTheme.typography.headlineMedium)
                    Text(
                        "Built for Indian households starting in Ambarnath (Khuntavli, Kansai Section, Shiv Mandir MIDC), M-PARTNER replaces unpredictable per-order surge fees with dependable neighborhood Runners on transparent monthly plans.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = BrandPureWhite.copy(alpha = 0.85f)
                    )
                }
            }
        }
        item {
            Surface(color = BrandSurface, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Operations & Contact", fontWeight = FontWeight.Bold)
                    Text("Phone: ${settings.supportPhone}", style = MaterialTheme.typography.bodyMedium)
                    Text("Email: ${settings.supportEmail}", style = MaterialTheme.typography.bodyMedium)
                    Text("Primary Settlement UPI: ${settings.upiId}", style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}

@Composable
fun ContactScreen(
    settings: PlatformSettings,
    onSubmitContact: (name: String, email: String, phone: String, subject: String, message: String, onDone: () -> Unit) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var subject by remember { mutableStateOf("Service Inquiry") }
    var message by remember { mutableStateOf("") }

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { SectionHeader("Contact Operations", "Call ${settings.supportPhone} or send a support ticket") }
        item { OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Full Name") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
        item { OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email Address") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
        item { OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Phone Number") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
        item { OutlinedTextField(value = subject, onValueChange = { subject = it }, label = { Text("Subject") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
        item { OutlinedTextField(value = message, onValueChange = { message = it }, label = { Text("Message") }, minLines = 3, modifier = Modifier.fillMaxWidth()) }
        item {
            Button(
                onClick = { onSubmitContact(name, email, phone, subject, message) { message = "" } },
                enabled = subject.isNotBlank() && message.isNotBlank(),
                modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("contact_submit_button")
            ) { Text("Submit Inquiry") }
        }
    }
}

@Composable
fun LegalScreen() {
    val docs = remember {
        listOf(
            "Terms" to "M-PARTNER connects registered households with vetted local Runners under monthly delivery credit subscriptions. Delivery credits have a 30-day lifecycle and are consumed only upon completed deliveries.",
            "Privacy" to "We collect only delivery address, contact details, and order ledger history needed to fulfill neighborhood errands. Private order chats are visible strictly to the assigned Customer, Runner, and Admin Safety audit.",
            "Refunds" to "Unused subscription credits expire after 30 days. Wallet balances used for shopping purchases are eligible for verified Admin refunds with mandatory audit reason.",
            "Runner Rules" to "Runners must uphold MRP bill transparency, verify expiry dates, submit itemized price confirmations before high-value purchases, and complete deliveries only against customer 4-digit OTP.",
            "Moderation" to "In-app chats apply real-time community guideline filtering and rate limiting (5 messages per 10 seconds). Reported messages are reviewed by M-PARTNER Operations."
        )
    }
    var selectedIdx by remember { mutableIntStateOf(0) }

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { SectionHeader("Legal & Community Policies") }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(docs.indices.toList()) { i ->
                    FilterChip(selected = selectedIdx == i, onClick = { selectedIdx = i }, label = { Text(docs[i].first) })
                }
            }
        }
        item {
            val (title, body) = docs[selectedIdx]
            Surface(color = BrandSurface, shape = MaterialTheme.shapes.large, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("$title Policy", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text(body, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}

@Composable
fun TestsScreen(report: BusinessRuleTestReport?, onRunTests: () -> Unit) {
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { SectionHeader("Automated Business Rule Suite", "Verifying all 20 mandatory financial & RBAC invariants", "Re-run 20 Tests", onRunTests) }
        if (report != null) {
            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Surface(modifier = Modifier.weight(1f), color = BrandSurface, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder)) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("TOTAL", style = MaterialTheme.typography.labelSmall, color = BrandMutedText)
                            Text("${report.total}", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                        }
                    }
                    Surface(modifier = Modifier.weight(1f), color = BrandEmeraldContainer, shape = MaterialTheme.shapes.medium) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("PASSED", style = MaterialTheme.typography.labelSmall)
                            Text("${report.passed}", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = BrandEmerald)
                        }
                    }
                    Surface(modifier = Modifier.weight(1f), color = if (report.failed > 0) BrandRoseContainer else BrandSurface, shape = MaterialTheme.shapes.medium) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("FAILED", style = MaterialTheme.typography.labelSmall)
                            Text("${report.failed}", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            items(report.results) { t ->
                Surface(color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                    Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Icon(if (t.passed) Icons.Default.CheckCircle else Icons.Default.Error, contentDescription = null, tint = if (t.passed) BrandEmerald else BrandRose)
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text("#${t.id} ${t.rule}", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                                StatusPill(if (t.passed) "PASSED" else "FAILED")
                            }
                            Text(t.details, style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                        }
                    }
                }
            }
        }
    }
}
