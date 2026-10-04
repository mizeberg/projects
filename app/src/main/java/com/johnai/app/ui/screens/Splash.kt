package com.johnai.app.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.res.stringResource
import com.johnai.app.R
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.glass.GlassAIOrb
import com.johnai.app.ui.glass.OrbState
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Motion
import com.johnai.app.ui.theme.Space
import androidx.compose.ui.unit.dp

/**
 * Splash: obsidian, one ambient light, the glass mark settling.
 * It resolves the session while it plays, so it never adds startup delay.
 */
@Composable
fun SplashScreen() {
    val nav = LocalNavigator.current
    val repo = LocalRepository.current
    val colors = JohnTheme.colors
    var visible by remember { mutableStateOf(false) }

    val alpha by animateFloatAsState(
        if (visible) 1f else 0f,
        tween(if (JohnTheme.reducedMotion) 0 else Motion.SLOW_MS),
        label = "splash-alpha",
    )
    val scale by animateFloatAsState(
        if (visible) 1f else 0.94f,
        tween(if (JohnTheme.reducedMotion) 0 else Motion.SLOW_MS),
        label = "splash-scale",
    )

    LaunchedEffect(Unit) {
        visible = true
        val destination = if (!repo.isSignedIn) {
            Routes.AUTH
        } else {
            runCatching { repo.refreshSession() }
                .map { if (it.profile?.onboardingComplete == true) Routes.HOME else Routes.ONBOARDING }
                .getOrDefault(Routes.AUTH)
        }
        nav.navigate(destination) { popUpTo(Routes.SPLASH) { inclusive = true } }
    }

    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(Space.m),
            modifier = Modifier.alpha(alpha).scale(scale),
        ) {
            GlassAIOrb(state = OrbState.Idle, sizeDp = 112.dp)
            Text(
                stringResource(R.string.app_name).uppercase(),
                style = MaterialTheme.typography.titleLarge,
                color = colors.foreground,
            )
            Text(
                stringResource(R.string.brand_tagline).uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = colors.tertiary,
            )
        }
    }
}
