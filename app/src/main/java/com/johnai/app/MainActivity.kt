package com.johnai.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import com.johnai.app.navigation.JohnApp
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.ui.theme.JohnAiTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Edge to edge, with every surface respecting safe areas explicitly.
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        val repository = (application as JohnAiApplication).repository
        setContent {
            JohnAiTheme {
                CompositionLocalProvider(LocalRepository provides repository) {
                    JohnApp()
                }
            }
        }
    }
}
