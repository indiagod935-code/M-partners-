package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.example.ui.FirestoreUiState
import com.example.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Locale

@Composable
fun DeliveryRequestComposerCard(
    defaultAddress: String,
    isSubmitting: Boolean,
    externalItemsDraft: String? = null,
    onConsumeExternalDraft: () -> Unit = {},
    onOpenAiSmartList: () -> Unit,
    onSaveToFirestore: (
        itemsText: String,
        deliveryAddress: String,
        preferredTime: String,
        notes: String,
        onClear: () -> Unit
    ) -> Unit
) {
    var itemsText by remember { mutableStateOf("") }
    var deliveryAddress by remember(defaultAddress) { mutableStateOf(defaultAddress) }
    var preferredTime by remember { mutableStateOf("ASAP (Within 45 mins)") }
    var notes by remember { mutableStateOf("") }
    var showAdvancedFields by remember { mutableStateOf(false) }

    LaunchedEffect(externalItemsDraft) {
        if (!externalItemsDraft.isNullOrBlank()) {
            itemsText = externalItemsDraft
            onConsumeExternalDraft()
        }
    }

    val presets = remember {
        listOf(
            "Dairy & Breakfast" to "1L Amul Taaza Milk, 1 Brown Bread, 12 Farm Eggs, 100g Butter",
            "Veggies & Dal" to "1kg Tomatoes, 1kg Onions, 500g Toor Dal, 250g Fresh Paneer",
            "Pharmacy Run" to "Dolo 650 strip, ORS 2 sachets, Bandage roll"
        )
    }

    Surface(
        color = BrandPureWhite,
        shape = MaterialTheme.shapes.extraLarge,
        border = BorderStroke(1.5.dp, BrandBlack),
        shadowElevation = 3.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Quick Delivery Request",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = BrandBlack
                    )
                    Text(
                        "List the items you need and save directly to Firestore",
                        style = MaterialTheme.typography.bodySmall,
                        color = BrandMutedText
                    )
                }
                Surface(
                    color = BrandEmeraldContainer,
                    shape = RoundedCornerShape(999.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(Icons.Default.CloudDone, contentDescription = null, tint = BrandEmerald, modifier = Modifier.size(14.dp))
                        Text("CLOUD SYNC", style = MaterialTheme.typography.labelSmall, color = BrandEmerald, fontWeight = FontWeight.Bold)
                    }
                }
            }

            OutlinedTextField(
                value = itemsText,
                onValueChange = { itemsText = it },
                label = { Text("Items Needed (Samaan List) *") },
                placeholder = { Text("e.g. 1L Amul Milk, 1 Brown Bread, 500g Sugar, 250g Paneer...") },
                minLines = 3,
                maxLines = 5,
                leadingIcon = { Icon(Icons.Default.ShoppingBasket, contentDescription = null) },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("firestore_items_input")
            )

            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(presets) { (label, value) ->
                    SuggestionChip(
                        onClick = { itemsText = value },
                        label = { Text(label) }
                    )
                }
                item {
                    AssistChip(
                        onClick = onOpenAiSmartList,
                        leadingIcon = { Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp)) },
                        label = { Text("AI Smart Fill") }
                    )
                }
            }

            TextButton(
                onClick = { showAdvancedFields = !showAdvancedFields },
                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 0.dp),
                modifier = Modifier.heightIn(min = 40.dp)
            ) {
                Icon(
                    if (showAdvancedFields) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(if (showAdvancedFields) "Hide Address & Notes" else "Delivery Address & Notes (Optional)")
            }

            if (showAdvancedFields) {
                OutlinedTextField(
                    value = deliveryAddress,
                    onValueChange = { deliveryAddress = it },
                    label = { Text("Delivery Address") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("firestore_address_input")
                )
                OutlinedTextField(
                    value = preferredTime,
                    onValueChange = { preferredTime = it },
                    label = { Text("Preferred Time Slot") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Brand / Store Notes") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("firestore_notes_input")
                )
            }

            Button(
                onClick = {
                    onSaveToFirestore(itemsText, deliveryAddress, preferredTime, notes) {
                        itemsText = ""
                        notes = ""
                    }
                },
                enabled = !isSubmitting && itemsText.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald, contentColor = BrandPureWhite),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 52.dp)
                    .testTag("firestore_save_request_button")
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = BrandPureWhite,
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Saving to Firestore...")
                } else {
                    Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Submit & Save Request to Firestore", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun FirestoreRequestsFeed(
    state: FirestoreUiState<List<DeliveryRequest>>,
    onEditRequest: (request: DeliveryRequest, newItems: String, newAddr: String, newNotes: String) -> Unit,
    onCancelRequest: (requestId: String) -> Unit,
    onDeleteRequest: (requestId: String) -> Unit
) {
    var editTarget by remember { mutableStateOf<DeliveryRequest?>(null) }
    val dateFormat = remember { SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault()) }

    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SectionHeader(
            title = "Live Firestore Delivery Requests",
            subtitle = "Synced in real time to your Google account"
        )

        when (state) {
            is FirestoreUiState.Loading -> {
                Surface(
                    color = BrandSurface,
                    shape = MaterialTheme.shapes.medium,
                    border = BorderStroke(1.dp, BrandBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        Text("Syncing your Firestore requests...", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            is FirestoreUiState.Error -> {
                Surface(
                    color = BrandRoseContainer,
                    shape = MaterialTheme.shapes.medium,
                    border = BorderStroke(1.dp, BrandRose.copy(alpha = 0.4f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = BrandRose)
                        Text(state.message, color = BrandRose, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }

            is FirestoreUiState.Success -> {
                if (state.data.isEmpty()) {
                    Surface(
                        color = BrandSurface,
                        shape = MaterialTheme.shapes.large,
                        border = BorderStroke(1.dp, BrandBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Default.Inventory2, contentDescription = null, tint = BrandMutedText, modifier = Modifier.size(32.dp))
                            Text("No Firestore Requests Yet", fontWeight = FontWeight.Bold)
                            Text(
                                "Type your grocery or pharmacy items above and tap Submit to save your first live cloud request.",
                                style = MaterialTheme.typography.bodySmall,
                                color = BrandMutedText
                            )
                        }
                    }
                } else {
                    state.data.forEach { req ->
                        Surface(
                            color = BrandPureWhite,
                            shape = MaterialTheme.shapes.large,
                            border = BorderStroke(1.dp, BrandBorder),
                            modifier = Modifier.fillMaxWidth().testTag("firestore_request_card_${req.id}")
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    val timeStr = (req.updatedAt ?: req.createdAt)?.toDate()?.let { dateFormat.format(it) } ?: "Just now"
                                    Text(timeStr, style = MaterialTheme.typography.labelSmall, color = BrandMutedText)
                                    StatusPill(req.status)
                                }

                                Text(req.itemsText, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)

                                if (req.deliveryAddress.isNotBlank()) {
                                    Text("Deliver to: ${req.deliveryAddress}", style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                                }
                                if (req.notes.isNotBlank()) {
                                    Text("Note: ${req.notes}", style = MaterialTheme.typography.bodySmall, color = BrandAmber)
                                }

                                if (req.deliveryOtp.isNotBlank() && req.status !in listOf("completed", "cancelled")) {
                                    Surface(color = BrandEmeraldContainer, shape = MaterialTheme.shapes.small) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 6.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text("Delivery OTP", style = MaterialTheme.typography.labelLarge, color = BrandEmerald)
                                            Text(req.deliveryOtp, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black, color = BrandEmerald)
                                        }
                                    }
                                }

                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    if (req.status == "order_placed") {
                                        OutlinedButton(
                                            onClick = { editTarget = req },
                                            modifier = Modifier.heightIn(min = 44.dp)
                                        ) { Text("Edit") }
                                    }
                                    if (req.status !in listOf("completed", "cancelled")) {
                                        OutlinedButton(
                                            onClick = { onCancelRequest(req.id) },
                                            modifier = Modifier.heightIn(min = 44.dp)
                                        ) { Text("Cancel", color = BrandAmber) }
                                    }
                                    TextButton(
                                        onClick = { onDeleteRequest(req.id) },
                                        modifier = Modifier.heightIn(min = 44.dp)
                                    ) { Text("Delete", color = BrandRose) }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    editTarget?.let { req ->
        var editedItems by remember { mutableStateOf(req.itemsText) }
        var editedAddr by remember { mutableStateOf(req.deliveryAddress) }
        var editedNotes by remember { mutableStateOf(req.notes) }
        AlertDialog(
            onDismissRequest = { editTarget = null },
            title = { Text("Edit Delivery Request") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = editedItems,
                        onValueChange = { editedItems = it },
                        label = { Text("Items") },
                        minLines = 3
                    )
                    OutlinedTextField(
                        value = editedAddr,
                        onValueChange = { editedAddr = it },
                        label = { Text("Delivery Address") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = editedNotes,
                        onValueChange = { editedNotes = it },
                        label = { Text("Notes") },
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onEditRequest(req, editedItems, editedAddr, editedNotes)
                        editTarget = null
                    },
                    enabled = editedItems.isNotBlank()
                ) { Text("Update") }
            },
            dismissButton = { TextButton(onClick = { editTarget = null }) { Text("Cancel") } }
        )
    }
}
