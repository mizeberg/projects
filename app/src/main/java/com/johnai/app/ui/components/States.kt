package com.johnai.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.johnai.app.ui.glass.GlassButton
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Radius
import com.johnai.app.ui.theme.Space

/**
 * Empty states are first-class. John AI never fills a screen with invented records
 * to look busy — it explains what will appear here and offers the real next action.
 */
@Composable
fun EmptyState(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
) {
    val colors = JohnTheme.colors
    GlassCard(modifier.fillMaxWidth(), level = GlassLevel.UltraThin) {
        Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
            Text(title.uppercase(), style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
            Text(message, style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
            if (actionLabel != null && onAction != null) {
                Spacer(Modifier.height(Space.xs))
                GlassButton(actionLabel, onAction)
            }
        }
    }
}

/** Errors explain what happened and offer a way forward. No stack traces, ever. */
@Composable
fun ErrorState(
    message: String,
    modifier: Modifier = Modifier,
    onRetry: (() -> Unit)? = null,
) {
    val colors = JohnTheme.colors
    GlassCard(modifier.fillMaxWidth(), level = GlassLevel.Thin) {
        Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
            Text("SOMETHING WENT WRONG", style = MaterialTheme.typography.labelSmall, color = colors.error)
            Text(message, style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
            if (onRetry != null) {
                Spacer(Modifier.height(Space.xs))
                GlassButton("Retry", onRetry)
            }
        }
    }
}

/** Calm glass skeletons instead of spinners scattered across the app. */
@Composable
fun SkeletonBlock(height: Dp = 72.dp, modifier: Modifier = Modifier) {
    Spacer(
        modifier
            .fillMaxWidth()
            .height(height)
            .clip(RoundedCornerShape(Radius.card))
            .background(JohnTheme.colors.glassTint.copy(alpha = 0.05f))
    )
}

@Composable
fun SkeletonList(count: Int = 3, modifier: Modifier = Modifier) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(Space.s)) {
        repeat(count) { SkeletonBlock() }
    }
}

@Composable
fun KeyValueRow(label: String, value: String, modifier: Modifier = Modifier) {
    Row(
        modifier.fillMaxWidth().padding(vertical = Space.xxs),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, style = MaterialTheme.typography.bodyLarge, color = JohnTheme.colors.secondary)
        Text(value, style = MaterialTheme.typography.bodyLarge, color = JohnTheme.colors.foreground)
    }
}
