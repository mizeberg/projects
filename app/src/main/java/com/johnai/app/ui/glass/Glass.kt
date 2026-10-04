package com.johnai.app.ui.glass

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.dp
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Motion
import com.johnai.app.ui.theme.Radius
import com.johnai.app.ui.theme.Space
import com.johnai.app.ui.theme.Touch

/**
 * The John AI glass material.
 *
 * Conceptual stack, drawn bottom to top:
 *   environment tint -> translucent body -> internal light -> specular highlight
 *   -> moving reflection -> edge illumination -> content (always crisp).
 *
 * Content is NEVER blurred. Only the material beneath it is.
 */
@Composable
fun GlassSurface(
    modifier: Modifier = Modifier,
    level: GlassLevel = GlassLevel.Regular,
    shape: Shape = RoundedCornerShape(Radius.card),
    tint: Color? = null,
    selected: Boolean = false,
    content: @Composable BoxScope.() -> Unit,
) {
    val colors = JohnTheme.colors
    val reflection = LocalReflection.current
    val accent = tint ?: colors.accent

    Box(
        modifier = modifier
            .clip(shape)
            .drawWithCache {
                val body = colors.glassTint.copy(alpha = level.bodyAlpha)
                val innerLight = Brush.verticalGradient(
                    0f to colors.glassTint.copy(alpha = level.innerLightAlpha),
                    0.45f to Color.Transparent,
                    1f to accent.copy(alpha = level.innerLightAlpha * 0.5f),
                )
                onDrawBehind {
                    // 1. translucent body
                    drawRect(body)
                    // 2. internal light
                    drawRect(innerLight)

                    // 3. moving optical reflection — a broad, feathered, faintly
                    //    purple highlight. Never a hard white line.
                    val strength = reflection.intensity
                    if (strength > 0.001f) {
                        val centerY = size.height * reflection.travel
                        val radius = size.height * 0.9f + size.width * 0.25f
                        drawRect(
                            brush = Brush.radialGradient(
                                0f to colors.reflection.copy(alpha = strength),
                                0.35f to accent.copy(alpha = strength * 0.45f),
                                1f to Color.Transparent,
                                center = Offset(size.width * 0.32f, centerY),
                                radius = radius,
                            )
                        )
                    }
                    reflection.settle()

                    // 4. edge: brighter at the top, so the surface reads as having thickness
                    val edgeAlpha = if (selected) level.edgeAlpha * 1.6f else level.edgeAlpha
                    drawRect(
                        brush = Brush.verticalGradient(
                            0f to colors.edgeTop.copy(alpha = edgeAlpha),
                            0.012f to Color.Transparent,
                        )
                    )
                }
            }
            .border(
                BorderStroke(
                    width = 1.dp,
                    brush = Brush.verticalGradient(
                        0f to colors.edge.copy(alpha = level.edgeAlpha * (if (selected) 1.8f else 1f)),
                        0.5f to colors.edge.copy(alpha = level.edgeAlpha * 0.35f),
                        1f to accent.copy(alpha = level.edgeAlpha * 0.5f),
                    ),
                ),
                shape = shape,
            ),
        content = content,
    )
}

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    level: GlassLevel = GlassLevel.Thin,
    onClick: (() -> Unit)? = null,
    selected: Boolean = false,
    contentPadding: androidx.compose.foundation.layout.PaddingValues =
        androidx.compose.foundation.layout.PaddingValues(Space.m),
    content: @Composable BoxScope.() -> Unit,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val reduced = JohnTheme.reducedMotion
    val scale by animateFloatAsState(
        targetValue = if (pressed && !reduced) Motion.PRESS_SCALE else 1f,
        animationSpec = tween(Motion.FAST_MS),
        label = "glass-press",
    )
    val reflection = LocalReflection.current
    if (pressed) reflection.pulse()

    GlassSurface(
        modifier = modifier
            .scale(scale)
            .then(
                if (onClick != null) Modifier.clickableNoRipple(interaction, onClick) else Modifier
            ),
        level = level,
        selected = selected,
    ) {
        Box(Modifier.padding(contentPadding), content = content)
    }
}

private fun Modifier.clickableNoRipple(
    interaction: MutableInteractionSource,
    onClick: () -> Unit,
): Modifier = this.clickable(
    interactionSource = interaction,
    indication = null,
    onClick = onClick,
)

/** Primary action surface. Minimum 48dp tall — comfortable, not just compliant. */
@Composable
fun GlassButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    emphasised: Boolean = false,
) {
    val colors = JohnTheme.colors
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed && !JohnTheme.reducedMotion) Motion.PRESS_SCALE else 1f,
        animationSpec = tween(Motion.FAST_MS),
        label = "button-press",
    )
    GlassSurface(
        modifier = modifier
            .scale(scale)
            .defaultMinSize(minHeight = Touch.preferred)
            .clip(RoundedCornerShape(Radius.small))
            .clickable(
                enabled = enabled,
                interactionSource = interaction,
                indication = null,
                onClick = onClick,
            ),
        level = if (emphasised) GlassLevel.Prominent else GlassLevel.Regular,
        shape = RoundedCornerShape(Radius.small),
        selected = emphasised,
    ) {
        Box(Modifier.padding(horizontal = Space.ml, vertical = Space.s)) {
            androidx.compose.material3.Text(
                text = text,
                style = androidx.compose.material3.MaterialTheme.typography.labelLarge,
                color = if (enabled) colors.foreground else colors.tertiary,
            )
        }
    }
}

/** Ambient background: obsidian ground with a single soft purple light source. */
@Composable
fun AmbientBackground(modifier: Modifier = Modifier, content: @Composable BoxScope.() -> Unit) {
    val colors = JohnTheme.colors
    Box(
        modifier
            .background(colors.background)
            .drawWithCache {
                val glow = Brush.radialGradient(
                    0f to colors.ambient,
                    1f to Color.Transparent,
                    center = Offset(size.width * 0.15f, size.height * 0.08f),
                    radius = size.width * 1.1f,
                )
                onDrawBehind { drawRect(glow) }
            },
        content = content,
    )
}
