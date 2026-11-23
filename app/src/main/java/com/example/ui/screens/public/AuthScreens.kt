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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.credentials.CredentialManager
import com.example.R
import com.example.firebase.onGoogleSignInClicked
import com.example.model.ServiceArea
import com.example.ui.components.SectionHeader
import com.example.ui.theme.*

@Composable
fun AuthScreen(
    isAutoSigningIn: Boolean,
    onAuthSuccess: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val credentialManager = remember(context) { CredentialManager.create(context) }

    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BrandPureWhite)
            .windowInsetsPadding(WindowInsets.safeDrawing),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        item {
            Surface(
                color = BrandBlack,
                contentColor = BrandPureWhite,
                shape = MaterialTheme.shapes.extraLarge,
                modifier = Modifier.fillMaxWidth().widthIn(max = 560.dp)
            ) {
                Column(
                    modifier = Modifier.padding(22.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(BrandEmerald),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "M",
                                color = BrandPureWhite,
                                fontWeight = FontWeight.Black,
                                style = MaterialTheme.typography.headlineMedium
                            )
                        }
                        Column {
                            Text(
                                "M-PARTNER",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.ExtraBold,
                                color = BrandPureWhite
                            )
                            Text(
                                "Powered by Mãrçò 💯",
                                style = MaterialTheme.typography.labelSmall,
                                color = BrandEmerald
                            )
                        }
                    }

                    Text(
                        "Your Needs.\nYour Trusted Partner.",
                        style = MaterialTheme.typography.headlineLarge,
                        color = BrandPureWhite
                    )

                    Text(
                        "Sign in with your Google account to submit neighborhood grocery & pharmacy delivery requests to Firestore, track live runner status, and verify deliveries with 4-digit OTP.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = BrandPureWhite.copy(alpha = 0.82f)
                    )

                    Image(
                        painter = painterResource(id = R.drawable.img_hero_delivery),
                        contentDescription = "M-PARTNER local runner delivery illustration",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(170.dp)
                            .clip(MaterialTheme.shapes.large)
                    )
                }
            }
        }

        item {
            Surface(
                color = BrandSurface,
                shape = MaterialTheme.shapes.extraLarge,
                border = BorderStroke(1.dp, BrandBorder),
                modifier = Modifier.fillMaxWidth().widthIn(max = 560.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        "Sign In to Continue",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = BrandBlack
                    )
                    Text(
                        "Secure authentication powered by Google Sign-In and Firebase Firestore.",
                        style = MaterialTheme.typography.bodySmall,
                        color = BrandMutedText
                    )

                    if (errorMessage != null) {
                        Surface(
                            color = BrandRoseContainer,
                            shape = MaterialTheme.shapes.medium,
                            border = BorderStroke(1.dp, BrandRose.copy(alpha = 0.4f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = BrandRose)
                                Text(
                                    errorMessage!!,
                                    color = BrandRose,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }

                    val busy = isLoading || isAutoSigningIn
                    Button(
                        onClick = {
                            errorMessage = null
                            isLoading = true
                            onGoogleSignInClicked(
                                context = context,
                                credentialManager = credentialManager,
                                onAuthSuccess = {
                                    isLoading = false
                                    onAuthSuccess()
                                },
                                onAuthError = { msg ->
                                    isLoading = false
                                    errorMessage = msg
                                },
                                scope = scope,
                                onAuthCancelled = {
                                    isLoading = false
                                }
                            )
                        },
                        enabled = !busy,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BrandBlack,
                            contentColor = BrandPureWhite
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 54.dp)
                            .testTag("google_sign_in_button")
                    ) {
                        if (busy) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                color = BrandPureWhite,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(if (isAutoSigningIn) "Checking saved Google session..." else "Signing in with Google...")
                        } else {
                            Icon(Icons.Default.AccountCircle, contentDescription = null, modifier = Modifier.size(22.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text("Sign in with Google", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        item {
            Column(
                modifier = Modifier.fillMaxWidth().widthIn(max = 560.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                listOf(
                    Triple(Icons.Default.CloudDone, "Real-Time Firestore Sync", "Submit grocery & pharmacy lists in seconds with live order status tracking."),
                    Triple(Icons.Default.VerifiedUser, "4-Digit OTP Protection", "Every doorstep handover is verified against your personal delivery code."),
                    Triple(Icons.Default.AutoAwesome, "Gemini AI Smart List Maker", "Turn messy notes or recipes into itemized shopping lists automatically.")
                ).forEach { (icon, title, desc) ->
                    Surface(
                        color = BrandPureWhite,
                        shape = MaterialTheme.shapes.medium,
                        border = BorderStroke(1.dp, BrandBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(icon, contentDescription = null, tint = BrandEmerald)
                            Column {
                                Text(title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                                Text(desc, style = MaterialTheme.typography.bodySmall, color = BrandMutedText)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LoginScreen(
    onLogin: (email: String, password: String, expectedRole: String?) -> Unit,
    onDemoSwitch: (role: String) -> Unit,
    onNavigateRegister: () -> Unit
) {
    var selectedRole by remember { mutableStateOf("customer") }
    var email by remember { mutableStateOf("customer.aarav@gmail.com") }
    var password by remember { mutableStateOf("customer123") }

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { SectionHeader("Switch M-PARTNER Portal Profile", "Customer, Runner & Operations Admin Views") }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(
                    Triple("customer", "Customer", "customer.aarav@gmail.com" to "customer123"),
                    Triple("runner", "Runner", "rohan.runner@mpartner.com" to "runner123"),
                    Triple("admin", "Admin", "indiagod935@gmail.com" to "admin123")
                ).forEach { (roleKey, label, creds) ->
                    FilterChip(
                        selected = selectedRole == roleKey,
                        onClick = { selectedRole = roleKey; email = creds.first; password = creds.second },
                        label = { Text(label) },
                        modifier = Modifier.testTag("login_role_chip_$roleKey")
                    )
                }
            }
        }
        item { OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, singleLine = true, modifier = Modifier.fillMaxWidth().testTag("login_email_input")) }
        item { OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, modifier = Modifier.fillMaxWidth().testTag("login_password_input")) }
        item {
            Button(onClick = { onLogin(email, password, selectedRole) }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("login_submit_button")) {
                Text("Enter as ${selectedRole.replaceFirstChar { it.uppercase() }}")
            }
        }
        item {
            Surface(color = BrandSurface, shape = MaterialTheme.shapes.large, border = BorderStroke(1.dp, BrandBorder), modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Instant 1-Click Role Preview", fontWeight = FontWeight.Bold)
                    OutlinedButton(onClick = { onDemoSwitch("customer") }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) { Text("Customer View (Aarav Sharma)") }
                    OutlinedButton(onClick = { onDemoSwitch("runner") }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) { Text("Runner View (Rohan Verma)") }
                    OutlinedButton(onClick = { onDemoSwitch("admin") }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) { Text("Operations Admin View") }
                }
            }
        }
        item {
            TextButton(onClick = onNavigateRegister, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) {
                Text("New household or neighborhood Runner? Register Profile")
            }
        }
    }
}

@Composable
fun RegisterScreen(
    serviceAreas: List<ServiceArea>,
    onRegisterCustomer: (name: String, phone: String, email: String, password: String, address: String, building: String, locality: String, landmark: String, language: String, serviceAreaId: String) -> Unit,
    onRegisterRunner: (name: String, phone: String, email: String, password: String, address: String, serviceAreaId: String, languages: List<String>, vehicleType: String) -> Unit,
    onNavigateLogin: () -> Unit
) {
    var isRunner by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var building by remember { mutableStateOf("") }
    var locality by remember { mutableStateOf("Khuntavli") }
    var landmark by remember { mutableStateOf("") }
    var vehicleType by remember { mutableStateOf("Two Wheeler") }
    var selectedAreaId by remember(serviceAreas) { mutableStateOf(serviceAreas.firstOrNull()?.id ?: "area_1") }

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { SectionHeader("Create Household or Runner Profile", "Join M-PARTNER neighborhood operations") }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = !isRunner, onClick = { isRunner = false }, label = { Text("Customer Household") })
                FilterChip(selected = isRunner, onClick = { isRunner = true }, label = { Text("Neighborhood Runner") })
            }
        }
        item { OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Full Name *") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
        item { OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Mobile Phone *") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
        item { OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
        item { OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("PIN / Passcode *") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, modifier = Modifier.fillMaxWidth()) }
        item {
            Text("Service Zone", style = MaterialTheme.typography.labelLarge)
            Spacer(modifier = Modifier.height(6.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(serviceAreas) { area ->
                    FilterChip(selected = selectedAreaId == area.id, onClick = { selectedAreaId = area.id; locality = area.name }, label = { Text(area.name) })
                }
            }
        }
        item { OutlinedTextField(value = address, onValueChange = { address = it }, label = { Text("Street / Flat Address *") }, modifier = Modifier.fillMaxWidth()) }
        if (!isRunner) {
            item { OutlinedTextField(value = building, onValueChange = { building = it }, label = { Text("Building / Society") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
            item { OutlinedTextField(value = locality, onValueChange = { locality = it }, label = { Text("Locality *") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
            item { OutlinedTextField(value = landmark, onValueChange = { landmark = it }, label = { Text("Nearby Landmark") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
        } else {
            item { OutlinedTextField(value = vehicleType, onValueChange = { vehicleType = it }, label = { Text("Vehicle Type (e.g. Electric Scooter)") }, singleLine = true, modifier = Modifier.fillMaxWidth()) }
        }
        item {
            Button(
                onClick = {
                    if (isRunner) onRegisterRunner(name, phone, email, password, address, selectedAreaId, listOf("English", "Hindi", "Marathi"), vehicleType)
                    else onRegisterCustomer(name, phone, email, password, address, building, locality, landmark, "English", selectedAreaId)
                },
                modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp).testTag("register_submit_button")
            ) { Text(if (isRunner) "Apply as Neighborhood Runner" else "Complete Household Registration") }
        }
        item { TextButton(onClick = onNavigateLogin, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) { Text("Back to Portal Switcher") } }
    }
}
