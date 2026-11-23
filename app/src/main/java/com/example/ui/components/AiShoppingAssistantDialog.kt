package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.model.OrderItem
import com.example.ui.ConciergeMessage
import com.example.ui.ConciergeUiState
import com.example.ui.SmartListUiState
import com.example.ui.theme.*

@Composable
fun AiShoppingAssistantDialog(
    isOpen: Boolean,
    smartListState: SmartListUiState,
    conciergeState: ConciergeUiState,
    conciergeHistory: List<ConciergeMessage>,
    onGenerateSmartList: (String) -> Unit,
    onAskConcierge: (String) -> Unit,
    onApplyItems: ((List<OrderItem>, String) -> Unit)? = null,
    onDismiss: () -> Unit
) {
    if (!isOpen) return

    var activeTab by remember { mutableIntStateOf(0) }
    var listPrompt by remember { mutableStateOf("") }
    var chatInput by remember { mutableStateOf("") }

    val quickPrompts = remember {
        listOf(
            "Weekly breakfast essentials: milk, multigrain bread, eggs, butter, bananas",
            "Dinner recipe ingredients for Paneer Butter Masala for 4 people",
            "Household cleaning staples: dishwash gel, floor cleaner, sponges, paper towels"
        )
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(0.94f).fillMaxHeight(0.86f),
            shape = MaterialTheme.shapes.extraLarge,
            color = BrandPureWhite,
            shadowElevation = 12.dp
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                Surface(color = BrandBlack, contentColor = BrandPureWhite) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 18.dp, vertical = 14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Box(
                                modifier = Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)).background(BrandIndigo),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = BrandPureWhite)
                            }
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text("M-PARTNER AI Suite", fontWeight = FontWeight.Bold)
                                    Surface(color = BrandPureWhite.copy(alpha = 0.16f), shape = RoundedCornerShape(6.dp)) {
                                        Text("Gemini 3.8", style = MaterialTheme.typography.labelSmall, color = BrandPureWhite, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                    }
                                }
                                Text("Powered by Mãrçò 💯", style = MaterialTheme.typography.bodySmall, color = BrandPureWhite.copy(alpha = 0.7f))
                            }
                        }
                        IconButton(onClick = onDismiss, modifier = Modifier.size(48.dp).testTag("ai_dialog_close_button")) {
                            Icon(Icons.Default.Close, contentDescription = "Close AI Assistant", tint = BrandPureWhite)
                        }
                    }
                }

                TabRow(selectedTabIndex = activeTab, containerColor = BrandSurface) {
                    Tab(
                        selected = activeTab == 0,
                        onClick = { activeTab = 0 },
                        modifier = Modifier.testTag("ai_tab_smart_list"),
                        text = { Text("Smart List Maker") },
                        icon = { Icon(Icons.Default.ShoppingBag, contentDescription = null, modifier = Modifier.size(16.dp)) }
                    )
                    Tab(
                        selected = activeTab == 1,
                        onClick = { activeTab = 1 },
                        modifier = Modifier.testTag("ai_tab_concierge"),
                        text = { Text("AI Concierge") },
                        icon = { Icon(Icons.Default.SmartToy, contentDescription = null, modifier = Modifier.size(16.dp)) }
                    )
                }

                if (activeTab == 0) {
                    LazyColumn(modifier = Modifier.weight(1f).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        item {
                            Text("What do you need today? Type naturally or pick a quick preset:", style = MaterialTheme.typography.labelLarge)
                            Spacer(modifier = Modifier.height(6.dp))
                            OutlinedTextField(
                                value = listPrompt,
                                onValueChange = { listPrompt = it },
                                placeholder = { Text("e.g. 1L toned milk, brown bread, dozen eggs, 250g paneer...") },
                                minLines = 3,
                                maxLines = 4,
                                modifier = Modifier.fillMaxWidth().testTag("ai_list_prompt_input")
                            )
                        }
                        item {
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(quickPrompts) { qp ->
                                    SuggestionChip(
                                        onClick = {
                                            listPrompt = qp
                                            onGenerateSmartList(qp)
                                        },
                                        label = { Text(qp.substringBefore(":")) }
                                    )
                                }
                            }
                        }
                        item {
                            Button(
                                onClick = { onGenerateSmartList(listPrompt) },
                                enabled = smartListState !is SmartListUiState.Loading && listPrompt.isNotBlank(),
                                modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("ai_generate_list_button")
                            ) {
                                if (smartListState is SmartListUiState.Loading) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = BrandPureWhite, strokeWidth = 2.dp)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Gemini AI is parsing & estimating INR...")
                                } else {
                                    Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Generate Structured Shopping List")
                                }
                            }
                        }

                        when (smartListState) {
                            is SmartListUiState.Error -> item {
                                Surface(color = BrandRoseContainer, shape = MaterialTheme.shapes.medium, border = BorderStroke(1.dp, BrandRose.copy(alpha = 0.3f))) {
                                    Text(smartListState.message, color = BrandRose, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(12.dp))
                                }
                            }
                            is SmartListUiState.Success -> {
                                val data = smartListState.result
                                item {
                                    Surface(color = BrandSurface, shape = MaterialTheme.shapes.large, border = BorderStroke(1.dp, BrandBorder)) {
                                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                                Column(modifier = Modifier.weight(1f)) {
                                                    Text(data.summary, fontWeight = FontWeight.Bold)
                                                    Text("Stores: ${data.suggestedStores.joinToString()}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                                                }
                                                Column(horizontalAlignment = Alignment.End) {
                                                    Text("EST. TOTAL", style = MaterialTheme.typography.labelSmall, color = BrandMutedText)
                                                    Text(formatInr(data.totalEstimatedPrice), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
                                                }
                                            }
                                            HorizontalDivider()
                                            data.items.forEach { it ->
                                                Surface(color = BrandPureWhite, shape = MaterialTheme.shapes.small, border = BorderStroke(1.dp, BrandBorder)) {
                                                    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                                        Column(modifier = Modifier.weight(1f)) {
                                                            Text(it.name, fontWeight = FontWeight.SemiBold)
                                                            Text("${it.quantity} • ${it.category}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                                                        }
                                                        Text("~${formatInr(it.estimatedPriceInr)}", fontWeight = FontWeight.Bold)
                                                    }
                                                }
                                            }
                                            Surface(color = BrandAmberContainer, shape = MaterialTheme.shapes.small) {
                                                Text("Runner Tip: ${data.runnerInstructions}", style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(10.dp))
                                            }
                                            if (onApplyItems != null) {
                                                Button(
                                                    onClick = {
                                                        val mapped = data.items.mapIndexed { idx, s ->
                                                            OrderItem("ai_$idx", s.name, 1.0, s.quantity, estimatedPrice = s.estimatedPriceInr, notes = s.storeType)
                                                        }
                                                        onApplyItems(mapped, data.runnerInstructions)
                                                        onDismiss()
                                                    },
                                                    colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald),
                                                    modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("ai_apply_items_button")
                                                ) {
                                                    Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Text("Apply Items to Order Request")
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else -> Unit
                        }
                    }
                } else {
                    Column(modifier = Modifier.weight(1f)) {
                        LazyColumn(modifier = Modifier.weight(1f).padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            items(conciergeHistory) { msg ->
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = if (msg.isUser) Arrangement.End else Arrangement.Start) {
                                    Surface(
                                        color = if (msg.isUser) BrandBlack else BrandSurface,
                                        contentColor = if (msg.isUser) BrandPureWhite else BrandBlack,
                                        shape = RoundedCornerShape(16.dp),
                                        border = if (msg.isUser) null else BorderStroke(1.dp, BrandBorder),
                                        modifier = Modifier.widthIn(max = 300.dp)
                                    ) {
                                        Text(msg.text, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(12.dp))
                                    }
                                }
                            }
                            when (conciergeState) {
                                is ConciergeUiState.Loading -> item {
                                    Text("M-PARTNER AI is thinking...", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                                }
                                is ConciergeUiState.Streaming -> item {
                                    Surface(color = BrandSurface, shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, BrandBorder)) {
                                        Text(conciergeState.text, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(12.dp))
                                    }
                                }
                                is ConciergeUiState.Error -> item {
                                    Surface(color = BrandRoseContainer, shape = MaterialTheme.shapes.small) {
                                        Text(conciergeState.message, color = BrandRose, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(10.dp))
                                    }
                                }
                                else -> Unit
                            }
                        }
                        HorizontalDivider()
                        Row(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = chatInput,
                                onValueChange = { chatInput = it },
                                placeholder = { Text("Ask about plans, wallet, runner OTP...") },
                                singleLine = true,
                                modifier = Modifier.weight(1f).testTag("ai_concierge_input")
                            )
                            IconButton(
                                onClick = {
                                    val q = chatInput
                                    chatInput = ""
                                    onAskConcierge(q)
                                },
                                enabled = chatInput.isNotBlank() && conciergeState !is ConciergeUiState.Loading && conciergeState !is ConciergeUiState.Streaming,
                                modifier = Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(BrandBlack).testTag("ai_concierge_send_button")
                            ) {
                                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send question", tint = BrandPureWhite)
                            }
                        }
                    }
                }
            }
        }
    }
}
