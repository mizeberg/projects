package com.johnai.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import com.johnai.app.data.JohnApiException
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.components.ErrorState
import com.johnai.app.ui.glass.GlassButton
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import kotlinx.coroutines.launch

@Composable
fun AuthScreen() {
    val repo = LocalRepository.current
    val nav = LocalNavigator.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors

    var creating by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    fun submit() {
        if (busy) return
        busy = true
        error = null
        scope.launch {
            try {
                val session = if (creating) {
                    repo.register(email.trim(), password, name.trim())
                } else {
                    repo.signIn(email.trim(), password)
                }
                val next = if (session.profile?.onboardingComplete == true) Routes.HOME else Routes.ONBOARDING
                nav.navigate(next) { popUpTo(Routes.AUTH) { inclusive = true } }
            } catch (e: JohnApiException) {
                error = e.message
            } catch (e: Exception) {
                error = "John could not sign you in right now."
            } finally {
                busy = false
            }
        }
    }

    Box(
        Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(Space.m)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(Space.m)) {
            Text("JOHN AI", style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
            Text(
                if (creating) "Create your\nministry workspace" else "Welcome back",
                style = MaterialTheme.typography.displayLarge,
                color = colors.foreground,
            )

            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Regular) {
                Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
                    if (creating) {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("What should we call you?") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                        modifier = Modifier.fillMaxWidth(),
                    )
                    GlassButton(
                        text = if (busy) "Please wait…" else if (creating) "Create account" else "Sign in",
                        onClick = ::submit,
                        enabled = !busy && email.isNotBlank() && password.isNotBlank(),
                        emphasised = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    TextButton(onClick = { creating = !creating; error = null }) {
                        Text(
                            if (creating) "I already have an account" else "Create a new account",
                            color = colors.accentSoft,
                        )
                    }
                }
            }

            error?.let { ErrorState(it, onRetry = ::submit) }

            Text(
                "Your sermons, notes and pastoral records are private to your account.",
                style = MaterialTheme.typography.bodyLarge,
                color = colors.tertiary,
            )
        }
    }
}
