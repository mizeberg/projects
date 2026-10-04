package com.johnai.app.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color

/** John AI purple — the single accent. Used sparingly, mostly as light rather than fill. */
val JohnPurple = Color(0xFF8B5CF6)
val JohnPurpleSoft = Color(0xFFA78BFA)
val JohnPurpleDeep = Color(0xFF6D3BE4)

@Immutable
data class JohnColors(
    val background: Color,
    val backgroundElevated: Color,
    val ambient: Color,
    val foreground: Color,
    val secondary: Color,
    val tertiary: Color,
    val accent: Color,
    val accentSoft: Color,
    val positive: Color,
    val warning: Color,
    val error: Color,
    val glassTint: Color,
    val edgeTop: Color,
    val edge: Color,
    val reflection: Color,
    val isDark: Boolean,
)

/** Dark editorial: obsidian ground, off-white type, controlled signal colours. */
val DarkJohnColors = JohnColors(
    background = Color(0xFF07070B),
    backgroundElevated = Color(0xFF0E0E14),
    ambient = JohnPurple.copy(alpha = 0.16f),
    foreground = Color(0xFFF2F2F5),
    secondary = Color(0xFFA2A2AE),
    tertiary = Color(0xFF6C6C7A),
    accent = JohnPurple,
    accentSoft = JohnPurpleSoft,
    positive = Color(0xFF4ADE80),
    warning = Color(0xFFFBBF24),
    error = Color(0xFFF87171),
    glassTint = Color(0xFFFFFFFF),
    edgeTop = Color(0xFFFFFFFF),
    edge = Color(0xFFFFFFFF),
    reflection = Color(0xFFFFFFFF),
    isDark = true,
)

/** Light mode is designed independently — soft neutral ground, translucent white glass. */
val LightJohnColors = JohnColors(
    background = Color(0xFFF4F4F7),
    backgroundElevated = Color(0xFFFFFFFF),
    ambient = JohnPurple.copy(alpha = 0.10f),
    foreground = Color(0xFF14141A),
    secondary = Color(0xFF5A5A68),
    tertiary = Color(0xFF8E8E9C),
    accent = JohnPurpleDeep,
    accentSoft = JohnPurple,
    positive = Color(0xFF15803D),
    warning = Color(0xFFB45309),
    error = Color(0xFFB91C1C),
    glassTint = Color(0xFFFFFFFF),
    edgeTop = Color(0xFFFFFFFF),
    edge = Color(0xFF14141A),
    reflection = Color(0xFFFFFFFF),
    isDark = false,
)
