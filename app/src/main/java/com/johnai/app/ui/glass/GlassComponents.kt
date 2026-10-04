package com.johnai.app.ui.glass

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Motion
import com.johnai.app.ui.theme.Radius
import com.johnai.app.ui.theme.Space

/**
 * Glowing progress bar: glass track, luminous purple fill, inner highlight,
 * subtle outer glow. Animates 0 -> value once on appearance. It never pulses.
 *
 * [value] must always come from a real, counted measure.
 */
@Composable
fun GlassProgressBar(
    value: Float,
    modifier: Modifier = Modifier,
    label: String? = null,
) {
    val colors = JohnTheme.colors
    val target = value.coerceIn(0f, 1f)
    var start by remember { mutableFloatStateOf(0f) }
    LaunchedEffect(target) { start = target }
    val animated by animateFloatAsState(
        targetValue = start,
        animationSpec = tween(if (JohnTheme.reducedMotion) 0 else Motion.SLOW_MS),
        label = "progress",
    )

    Canvas(
        modifier
            .fillMaxWidth()
            .height(10.dp)
            .semantics {
                contentDescription = label ?: "${(target * 100).toInt()} percent complete"
            }
    ) {
        val r = size.height / 2f
        // track
        drawRoundRect(
            color = colors.glassTint.copy(alpha = 0.08f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(r, r),
        )
        val w = size.width * animated
        if (w > 0f) {
            // outer glow
            drawRoundRect(
                brush = Brush.horizontalGradient(
                    listOf(colors.accent.copy(alpha = 0.12f), colors.accentSoft.copy(alpha = 0.22f))
                ),
                topLeft = Offset(-2f, -3f),
                size = Size(w + 4f, size.height + 6f),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(r + 3f, r + 3f),
            )
            // luminous fill
            drawRoundRect(
                brush = Brush.horizontalGradient(listOf(colors.accent, colors.accentSoft)),
                size = Size(w, size.height),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(r, r),
            )
            // inner highlight
            drawRoundRect(
                color = Color.White.copy(alpha = 0.25f),
                topLeft = Offset(0f, 1f),
                size = Size(w, size.height * 0.4f),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(r, r),
            )
        }
    }
}

enum class OrbState { Idle, Listening, Thinking, Responding, Error }

/**
 * The John AI orb. A state-driven component, not decoration:
 * it is almost still at rest and only becomes expressive while John is working.
 */
@Composable
fun GlassAIOrb(
    state: OrbState,
    modifier: Modifier = Modifier,
    sizeDp: androidx.compose.ui.unit.Dp = 96.dp,
    amplitude: Float = 0f,
) {
    val colors = JohnTheme.colors
    val reduced = JohnTheme.reducedMotion
    val animating = !reduced && state != OrbState.Idle

    val transition = rememberInfiniteTransition(label = "orb")
    val phase by transition.animateFloat(
        initialValue = 0f,
        targetValue = if (animating) 1f else 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (state == OrbState.Thinking) 2600 else 1800),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "orb-phase",
    )

    val base = when (state) {
        OrbState.Idle -> 0.14f
        OrbState.Listening -> 0.26f + amplitude.coerceIn(0f, 1f) * 0.2f
        OrbState.Thinking -> 0.24f
        OrbState.Responding -> 0.30f
        OrbState.Error -> 0.22f
    }
    val tint = if (state == OrbState.Error) colors.error else colors.accent

    Canvas(
        modifier
            .size(sizeDp)
            .semantics {
                contentDescription = when (state) {
                    OrbState.Idle -> "John is ready"
                    OrbState.Listening -> "John is listening"
                    OrbState.Thinking -> "John is thinking"
                    OrbState.Responding -> "John is responding"
                    OrbState.Error -> "John could not complete that"
                }
            }
    ) {
        val r = size.minDimension / 2f
        val c = Offset(size.width / 2f, size.height / 2f)
        drawCircle(
            brush = Brush.radialGradient(
                0f to tint.copy(alpha = base * 0.9f),
                0.65f to tint.copy(alpha = base * 0.35f),
                1f to Color.Transparent,
                center = c,
                radius = r,
            ),
            radius = r,
            center = c,
        )
        // internal light movement
        val drift = if (animating) (phase - 0.5f) * r * 0.35f else 0f
        drawCircle(
            brush = Brush.radialGradient(
                0f to Color.White.copy(alpha = base * 0.5f),
                1f to Color.Transparent,
                center = Offset(c.x - r * 0.25f + drift, c.y - r * 0.25f),
                radius = r * 0.7f,
            ),
            radius = r * 0.7f,
            center = Offset(c.x - r * 0.25f + drift, c.y - r * 0.25f),
        )
        // glass rim
        drawCircle(
            color = Color.White.copy(alpha = 0.16f),
            radius = r * 0.92f,
            center = c,
            style = Stroke(width = 1.5f),
        )
    }
}

/** Large editorial header: big metric, small supporting label (Tubik-style hierarchy). */
@Composable
fun MetricHeader(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    support: String? = null,
) {
    val colors = JohnTheme.colors
    Column(modifier) {
        Text(
            text = label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = colors.tertiary,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.headlineLarge,
            color = colors.foreground,
        )
        if (support != null) {
            Text(text = support, style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
        }
    }
}

@Composable
fun SectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text.uppercase(),
        style = MaterialTheme.typography.labelSmall,
        color = JohnTheme.colors.tertiary,
        modifier = modifier.padding(bottom = Space.xs),
    )
}

/** Floating glass navigation. Never touches the system gesture area. */
@Composable
fun GlassBottomNavigation(
    items: List<Triple<String, androidx.compose.ui.graphics.vector.ImageVector, String>>,
    selectedRoute: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = JohnTheme.colors
    Box(
        modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(horizontal = Space.m, vertical = Space.s)
    ) {
        GlassSurface(
            modifier = Modifier.fillMaxWidth(),
            level = GlassLevel.Thick,
            shape = RoundedCornerShape(Radius.hero),
        ) {
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = Space.xs, vertical = Space.xs),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                items.forEach { (route, icon, label) ->
                    val selected = route == selectedRoute
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .clip(RoundedCornerShape(Radius.small))
                            .clickable(onClickLabel = label) { onSelect(route) }
                            .padding(horizontal = Space.s, vertical = Space.xs)
                            .height(48.dp),
                        verticalArrangement = Arrangement.Center,
                    ) {
                        androidx.compose.material3.Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = if (selected) colors.accentSoft else colors.secondary,
                            modifier = Modifier.size(22.dp),
                        )
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelSmall,
                            color = if (selected) colors.foreground else colors.tertiary,
                            modifier = Modifier.clearAndSetSemantics { },
                        )
                    }
                }
            }
        }
    }
}
