package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.User
import com.example.ui.theme.*
import kotlin.math.roundToInt

@Composable
fun MPartnerTopBar(
    currentUser: User?,
    signedInEmail: String? = null,
    onBrandClick: () -> Unit,
    onSwitchDemoRole: (String) -> Unit,
    onOpenAiSuite: () -> Unit,
    onLoginClick: () -> Unit,
    onLogoutClick: () -> Unit
) {
    Surface(color = BrandPureWhite, tonalElevation = 0.dp, shadowElevation = 2.dp) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { onBrandClick() }
                        .padding(vertical = 4.dp, horizontal = 2.dp)
                        .testTag("brand_logo_button"),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(BrandBlack),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("M", color = BrandPureWhite, fontWeight = FontWeight.Black, fontSize = 18.sp)
                    }
                    Column {
                        Text("M-PARTNER", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold, color = BrandBlack)
                        Text(
                            signedInEmail ?: "Powered by Mãrçò 💯",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (signedInEmail != null) BrandEmerald else BrandMutedText,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    FilledTonalIconButton(
                        onClick = onOpenAiSuite,
                        modifier = Modifier.size(44.dp).testTag("top_bar_ai_button"),
                        colors = IconButtonDefaults.filledTonalIconButtonColors(containerColor = BrandIndigoContainer, contentColor = BrandIndigo)
                    ) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = "Open M-PARTNER AI Suite")
                    }

                    OutlinedButton(
                        onClick = onLogoutClick,
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        modifier = Modifier.heightIn(min = 44.dp).testTag("top_bar_logout_button"),
                        border = BorderStroke(1.dp, BrandBorder)
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Sign Out", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Sign Out", style = MaterialTheme.typography.labelLarge)
                    }
                }
            }

            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                item {
                    Text("DEMO:", style = MaterialTheme.typography.labelSmall, color = BrandMutedText, fontWeight = FontWeight.Bold)
                }
                items(
                    listOf(
                        Triple("customer", "Customer Aarav", Icons.Default.Person),
                        Triple("runner", "Runner Rohan", Icons.Default.DirectionsBike),
                        Triple("admin", "Admin Ops", Icons.Default.AdminPanelSettings)
                    )
                ) { (roleKey, label, icon) ->
                    val isSelected = currentUser?.role == roleKey
                    FilterChip(
                        selected = isSelected,
                        onClick = { onSwitchDemoRole(roleKey) },
                        label = { Text(label, style = MaterialTheme.typography.labelSmall, maxLines = 1) },
                        leadingIcon = { Icon(icon, contentDescription = null, modifier = Modifier.size(14.dp)) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BrandBlack,
                            selectedLabelColor = BrandPureWhite,
                            selectedLeadingIconColor = BrandPureWhite
                        ),
                        modifier = Modifier.testTag("demo_switch_$roleKey")
                    )
                }
            }
        }
    }
}

@Composable
fun StatusPill(status: String, modifier: Modifier = Modifier) {
    val label = status.replace("_", " ").uppercase()
    val (bg, fg) = when (status.lowercase()) {
        "completed", "active", "approved", "resolved", "price_confirmed", "online", "passed" -> BrandEmeraldContainer to Color(0xFF065F46)
        "cancelled", "rejected", "suspended", "expired", "exhausted", "blocked", "failed" -> BrandRoseContainer to Color(0xFF991B1B)
        "price_confirmation_pending", "pending_verification", "pending", "delivered_pending_completion" -> BrandAmberContainer to Color(0xFF92400E)
        else -> BrandSurfaceVariant to BrandBlack
    }
    Surface(modifier = modifier, color = bg, shape = RoundedCornerShape(999.dp)) {
        Text(
            text = label,
            color = fg,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}

@Composable
fun KpiMetricCard(
    title: String,
    value: String,
    subtitle: String? = null,
    icon: ImageVector? = null,
    accentColor: Color = BrandBlack,
    modifier: Modifier = Modifier
) {
    Surface(modifier = modifier, color = BrandPureWhite, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandBorder)) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(title.uppercase(), style = MaterialTheme.typography.labelSmall, color = BrandMutedText, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                if (icon != null) Icon(icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(18.dp))
            }
            Text(value, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, color = accentColor)
            if (!subtitle.isNullOrBlank()) {
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = BrandMutedText, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
fun SectionHeader(title: String, subtitle: String? = null, actionLabel: String? = null, onActionClick: (() -> Unit)? = null) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = BrandBlack)
            if (!subtitle.isNullOrBlank()) Text(subtitle, style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
        }
        if (actionLabel != null && onActionClick != null) {
            TextButton(onClick = onActionClick, modifier = Modifier.heightIn(min = 48.dp)) {
                Text(actionLabel, fontWeight = FontWeight.Bold)
            }
        }
    }
}

fun formatInr(amount: Double?): String {
    if (amount == null) return "₹0"
    val rounded = amount.roundToInt()
    return if (amount == rounded.toDouble()) "₹$rounded" else "₹${"%.2f".format(amount)}"
}

@Composable
fun OrderStepBadgeRow(status: String) {
    val steps = listOf("Placed", "Assigned", "Accepted", "Shopping", "Bought", "On Way", "Done")
    val orderIndex = when (status) {
        "order_placed" -> 0
        "runner_assigned" -> 1
        "order_accepted" -> 2
        "shopping_in_progress", "price_confirmation_pending", "price_confirmed" -> 3
        "purchase_recorded" -> 4
        "out_for_delivery", "delivered_pending_completion" -> 5
        "completed" -> 6
        else -> -1
    }
    if (orderIndex < 0) return

    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        steps.forEachIndexed { idx, label ->
            val reached = idx <= orderIndex
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
                Box(
                    modifier = Modifier.size(18.dp).clip(CircleShape).background(if (reached) BrandEmerald else BrandSurfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    if (reached) Icon(Icons.Default.Check, contentDescription = null, tint = BrandPureWhite, modifier = Modifier.size(11.dp))
                }
                Spacer(modifier = Modifier.height(3.dp))
                Text(label, fontSize = 9.sp, fontWeight = if (reached) FontWeight.Bold else FontWeight.Normal, color = if (reached) BrandBlack else BrandMutedText, maxLines = 1)
            }
        }
    }
}
