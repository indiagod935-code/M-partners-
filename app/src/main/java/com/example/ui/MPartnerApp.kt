package com.example.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.credentials.CredentialManager
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.R
import com.example.firebase.FirestoreDeliveryRepository
import com.example.firebase.attemptAutoSignIn
import com.example.firebase.authStateFlow
import com.example.firebase.signOutWithCleanup
import com.example.model.OrderItem
import com.example.ui.components.AiShoppingAssistantDialog
import com.example.ui.components.MPartnerTopBar
import com.example.ui.screens.admin.AdminDashboardScreen
import com.example.ui.screens.customer.CustomerDashboardScreen
import com.example.ui.screens.public.*
import com.example.ui.screens.runner.RunnerDashboardScreen
import com.example.ui.theme.BrandPureWhite
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.auth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.serialization.Serializable

sealed interface AppRoute {
    @Serializable data object Home : AppRoute
    @Serializable data object Plans : AppRoute
    @Serializable data object HowItWorks : AppRoute
    @Serializable data object Portal : AppRoute
    @Serializable data object Login : AppRoute
    @Serializable data object Register : AppRoute
    @Serializable data object Faq : AppRoute
    @Serializable data object About : AppRoute
    @Serializable data object Contact : AppRoute
    @Serializable data object Legal : AppRoute
    @Serializable data object Tests : AppRoute
}

@Composable
fun MPartnerApp(viewModel: MainViewModel) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val credentialManager = remember(context) { CredentialManager.create(context) }

    val firebaseUser by remember { Firebase.auth.authStateFlow() }
        .collectAsStateWithLifecycle(initialValue = Firebase.auth.currentUser)
    var isAutoSigningIn by remember { mutableStateOf(Firebase.auth.currentUser == null) }

    LaunchedEffect(Unit) {
        if (Firebase.auth.currentUser == null) {
            attemptAutoSignIn(
                context = context,
                credentialManager = credentialManager,
                onAuthSuccess = { isAutoSigningIn = false },
                onUnauthenticated = { isAutoSigningIn = false },
                scope = scope
            )
        } else {
            isAutoSigningIn = false
        }
    }

    val activeFirebaseUser = firebaseUser
    if (activeFirebaseUser == null) {
        AuthScreen(
            isAutoSigningIn = isAutoSigningIn,
            onAuthSuccess = { isAutoSigningIn = false }
        )
    } else {
        val uid = activeFirebaseUser.uid
        key(uid) {
            AuthenticatedMPartnerContent(
                firebaseUser = activeFirebaseUser,
                viewModel = viewModel,
                onSignOut = {
                    signOutWithCleanup(credentialManager, scope) {
                        viewModel.logout {}
                    }
                }
            )
        }
    }
}

@Composable
private fun AuthenticatedMPartnerContent(
    firebaseUser: FirebaseUser,
    viewModel: MainViewModel,
    onSignOut: () -> Unit
) {
    val uid = firebaseUser.uid
    val displayName = firebaseUser.displayName ?: firebaseUser.email?.substringBefore("@") ?: "Customer"
    val email = firebaseUser.email ?: ""

    val firestoreViewModel: FirestoreDeliveryViewModel = viewModel(
        key = uid,
        factory = viewModelFactory {
            initializer {
                val app = checkNotNull(this[APPLICATION_KEY]) {
                    "APPLICATION_KEY missing from CreationExtras"
                }
                val databaseId = app.getString(R.string.firestore_database_id)
                val firestoreDb = FirebaseFirestore.getInstance(databaseId)
                FirestoreDeliveryViewModel(
                    repository = FirestoreDeliveryRepository(firestoreDb),
                    currentUserId = uid,
                    displayName = displayName,
                    email = email
                )
            }
        }
    )

    val navController = rememberNavController()
    val snackbarHostState = remember { SnackbarHostState() }

    val db by viewModel.database.collectAsStateWithLifecycle()
    val currentUser by viewModel.currentUser.collectAsStateWithLifecycle()
    val smartListState by viewModel.smartListState.collectAsStateWithLifecycle()
    val conciergeState by viewModel.conciergeState.collectAsStateWithLifecycle()
    val conciergeHistory by viewModel.conciergeHistory.collectAsStateWithLifecycle()
    val testReport by viewModel.testReport.collectAsStateWithLifecycle()

    val firestoreRequestsState by firestoreViewModel.requestsState.collectAsStateWithLifecycle()
    val isSubmittingFirestore by firestoreViewModel.isSubmitting.collectAsStateWithLifecycle()

    var aiDialogOpen by remember { mutableStateOf(false) }
    var aiApplyCallback by remember { mutableStateOf<((List<OrderItem>, String) -> Unit)?>(null) }

    LaunchedEffect(Unit) {
        viewModel.snackbarMessage.collect { msg ->
            snackbarHostState.showSnackbar(msg, duration = SnackbarDuration.Short)
        }
    }

    LaunchedEffect(uid) {
        firestoreViewModel.statusEvent.collect { msg ->
            snackbarHostState.showSnackbar(msg, duration = SnackbarDuration.Short)
        }
    }

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    val navigateSingleTop: (AppRoute) -> Unit = { route ->
        navController.navigate(route) {
            launchSingleTop = true
        }
    }

    val openAiAssistant: (((List<OrderItem>, String) -> Unit)?) -> Unit = { applyCb ->
        aiApplyCallback = applyCb
        aiDialogOpen = true
    }

    val topLevelNavItems = listOf(
        Triple(AppRoute.Home, "Request", Icons.Default.Home),
        Triple(AppRoute.Plans, "Plans", Icons.Default.ConfirmationNumber),
        Triple(AppRoute.HowItWorks, "Guide", Icons.Default.Timeline),
        Triple(AppRoute.Portal, "Portal", Icons.Default.Dashboard)
    )

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val useRail = maxWidth >= 700.dp

        Scaffold(
            containerColor = BrandPureWhite,
            snackbarHost = { SnackbarHost(snackbarHostState) },
            topBar = {
                MPartnerTopBar(
                    currentUser = currentUser,
                    signedInEmail = email.ifBlank { displayName },
                    onBrandClick = { navigateSingleTop(AppRoute.Home) },
                    onSwitchDemoRole = { role ->
                        viewModel.switchDemo(role) {
                            navigateSingleTop(AppRoute.Portal)
                        }
                    },
                    onOpenAiSuite = { openAiAssistant(null) },
                    onLoginClick = { navigateSingleTop(AppRoute.Login) },
                    onLogoutClick = onSignOut
                )
            },
            bottomBar = {
                if (!useRail) {
                    NavigationBar(containerColor = BrandPureWhite) {
                        topLevelNavItems.forEach { (route, label, icon) ->
                            val selected = currentDestination?.hasRoute(route::class) == true
                            NavigationBarItem(
                                selected = selected,
                                onClick = { navigateSingleTop(route) },
                                icon = { Icon(icon, contentDescription = label) },
                                label = { Text(label) },
                                modifier = Modifier.testTag("bottom_nav_${label.lowercase().replace(" ", "_")}")
                            )
                        }
                    }
                }
            }
        ) { innerPadding ->
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                if (useRail) {
                    NavigationRail(containerColor = BrandPureWhite) {
                        Spacer(modifier = Modifier.height(12.dp))
                        topLevelNavItems.forEach { (route, label, icon) ->
                            val selected = currentDestination?.hasRoute(route::class) == true
                            NavigationRailItem(
                                selected = selected,
                                onClick = { navigateSingleTop(route) },
                                icon = { Icon(icon, contentDescription = label) },
                                label = { Text(label) }
                            )
                        }
                    }
                    VerticalDivider()
                }

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .widthIn(max = 880.dp)
                        .align(Alignment.Top)
                ) {
                    NavHost(
                        navController = navController,
                        startDestination = AppRoute.Home
                    ) {
                        composable<AppRoute.Home> {
                            HomeScreen(
                                currentUser = currentUser,
                                serviceAreas = db.serviceAreas.filter { it.isActive },
                                plans = db.subscriptionPlans.filter { it.isActive },
                                firestoreRequestsState = firestoreRequestsState,
                                isSubmittingFirestore = isSubmittingFirestore,
                                onSubmitFirestoreRequest = { itemsText, address, prefTime, notes, onClear ->
                                    firestoreViewModel.submitRequest(itemsText, address, prefTime, notes, onSuccess = onClear)
                                },
                                onEditFirestoreRequest = { req, itemsText, address, notes ->
                                    firestoreViewModel.updateRequest(req.id, itemsText, address, notes)
                                },
                                onCancelFirestoreRequest = { reqId ->
                                    firestoreViewModel.cancelRequest(reqId)
                                },
                                onDeleteFirestoreRequest = { reqId ->
                                    firestoreViewModel.deleteRequest(reqId)
                                },
                                onGoPortal = { navigateSingleTop(AppRoute.Portal) },
                                onNavigateRoute = { key ->
                                    when (key) {
                                        "login" -> navigateSingleTop(AppRoute.Login)
                                        "plans" -> navigateSingleTop(AppRoute.Plans)
                                        "how_it_works" -> navigateSingleTop(AppRoute.HowItWorks)
                                        "faq" -> navigateSingleTop(AppRoute.Faq)
                                        "about" -> navigateSingleTop(AppRoute.About)
                                        "contact" -> navigateSingleTop(AppRoute.Contact)
                                        "legal" -> navigateSingleTop(AppRoute.Legal)
                                        "tests" -> {
                                            viewModel.runBusinessRuleTests()
                                            navigateSingleTop(AppRoute.Tests)
                                        }
                                    }
                                },
                                onOpenAiSuite = openAiAssistant
                            )
                        }

                        composable<AppRoute.Plans> {
                            PlansScreen(
                                plans = db.subscriptionPlans.filter { it.isActive },
                                settings = db.settings,
                                onSubscribeClick = { navigateSingleTop(AppRoute.Portal) }
                            )
                        }

                        composable<AppRoute.HowItWorks> {
                            HowItWorksScreen(
                                onStartOrder = { navigateSingleTop(AppRoute.Portal) }
                            )
                        }

                        composable<AppRoute.Faq> { FaqScreen() }
                        composable<AppRoute.About> { AboutScreen(db.settings) }
                        composable<AppRoute.Contact> {
                            ContactScreen(
                                settings = db.settings,
                                onSubmitContact = { name, em, phone, subj, msg, onDone ->
                                    viewModel.submitSupportTicket("general", subj, msg, name, em, phone, onDone)
                                }
                            )
                        }
                        composable<AppRoute.Legal> { LegalScreen() }
                        composable<AppRoute.Tests> {
                            TestsScreen(
                                report = testReport,
                                onRunTests = { viewModel.runBusinessRuleTests() }
                            )
                        }

                        composable<AppRoute.Login> {
                            LoginScreen(
                                onLogin = { em, pwd, role ->
                                    viewModel.login(em, pwd, role) {
                                        navigateSingleTop(AppRoute.Portal)
                                    }
                                },
                                onDemoSwitch = { role ->
                                    viewModel.switchDemo(role) {
                                        navigateSingleTop(AppRoute.Portal)
                                    }
                                },
                                onNavigateRegister = { navigateSingleTop(AppRoute.Register) }
                            )
                        }

                        composable<AppRoute.Register> {
                            RegisterScreen(
                                serviceAreas = db.serviceAreas.filter { it.isActive },
                                onRegisterCustomer = { name, phone, em, pwd, addr, bldg, loc, land, lang, areaId ->
                                    viewModel.registerCustomer(name, phone, em, pwd, addr, bldg, loc, land, lang, areaId) {
                                        navigateSingleTop(AppRoute.Portal)
                                    }
                                },
                                onRegisterRunner = { name, phone, em, pwd, addr, areaId, langs, vehicle ->
                                    viewModel.registerRunner(name, phone, em, pwd, addr, areaId, langs, vehicle) {
                                        navigateSingleTop(AppRoute.Portal)
                                    }
                                },
                                onNavigateLogin = { navigateSingleTop(AppRoute.Login) }
                            )
                        }

                        composable<AppRoute.Portal> {
                            val activeUser = currentUser
                            if (activeUser == null) {
                                LoginScreen(
                                    onLogin = { em, pwd, role ->
                                        viewModel.login(em, pwd, role) {
                                            navigateSingleTop(AppRoute.Portal)
                                        }
                                    },
                                    onDemoSwitch = { role ->
                                        viewModel.switchDemo(role) {
                                            navigateSingleTop(AppRoute.Portal)
                                        }
                                    },
                                    onNavigateRegister = { navigateSingleTop(AppRoute.Register) }
                                )
                            } else {
                                when (activeUser.role) {
                                    "admin" -> AdminDashboardScreen(user = activeUser, db = db, viewModel = viewModel)
                                    "runner" -> RunnerDashboardScreen(user = activeUser, db = db, viewModel = viewModel)
                                    else -> CustomerDashboardScreen(
                                        user = activeUser,
                                        db = db,
                                        viewModel = viewModel,
                                        firestoreRequestsState = firestoreRequestsState,
                                        isSubmittingFirestore = isSubmittingFirestore,
                                        onSubmitFirestoreRequest = { itemsText, address, prefTime, notes, onClear ->
                                            firestoreViewModel.submitRequest(itemsText, address, prefTime, notes, onSuccess = onClear)
                                        },
                                        onEditFirestoreRequest = { req, itemsText, address, notes ->
                                            firestoreViewModel.updateRequest(req.id, itemsText, address, notes)
                                        },
                                        onCancelFirestoreRequest = { reqId ->
                                            firestoreViewModel.cancelRequest(reqId)
                                        },
                                        onDeleteFirestoreRequest = { reqId ->
                                            firestoreViewModel.deleteRequest(reqId)
                                        },
                                        onOpenAiForOrder = { applyCb -> openAiAssistant(applyCb) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    AiShoppingAssistantDialog(
        isOpen = aiDialogOpen,
        smartListState = smartListState,
        conciergeState = conciergeState,
        conciergeHistory = conciergeHistory,
        onGenerateSmartList = { viewModel.generateSmartList(it) },
        onAskConcierge = { viewModel.askAiConcierge(it) },
        onApplyItems = aiApplyCallback,
        onDismiss = { aiDialogOpen = false }
    )
}
