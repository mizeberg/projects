package com.johnai.app.ui.theme

import android.view.accessibility.AccessibilityManager
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp

val LocalJohnColors: ProvidableCompositionLocal<JohnColors> = staticCompositionLocalOf { DarkJohnColors }
val LocalReducedMotion: ProvidableCompositionLocal<Boolean> = staticCompositionLocalOf { false }

object JohnTheme {
    val colors: JohnColors
        @Composable get() = LocalJohnColors.current
    val reducedMotion: Boolean
        @Composable get() = LocalReducedMotion.current
}

/**
 * Typography: one modern sans family, few weights, strong numeric metrics.
 * Hierarchy is carried by size and colour, never decoration.
 */
private val johnTypography = Typography(
    displayLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = TypeScale.display, letterSpacing = (-1).sp),
    headlineLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = TypeScale.metric, letterSpacing = (-0.5).sp),
    titleLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Medium, fontSize = TypeScale.title),
    titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Medium, fontSize = TypeScale.section),
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = TypeScale.body, lineHeight = 22.sp),
    labelLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Medium, fontSize = TypeScale.label, letterSpacing = 0.4.sp),
    labelSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Medium, fontSize = TypeScale.meta, letterSpacing = 1.sp, textAlign = TextAlign.Start),
)

@Composable
fun JohnAiTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkJohnColors else LightJohnColors
    val context = LocalContext.current
    val reducedMotion = remember(context) {
        runCatching {
            val am = context.getSystemService(AccessibilityManager::class.java)
            // Respect both "remove animations" and screen-reader usage.
            am?.isTouchExplorationEnabled == true ||
                android.provider.Settings.Global.getFloat(
                    context.contentResolver,
                    android.provider.Settings.Global.ANIMATOR_DURATION_SCALE,
                    1f,
                ) == 0f
        }.getOrDefault(false)
    }

    val scheme = if (darkTheme) {
        darkColorScheme(
            primary = colors.accent,
            background = colors.background,
            surface = colors.backgroundElevated,
            onPrimary = Color_White,
            onBackground = colors.foreground,
            onSurface = colors.foreground,
            error = colors.error,
        )
    } else {
        lightColorScheme(
            primary = colors.accent,
            background = colors.background,
            surface = colors.backgroundElevated,
            onPrimary = Color_White,
            onBackground = colors.foreground,
            onSurface = colors.foreground,
            error = colors.error,
        )
    }

    CompositionLocalProvider(
        LocalJohnColors provides colors,
        LocalReducedMotion provides reducedMotion,
    ) {
        MaterialTheme(colorScheme = scheme, typography = johnTypography, content = content)
    }
}

private val Color_White = androidx.compose.ui.graphics.Color.White
