package com.johnai.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.johnai.app.data.ChecklistItem
import com.johnai.app.data.Sermon
import com.johnai.app.data.SermonIntelligence
import com.johnai.app.data.TimelineStep
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.AiFocus
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.components.EmptyState
import com.johnai.app.ui.glass.GlassButton
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.glass.GlassProgressBar
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import kotlinx.coroutines.launch

/**
 * The sermon workspace.
 *
 * Preparation readiness, the timeline and every intelligence figure here are
 * computed from the pastor's own checklist and records. No model assigns a
 * percentage, and no observation appears without a source behind it.
 */
@Composable
fun SermonScreen(sermonId: String) {
    val repo = LocalRepository.current
    val nav = LocalNavigator.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors
    var version by remember { mutableStateOf(0) }

    val (sermonState, reloadSermon) = rememberLoader(sermonId, version) { it.sermon(sermonId) }
    val (intelState, reloadIntel) = rememberLoader(sermonId, version) { it.sermonIntelligence(sermonId) }
    val (mapState, reloadMap) = rememberLoader(sermonId, version) { it.sermonMap(sermonId) }

    JohnScreen(title = "Sermon", showBack = true) {
        item {
            AsyncContent(sermonState, reloadSermon) { sermon ->
                Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
                    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Prominent) {
                        Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                            Text(
                                listOfNotNull(
                                    sermon.service.ifBlank { null },
                                    sermon.preachingDate?.take(10),
                                ).joinToString(" · ").uppercase().ifBlank { sermon.status },
                                style = MaterialTheme.typography.labelSmall,
                                color = colors.tertiary,
                            )
                            Text(sermon.title, style = MaterialTheme.typography.displayLarge, color = colors.foreground)
                            if (sermon.keyIdea.isNotBlank()) {
                                Text(sermon.keyIdea, style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                            }
                            Text(
                                "${sermon.status.replace('_', ' ')} · ${sermon.readiness.percent}% prepared",
                                style = MaterialTheme.typography.labelLarge,
                                color = colors.accentSoft,
                            )
                            GlassProgressBar(
                                value = sermon.readiness.percent / 100f,
                                label = "${sermon.readiness.percent} percent of your preparation checklist complete",
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                                GlassButton("Edit", { nav.navigate(Routes.sermonEditor(sermon.id)) }, emphasised = true)
                                GlassButton("Focus", { nav.navigate(Routes.focus(sermon.id)) })
                                GlassButton("Preach", { nav.navigate(Routes.preach(sermon.id)) })
                            }
                        }
                    }

                    SectionHeader("Preparation")
                    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                        Column {
                            sermon.checklist.forEach { item ->
                                ChecklistRow(item) { done ->
                                    scope.launch {
                                        repo.updateChecklist(
                                            sermon.id,
                                            sermon.checklist.map { if (it.id == item.id) it.copy(done = done) else it },
                                        )
                                        version += 1
                                    }
                                }
                            }
                        }
                    }

                    if (sermon.timeline.isNotEmpty()) {
                        SectionHeader("Timeline")
                        GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin) {
                            Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                                Text(
                                    "Drafted from your preaching date and stated workflow. Edit it freely — John does not assume your week.",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = colors.tertiary,
                                )
                                sermon.timeline.forEach { TimelineRow(it) }
                            }
                        }
                    }
                }
            }
        }

        item { SectionHeader("Sermon Intelligence") }
        item {
            AsyncContent(intelState, reloadIntel) { intel -> IntelligencePanel(intel) }
        }

        item { SectionHeader("Connected records") }
        item {
            AsyncContent(mapState, reloadMap) { map ->
                if (map.edges.isEmpty()) {
                    EmptyState(
                        title = "Nothing linked yet",
                        message = "Notes, passages, tasks and dates you attach to this sermon appear here.",
                    )
                } else {
                    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                        Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                            map.edges.forEach { edge ->
                                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        edge.label.uppercase(),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = colors.tertiary,
                                        modifier = Modifier.padding(end = Space.xs),
                                    )
                                    Text(
                                        edge.to.title,
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = colors.foreground,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        item {
            GlassButton("Ask John about this sermon", {
                // Smart context switching: the entity you are looking at becomes
                // John's context — scoped to this sermon and nothing else.
                AiFocus.set(entityType = "sermon", entityId = sermonId, label = "This sermon")
                nav.navigate(Routes.AI)
            })
        }
    }
}

@Composable
private fun ChecklistRow(item: ChecklistItem, onToggle: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Checkbox(checked = item.done, onCheckedChange = onToggle)
        Text(
            item.label,
            style = MaterialTheme.typography.bodyLarge,
            color = if (item.done) JohnTheme.colors.tertiary else JohnTheme.colors.foreground,
        )
    }
}

@Composable
private fun TimelineRow(step: TimelineStep) {
    val colors = JohnTheme.colors
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(if (step.done) colors.accent else colors.tertiary.copy(alpha = 0.5f))
        )
        Text(
            step.date.take(10),
            style = MaterialTheme.typography.labelSmall,
            color = colors.tertiary,
            modifier = Modifier.padding(horizontal = Space.xs),
        )
        Text(step.label, style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun IntelligencePanel(intel: SermonIntelligence) {
    val colors = JohnTheme.colors
    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Regular) {
        Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(Space.l), verticalArrangement = Arrangement.spacedBy(Space.s)) {
                CountTile("Passages", intel.counts.bibleReferences)
                CountTile("Main points", intel.counts.mainPoints)
                CountTile("Illustrations", intel.counts.illustrations)
                CountTile("Applications", intel.counts.applications)
                CountTile("Linked notes", intel.counts.linkedNotes)
                CountTile("Open tasks", intel.counts.openTasks)
            }
            if (intel.observations.isNotEmpty()) {
                Column(verticalArrangement = Arrangement.spacedBy(Space.xxs)) {
                    Text("JOHN NOTICED", style = MaterialTheme.typography.labelSmall, color = colors.accentSoft)
                    intel.observations.forEach {
                        Text("• ${it.text}", style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                    }
                }
            }
        }
    }
}

@Composable
private fun CountTile(label: String, value: Int) {
    Column {
        Text(
            value.toString().padStart(2, '0'),
            style = MaterialTheme.typography.headlineLarge,
            color = JohnTheme.colors.foreground,
        )
        Text(label.uppercase(), style = MaterialTheme.typography.labelSmall, color = JohnTheme.colors.tertiary)
    }
}
