package com.johnai.app.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Centralized design tokens.
 * No magic numbers anywhere else in the UI layer — spacing, radii, blur,
 * glass opacity, reflection intensity and motion all resolve from here.
 */
object Space {
    val xxs: Dp = 4.dp
    val xs: Dp = 8.dp
    val s: Dp = 12.dp
    val m: Dp = 16.dp
    val ml: Dp = 20.dp
    val l: Dp = 24.dp
    val xl: Dp = 32.dp
    val xxl: Dp = 40.dp
    val xxxl: Dp = 48.dp
    val huge: Dp = 64.dp
}

object Radius {
    val chip: Dp = 999.dp
    val small: Dp = 12.dp
    val card: Dp = 20.dp
    val sheet: Dp = 28.dp
    val hero: Dp = 32.dp
}

object Touch {
    /** Android accessibility minimum; John AI prefers the larger comfortable target. */
    val minimum: Dp = 44.dp
    val preferred: Dp = 48.dp
}

object Motion {
    const val FAST_MS = 150
    const val NORMAL_MS = 250
    const val SLOW_MS = 400
    const val PRESS_SCALE = 0.975f
}

/**
 * Glass levels. Deliberately NOT uniform — hierarchy comes from how much
 * material a surface has, so only AI and hero surfaces read as prominent.
 */
@Immutable
enum class GlassLevel(
    val bodyAlpha: Float,
    val blurRadius: Dp,
    val edgeAlpha: Float,
    val innerLightAlpha: Float,
) {
    UltraThin(bodyAlpha = 0.04f, blurRadius = 12.dp, edgeAlpha = 0.06f, innerLightAlpha = 0.03f),
    Thin(bodyAlpha = 0.07f, blurRadius = 18.dp, edgeAlpha = 0.09f, innerLightAlpha = 0.05f),
    Regular(bodyAlpha = 0.10f, blurRadius = 24.dp, edgeAlpha = 0.13f, innerLightAlpha = 0.07f),
    Thick(bodyAlpha = 0.14f, blurRadius = 30.dp, edgeAlpha = 0.17f, innerLightAlpha = 0.09f),
    Prominent(bodyAlpha = 0.18f, blurRadius = 36.dp, edgeAlpha = 0.22f, innerLightAlpha = 0.12f),
}

/** Reflection budget, as a fraction of surface luminance. Event-driven, never looping. */
object Reflection {
    const val IDLE = 0.03f
    const val NORMAL_MAX = 0.12f
    const val FAST_MAX = 0.17f
    /** Scroll speed (px/frame) that maps to FAST_MAX. */
    const val VELOCITY_FOR_MAX = 90f
    const val DECAY_PER_FRAME = 0.88f
}

object TypeScale {
    val display = 44.sp
    val metric = 34.sp
    val title = 22.sp
    val section = 17.sp
    val body = 15.sp
    val label = 13.sp
    val meta = 11.sp
}
