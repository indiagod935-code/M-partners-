package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.firebase.configureAppCheck
import com.example.ui.MPartnerApp
import com.example.ui.MainViewModel
import com.example.ui.theme.MPartnerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Configure Firebase App Check before any ViewModels, UI, or Firebase operations
        configureAppCheck(this, intent)

        enableEdgeToEdge()
        setContent {
            MPartnerTheme {
                val mainViewModel: MainViewModel = viewModel()
                MPartnerApp(viewModel = mainViewModel)
            }
        }
    }
}
