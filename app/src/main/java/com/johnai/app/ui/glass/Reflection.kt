package com.johnai.app.ui.glass

import androidx.compose.foundation.gestures.FlingBehavior
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.unit.Velocity
import com.johnai.app.ui.theme.Reflection
import kotlin.math.abs

/**
 * Scroll reflection state.
 *
 * The reflection is EVENT-DRIVEN, never a loop:
 *   scroll starts -> reflection activates -> travels across the surface ->
 *   velocity raises intensity -> scroll slows -> it decelerates -> stops -> fades.
 *
 * It also exposes [simplifyEffects] so expensive blur can be dropped during fast
 * scrolling and restored once motion settles, without a visible quality jump.
 */
@Stable
class ReflectionState(private val enabled: Boolean) {

    /** 0f..1f position of the highlight along the scroll axis. */
    var travel by mutableFloatStateOf(0.5f)
        private set

    /** Current reflection strength, within the documented 2%–18% budget. */
    var intensity by mutableFloatStateOf(Reflection.IDLE)
        private set

    var velocity by mutableFloatStateOf(0f)
        private set

    /** True while the surface is moving fast enough that blur should be cheapened. */
    val simplifyEffects: Boolean
        get() = enabled && abs(velocity) > Reflection.VELOCITY_FOR_MAX * 0.75f

    fun onScroll(deltaPx: Float) {
        if (!enabled) return
        velocity = deltaPx
        val normalized = (abs(deltaPx) / Reflection.VELOCITY_FOR_MAX).coerceIn(0f, 1f)
        val target = if (normalized < 0.2f) {
            Reflection.IDLE + (Reflection.NORMAL_MAX - Reflection.IDLE) * (normalized / 0.2f)
        } else {
            Reflection.NORMAL_MAX + (Reflection.FAST_MAX - Reflection.NORMAL_MAX) * normalized
        }
        // Spring-like approach rather than a hard jump.
        intensity += (target - intensity) * 0.35f
        travel = (travel - deltaPx / 1400f).let { t ->
            when {
                t < 0f -> t + 1f
                t > 1f -> t - 1f
                else -> t
            }
        }
    }

    /** Called every frame a surface draws: decays the highlight back to idle. */
    fun settle() {
        if (!enabled) return
        velocity *= Reflection.DECAY_PER_FRAME
        if (abs(velocity) < 0.5f) velocity = 0f
        if (velocity == 0f && intensity > Reflection.IDLE) {
            intensity = (intensity * Reflection.DECAY_PER_FRAME)
                .coerceAtLeast(Reflection.IDLE)
        }
    }

    /** Press and sheet movement trigger the same optics as scrolling. */
    fun pulse(strength: Float = Reflection.NORMAL_MAX) {
        if (!enabled) return
        intensity = strength.coerceAtMost(Reflection.FAST_MAX)
    }

    fun nestedScrollConnection(): NestedScrollConnection = object : NestedScrollConnection {
        override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
            onScroll(available.y)
            return Offset.Zero
        }

        override suspend fun onPreFling(available: Velocity): Velocity {
            onScroll(available.y / 60f)
            return Velocity.Zero
        }
    }
}

val LocalReflection: ProvidableCompositionLocal<ReflectionState> =
    staticCompositionLocalOf { ReflectionState(enabled = false) }

/**
 * Provides a reflection surface environment to everything inside.
 * Disabled automatically when the pastor has reduced motion turned on.
 */
@Composable
fun ProvideReflection(
    enabled: Boolean = true,
    content: @Composable (ReflectionState) -> Unit,
) {
    val state = remember(enabled) { ReflectionState(enabled) }
    CompositionLocalProvider(LocalReflection provides state) { content(state) }
}

@Suppress("unused")
private val unusedFlingMarker: FlingBehavior? = null
