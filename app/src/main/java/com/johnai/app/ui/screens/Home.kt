package com.johnai.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.johnai.app.data.ContinueItem
import com.johnai.app.data.PulseItem
import com.johnai.app.data.TodayItem
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.components.EmptyState
import com.johnai.app.ui.components.WhyAmISeeingThis
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val TIME: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

fun formatTime(iso: String?): String = iso?.let {
    runCatching {
        TIME.format(Instant.parse(it).atZone(ZoneId.systemDefault()))
    }.getOrDefault("")
} ?: ""

private fun greeting(hour: Int): String = when {
    hour < 12 -> "Good morning"
    hour < 17 -> "Good afternoon"
    else -> "Good evening"
}

/**
 * HOME = "TODAY", not a dashboard of widgets.
 *
 * It answers: what is happening now, what is next, what needs attention —
 * all from stored records. When nothing needs attention, it says so calmly
 * instead of manufacturing alerts.
 */
@Composable
fun HomeScreen(onOpenPalette: () -> Unit) {
    val repo = LocalRepository.current
    val nav = LocalNavigator.current
    val colors = JohnTheme.colors
    val session by repo.session.collectAsState()
    val profile = session?.profile

    var dismissed by remember { mutableStateOf(setOf<String>()) }

    val (pulseState, reloadPulse) = rememberLoader(dismissed) { it.pulse(dismissed) }
    val (todayState, reloadToday) = rememberLoader { it.today() }
    val (continueState, reloadContinue) = rememberLoader { it.continueItems() }

    val hour = remember { java.time.LocalTime.now().hour }
    val name = profile?.preferredName.orEmpty()

    JohnScreen(
        title = if (name.isBlank()) greeting(hour) else "${greeting(hour)},\n$name",
        subtitle = "Here's what needs your attention.",
        actions = {
            IconButton(onClick = onOpenPalette) {
                Icon(Icons.Filled.Search, contentDescription = "Ask John anything", tint = colors.secondary)
            }
        },
    ) {
        item { SectionHeader("Ministry Pulse") }

        item {
            AsyncContent(pulseState, reloadPulse) { items ->
                if (items.isEmpty()) {
                    EmptyState(
                        title = "Nothing needs your attention",
                        message = "No deadlines, follow-ups or overdue work are due right now.",
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
                        items.forEach { item ->
                            PulseCard(
                                item = item,
                                onOpen = { nav.navigate(Routes.resolve(item.route)) },
                                onDismiss = { dismissed = dismissed + item.id },
                            )
                        }
                    }
                }
            }
        }

        item { SectionHeader("Today") }
        item {
            AsyncContent(todayState, reloadToday) { today ->
                if (today.items.isEmpty()) {
                    EmptyState(
                        title = "Today is clear",
                        message = "Services, meetings, tasks and follow-ups you schedule will appear here.",
                    )
                } else {
                    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                        Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                            today.items.forEach { TodayRow(it) }
                        }
                    }
                }
            }
        }

        item { SectionHeader("Continue") }
        item {
            AsyncContent(continueState, reloadContinue) { items ->
                if (items.isEmpty()) {
                    EmptyState(
                        title = "Nothing in progress",
                        message = "When you start a sermon or a note, you can pick it up here.",
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                        items.take(3).forEach { ContinueCard(it) { nav.navigate(Routes.resolve(it.route)) } }
                    }
                }
            }
        }

        item { SectionHeader("Quick actions") }
        item { QuickActions() }
    }
}

@Composable
private fun PulseCard(item: PulseItem, onOpen: () -> Unit, onDismiss: () -> Unit) {
    val colors = JohnTheme.colors
    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Regular, onClick = onOpen) {
        Column(verticalArrangement = Arrangement.spacedBy(Space.xxs)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    item.category.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = colors.accentSoft,
                    modifier = Modifier.weight(1f),
                )
                Text(
                    "Dismiss",
                    style = MaterialTheme.typography.labelLarge,
                    color = colors.tertiary,
                    modifier = Modifier
                        .padding(start = Space.xs)
                        .clickable(onClickLabel = "Dismiss ${item.title}") { onDismiss() },
                )
            }
            Text(item.title, style = MaterialTheme.typography.titleLarge, color = colors.foreground)
            if (item.subtitle.isNotBlank()) {
                Text(item.subtitle, style = MaterialTheme.typography.bodyLarge, color = colors.accentSoft)
            }
            if (item.detail.isNotBlank()) {
                Text(item.detail, style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
            }
            WhyAmISeeingThis(item)
        }
    }
}

@Composable
private fun TodayRow(item: TodayItem) {
    val colors = JohnTheme.colors
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(
            formatTime(item.at).ifBlank { "—" },
            style = MaterialTheme.typography.labelLarge,
            color = colors.accentSoft,
            modifier = Modifier.padding(end = Space.s),
        )
        Column(Modifier.weight(1f)) {
            Text(item.title, style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
            Text(item.kind.uppercase(), style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
        }
    }
}

@Composable
private fun ContinueCard(item: ContinueItem, onOpen: () -> Unit) {
    val colors = JohnTheme.colors
    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin, onClick = onOpen) {
        Column {
            Text(item.title, style = MaterialTheme.typography.titleMedium, color = colors.foreground)
            Text(
                buildString {
                    append(item.type.uppercase())
                    if (item.position.isNotBlank()) append(" · You stopped at ${item.position}")
                },
                style = MaterialTheme.typography.labelSmall,
                color = colors.tertiary,
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun QuickActions() {
    val nav = LocalNavigator.current
    val actions = listOf(
        "New sermon" to Routes.SERMONS,
        "Tasks" to Routes.TASKS,
        "Prayer" to Routes.PRAYER,
        "Notes" to Routes.NOTES,
        "Events" to Routes.EVENTS,
        "Inbox" to Routes.INBOX,
    )
    FlowRow(horizontalArrangement = Arrangement.spacedBy(Space.xs), verticalArrangement = Arrangement.spacedBy(Space.xs)) {
        actions.forEach { (label, route) ->
            GlassCard(
                level = GlassLevel.Thin,
                onClick = { nav.navigate(route) },
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = Space.s, vertical = Space.xs),
            ) {
                Text(label, style = MaterialTheme.typography.labelLarge, color = JohnTheme.colors.foreground)
            }
        }
    }
}
