package com.johnai.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.johnai.app.data.ActionCard
import com.johnai.app.data.AiContext
import com.johnai.app.data.PulseItem
import com.johnai.app.ui.glass.GlassButton
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space

/**
 * Structured confirmation card. Every write John proposes appears here first;
 * nothing is created, changed or deleted until the pastor taps the action.
 */
@Composable
fun AiActionCard(
    card: ActionCard,
    onConfirm: () -> Unit,
    onCancel: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = JohnTheme.colors
    GlassCard(modifier.fillMaxWidth(), level = GlassLevel.Prominent) {
        Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
            Text(
                text = when (card.mode) {
                    "destructive" -> "CONFIRM — THIS REMOVES DATA"
                    else -> "CONFIRM ACTION"
                },
                style = MaterialTheme.typography.labelSmall,
                color = if (card.mode == "destructive") colors.error else colors.accentSoft,
            )
            Text(card.title, style = MaterialTheme.typography.titleMedium, color = colors.foreground)
            card.args?.let {
                Text(
                    text = it.toString().removeSurrounding("{", "}").replace("\",", "\" · "),
                    style = MaterialTheme.typography.bodyLarge,
                    color = colors.secondary,
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                GlassButton("Cancel", onCancel)
                GlassButton(card.confirmLabel, onConfirm, emphasised = true)
            }
        }
    }
}

/** Transparency panel: exactly what John is using, with nothing hidden. */
@Composable
fun AiContextPanel(
    context: AiContext,
    onClear: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    if (context.used.isEmpty()) return
    val colors = JohnTheme.colors
    GlassCard(modifier.fillMaxWidth(), level = GlassLevel.UltraThin) {
        Column(verticalArrangement = Arrangement.spacedBy(Space.xxs)) {
            Text("AI CONTEXT", style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
            context.used.forEach { source ->
                Text(
                    "• ${source.title.ifBlank { source.type }}",
                    style = MaterialTheme.typography.bodyLarge,
                    color = colors.secondary,
                )
            }
            if (onClear != null) {
                TextButton(onClick = onClear) {
                    Text("Clear context", color = colors.accentSoft)
                }
            }
        }
    }
}

/**
 * "Why am I seeing this?" — every surfaced item can explain the exact rule and
 * the real records behind it.
 */
@Composable
fun WhyAmISeeingThis(item: PulseItem, modifier: Modifier = Modifier) {
    var expanded by remember { mutableStateOf(false) }
    val colors = JohnTheme.colors
    Column(modifier) {
        TextButton(onClick = { expanded = !expanded }, contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)) {
            Text(
                if (expanded) "Hide reason" else "Why am I seeing this?",
                style = MaterialTheme.typography.labelLarge,
                color = colors.accentSoft,
            )
        }
        AnimatedVisibility(visible = expanded) {
            Column(Modifier.padding(top = Space.xxs), verticalArrangement = Arrangement.spacedBy(Space.xxs)) {
                Text(item.rule, style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                item.sources.forEach {
                    Text("• ${it.title.ifBlank { it.type }}", style = MaterialTheme.typography.bodyLarge, color = colors.tertiary)
                }
            }
        }
    }
}
