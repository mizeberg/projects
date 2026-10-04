package com.johnai.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.components.EmptyState
import com.johnai.app.ui.components.KeyValueRow
import com.johnai.app.ui.glass.GlassButton
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.glass.GlassProgressBar
import com.johnai.app.ui.glass.MetricHeader
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import kotlinx.coroutines.launch

/**
 * MY MINISTRY PROGRESS.
 *
 * Every figure is a count of real records. Where there is no data, John shows
 * an empty state instead of a fabricated percentage — and this is personal
 * progress, never a score or a ranking.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProgressScreen() {
    val (progressState, reloadProgress) = rememberLoader { it.progress() }
    val (workloadState, reloadWorkload) = rememberLoader { it.workload() }
    val colors = JohnTheme.colors

    JohnScreen(title = "Progress", subtitle = "Counted from your own records") {
        item {
            AsyncContent(progressState, reloadProgress) { p ->
                Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(Space.l), verticalArrangement = Arrangement.spacedBy(Space.m)) {
                        MetricHeader("Sermons preached", p.sermons.preached.toString().padStart(2, '0'), support = "of ${p.sermons.total} total")
                        MetricHeader("Ready to preach", p.sermons.ready.toString().padStart(2, '0'))
                        MetricHeader("Open prayer", p.prayer.open.toString().padStart(2, '0'), support = "${p.prayer.answered} answered")
                        MetricHeader("Upcoming events", p.events.upcoming.toString().padStart(2, '0'))
                    }

                    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Regular) {
                        Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                            Text("TASKS", style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
                            if (p.tasks.percent == null) {
                                Text(
                                    "No tasks recorded yet, so there is nothing to measure.",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = colors.secondary,
                                )
                            } else {
                                Text(
                                    "${p.tasks.completed} / ${p.tasks.total}",
                                    style = MaterialTheme.typography.headlineLarge,
                                    color = colors.foreground,
                                )
                                GlassProgressBar(p.tasks.percent / 100f, label = "${p.tasks.percent} percent of tasks completed")
                            }
                        }
                    }

                    if (p.goals.isEmpty()) {
                        EmptyState("No goals set", "Set a goal and John will measure it from your actual records.")
                    } else {
                        p.goals.forEach { goal ->
                            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                                Column(verticalArrangement = Arrangement.spacedBy(Space.xxs)) {
                                    Text(goal.title, style = MaterialTheme.typography.titleMedium, color = colors.foreground)
                                    Text(
                                        "${goal.current.toInt()} / ${goal.target.toInt()}",
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = colors.secondary,
                                    )
                                    if (goal.target > 0) {
                                        GlassProgressBar((goal.current / goal.target).toFloat())
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        item { SectionHeader("This week") }
        item {
            AsyncContent(workloadState, reloadWorkload) { w ->
                if (w.days.isEmpty()) {
                    EmptyState("Nothing scheduled", "Workload patterns appear once your week has entries.")
                } else {
                    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                        Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                            w.days.forEach { day ->
                                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        day.date.takeLast(5),
                                        style = MaterialTheme.typography.labelLarge,
                                        color = colors.tertiary,
                                    )
                                    Column(Modifier.weight(1f).padding(horizontal = Space.xs)) {
                                        GlassProgressBar(
                                            (day.total / (w.days.maxOf { it.total }.coerceAtLeast(1)).toFloat()),
                                            label = "${day.total} items on ${day.date}",
                                        )
                                    }
                                    Text(
                                        day.total.toString(),
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = colors.foreground,
                                    )
                                }
                            }
                            w.observation?.let {
                                Text(
                                    it,
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = colors.secondary,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ProfileScreen() {
    val repo = LocalRepository.current
    val nav = LocalNavigator.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors
    val session by repo.session.collectAsState()
    val profile = session?.profile

    JohnScreen(title = "Profile") {
        item {
            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Regular) {
                Column(verticalArrangement = Arrangement.spacedBy(Space.xxs)) {
                    Text(
                        profile?.preferredName?.ifBlank { session?.user?.displayName.orEmpty() } ?: "",
                        style = MaterialTheme.typography.displayLarge,
                        color = colors.foreground,
                    )
                    Text(session?.user?.email.orEmpty(), style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                    if (profile?.role?.isNotBlank() == true) {
                        Text(
                            profile.role.replace('_', ' ').replaceFirstChar { it.uppercase() },
                            style = MaterialTheme.typography.labelLarge,
                            color = colors.accentSoft,
                        )
                    }
                }
            }
        }

        item { SectionHeader("Your setup") }
        item {
            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                Column {
                    KeyValueRow("Bible translations", profile?.bibleTranslations?.joinToString(", ")?.ifBlank { "Not set" } ?: "Not set")
                    KeyValueRow("Ministry areas", profile?.ministryAreas?.joinToString(", ")?.ifBlank { "Not set" } ?: "Not set")
                    KeyValueRow("Sermon workflow", profile?.sermonWorkflow?.replace('_', ' ')?.ifBlank { "Not set" } ?: "Not set")
                    KeyValueRow("Time zone", profile?.timeZone ?: "Not set")
                }
            }
        }

        item { SectionHeader("John") }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin, onClick = { nav.navigate(Routes.MEMORY) }) {
                    Column {
                        Text("John's memory", style = MaterialTheme.typography.titleMedium, color = colors.foreground)
                        Text("See, edit and delete everything John remembers.", style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                    }
                }
                GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin, onClick = { nav.navigate(Routes.TRUST) }) {
                    Column {
                        Text("Trust Center", style = MaterialTheme.typography.titleMedium, color = colors.foreground)
                        Text("What is private, what is shared, and what John can access.", style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                    }
                }
            }
        }

        item {
            GlassButton("Sign out", {
                repo.signOut()
                nav.navigate(Routes.AUTH) { popUpTo(Routes.HOME) { inclusive = true } }
            })
        }
    }
}
