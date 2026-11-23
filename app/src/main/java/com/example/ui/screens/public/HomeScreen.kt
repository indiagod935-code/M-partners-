package com.example.ui.screens.public

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.R
import com.example.firebase.DeliveryRequest
import com.example.model.OrderItem
import com.example.model.ServiceArea
import com.example.model.SubscriptionPlan
import com.example.model.User
import com.example.ui.FirestoreUiState
import com.example.ui.components.DeliveryRequestComposerCard
import com.example.ui.components.FirestoreRequestsFeed
import com.example.ui.components.SectionHeader
import com.example.ui.components.formatInr
import com.example.ui.theme.*

@Composable
fun HomeScreen(
    currentUser: User?,
    serviceAreas: List<ServiceArea>,
    plans: List<SubscriptionPlan>,
    firestoreRequestsState: FirestoreUiState<List<DeliveryRequest>>,
    isSubmittingFirestore: Boolean,
    onSubmitFirestoreRequest: (itemsText: String, address: String, preferredTime: String, notes: String, onClear: () -> Unit) -> Unit,
    onEditFirestoreRequest: (req: DeliveryRequest, itemsText: String, address: String, notes: String) -> Unit,
    onCancelFirestoreRequest: (requestId: String) -> Unit,
    onDeleteFirestoreRequest: (requestId: String) -> Unit,
    onGoPortal: () -> Unit,
    onNavigateRoute: (String) -> Unit,
    onOpenAiSuite: (((List<OrderItem>, String) -> Unit)?) -> Unit
) {
    var searchArea by remember { mutableStateOf("") }
    var matchedArea by remember { mutableStateOf<ServiceArea?>(null) }
    var checkedArea by remember { mutableStateOf(false) }
    var aiDraftText by remember { mutableStateOf<String?>(null) }

    val defaultAddress = remember(currentUser) {
        listOfNotNull(currentUser?.building, currentUser?.address, currentUser?.locality)
            .filter { it.isNotBlank() }
            .joinToString(", ")
            .ifBlank { "Khuntavli, Ambarnath (West)" }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(BrandPureWhite),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        item {
            DeliveryRequestComposerCard(
                defaultAddress = defaultAddress,
                isSubmitting = isSubmittingFirestore,
                externalItemsDraft = aiDraftText,
                onConsumeExternalDraft = { aiDraftText = null },
                onOpenAiSmartList = {
                    onOpenAiSuite { aiItems, runnerNotes ->
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
            Surface(color = BrandBlack, contentColor = BrandPureWhite, shape = MaterialTheme.shapes.extraLarge) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Surface(color = BrandPureWhite.copy(alpha = 0.14f), shape = RoundedCornerShape(999.dp)) {
                        Text("POWERED BY MÃRÇÒ 💯", style = MaterialTheme.typography.labelSmall, color = BrandPureWhite, modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp))
                    }
                    Text("Your Needs.\nYour Trusted Partner.", style = MaterialTheme.typography.headlineLarge, color = BrandPureWhite)
                    Text(
                        "Neighborhood grocery, pharmacy & daily essentials shopped by your dedicated local Runner with 100% bill transparency and OTP-verified doorstep delivery.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = BrandPureWhite.copy(alpha = 0.82f)
                    )
                    Image(
                        painter = painterResource(id = R.drawable.img_hero_delivery),
                        contentDescription = "M-PARTNER neighborhood personal runner illustration",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxWidth().height(175.dp).clip(MaterialTheme.shapes.large)
                    )
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(
                            onClick = { if (currentUser != null) onGoPortal() else onNavigateRoute("login") },
                            colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald, contentColor = BrandPureWhite),
                            modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("home_primary_cta")
                        ) { Text(if (currentUser != null) "Open Dashboard" else "Switch Role") }
                        OutlinedButton(
                            onClick = { onOpenAiSuite(null) },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = BrandPureWhite),
                            border = BorderStroke(1.dp, BrandPureWhite.copy(alpha = 0.4f)),
                            modifier = Modifier.weight(1f).heightIn(min = 48.dp).testTag("home_ai_cta")
                        ) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("AI Assistant")
                        }
                    }
                }
            }
        }

        item {
            Surface(color = BrandSurface, shape = MaterialTheme.shapes.large, border = BorderStroke(1.dp, BrandBorder)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, tint = BrandBlack)
                        Text("Check Neighborhood Availability", style = MaterialTheme.typography.titleMedium)
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        OutlinedTextField(
                            value = searchArea,
                            onValueChange = { searchArea = it; checkedArea = false },
                            placeholder = { Text("Enter area or pincode (e.g. Khuntavli, 421501)") },
                            singleLine = true,
                            modifier = Modifier.weight(1f).testTag("home_area_input")
                        )
                        Button(
                            onClick = {
                                val q = searchArea.trim().lowercase()
                                matchedArea = if (q.isEmpty()) null else serviceAreas.find {
                                    it.name.lowercase().contains(q) || it.city.lowercase().contains(q) || (it.pincode ?: "").contains(q)
                                }
                                checkedArea = true
                            },
                            modifier = Modifier.heightIn(min = 52.dp).testTag("home_check_area_button")
                        ) { Text("Check") }
                    }
                    if (checkedArea) {
                        if (matchedArea != null) {
                            Surface(color = BrandEmeraldContainer, shape = MaterialTheme.shapes.small) {
                                Text("Service Active in ${matchedArea!!.name} (${matchedArea!!.city} - ${matchedArea!!.pincode ?: ""})! Dedicated Runners available.", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(10.dp))
                            }
                        } else {
                            Surface(color = BrandAmberContainer, shape = MaterialTheme.shapes.small) {
                                Text("Zone not listed yet. Active hubs: ${serviceAreas.joinToString { "${it.name} (${it.pincode})" }}", style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(10.dp))
                            }
                        }
                    }
                }
            }
        }

        item {
            SectionHeader("Transparent Dual-Flow Model", "Separate delivery subscription credits from product purchase funds")
            Spacer(modifier = Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Surface(modifier = Modifier.weight(1f), color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder)) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Default.ConfirmationNumber, contentDescription = null, tint = BrandEmerald)
                        Text("1. Subscription Credits", fontWeight = FontWeight.Bold)
                        Text("Covers Runner delivery service. Starting ₹200 for 20 completed deliveries (30-day validity).", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                    }
                }
                Surface(modifier = Modifier.weight(1f), color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder)) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Default.AccountBalanceWallet, contentDescription = null, tint = BrandIndigo)
                        Text("2. Shopping Wallet", fontWeight = FontWeight.Bold)
                        Text("100% used for actual grocery bills at shop MRP after you confirm prices. Zero hidden markups.", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                    }
                }
            }
        }

        item {
            SectionHeader("Monthly Delivery Plans", "₹10 effective per completed delivery", "View All") { onNavigateRoute("plans") }
            Spacer(modifier = Modifier.height(10.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(plans) { plan ->
                    Surface(
                        color = if (plan.id == "plan_standard") BrandBlack else BrandSurface,
                        contentColor = if (plan.id == "plan_standard") BrandPureWhite else BrandBlack,
                        shape = MaterialTheme.shapes.large,
                        border = BorderStroke(1.dp, if (plan.id == "plan_standard") BrandBlack else BrandBorder),
                        modifier = Modifier.width(190.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(plan.name.uppercase(), style = MaterialTheme.typography.labelSmall)
                            Text(formatInr(plan.price), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold)
                            Text("${plan.credits} Delivery Credits", fontWeight = FontWeight.Bold)
                            Text("Valid ${plan.validityDays} days • MRP Transparency", style = MaterialTheme.typography.bodySmall, color = if (plan.id == "plan_standard") BrandPureWhite.copy(alpha = 0.75f) else BrandMutedText)
                        }
                    }
                }
            }
        }

        item {
            SectionHeader("Explore M-PARTNER", "Guides, verification & community policies")
            Spacer(modifier = Modifier.height(10.dp))
            val quickLinks = listOf(
                Triple("how_it_works", "How It Works (11 Steps)", Icons.Default.Timeline),
                Triple("faq", "Frequently Asked Questions", Icons.Default.HelpOutline),
                Triple("about", "About M-PARTNER & Mãrçò 💯", Icons.Default.Info),
                Triple("contact", "Contact Operations & Support", Icons.Default.SupportAgent),
                Triple("legal", "Privacy, Terms & Safety Policies", Icons.Default.Gavel),
                Triple("tests", "Automated Business Rule Verifier (20/20)", Icons.Default.VerifiedUser)
            )
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                quickLinks.forEach { (route, label, icon) ->
                    Surface(
                        onClick = { onNavigateRoute(route) },
                        color = BrandPureWhite,
                        shape = MaterialTheme.shapes.medium,
                        border = BorderStroke(1.dp, BrandBorder),
                        modifier = Modifier.fillMaxWidth().testTag("home_link_$route")
                    ) {
                        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Icon(icon, contentDescription = null, tint = BrandBlack)
                                Text(label, style = MaterialTheme.typography.titleMedium)
                            }
                            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = BrandMutedText)
                        }
                    }
                }
            }
        }
    }
}
