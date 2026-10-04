package com.johnai.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.ui.components.EmptyState
import com.johnai.app.ui.glass.GlassButton
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import kotlinx.coroutines.launch

/**
 * Memory timeline.
 *
 * Everything John "remembers" is listed here with its date and source, and the
 * pastor can disable or delete any of it. John never implies it remembers
 * something that is not in this list.
 */
@Composable
fun MemoryScreen() {
    val repo = LocalRepository.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors
    var version by remember { mutableStateOf(0) }
    val (state, reload) = rememberLoader(version) { it.memory() }

    JohnScreen(
        title = "John's memory",
        subtitle = "Only what is listed here is remembered.",
        showBack = true,
    ) {
        item {
            AsyncContent(state, reload) { items ->
                Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
                    if (items.isEmpty()) {
                        EmptyState(
                            "John remembers nothing yet",
                            "Preferences you ask John to keep will appear here, with a date and a source.",
                        )
                    } else {
                        items.forEach { memory ->
                            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                                Column(verticalArrangement = Arrangement.spacedBy(Space.xxs)) {
                                    Text(
                                        memory.createdAt.take(10),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = colors.tertiary,
                                    )
                                    Text(memory.content, style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
                                    Text(
                                        "Source: ${memory.source}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = colors.tertiary,
                                    )
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Switch(
                                            checked = memory.enabled,
                                            onCheckedChange = { enabled ->
                                                scope.launch {
                                                    repo.setMemoryEnabled(memory.id, enabled)
                                                    version += 1
                                                }
                                            },
                                        )
                                        Text(
                                            if (memory.enabled) "Used by John" else "Ignored",
                                            style = MaterialTheme.typography.bodyLarge,
                                            color = colors.secondary,
                                        )
                                    }
                                    GlassButton("Don't remember this", {
                                        scope.launch { repo.deleteMemory(memory.id); version += 1 }
                                    })
                                }
                            }
                        }
                        GlassButton("Clear all memory", {
                            scope.launch { repo.clearMemory(); version += 1 }
                        })
                    }
                }
            }
        }
    }
}

/**
 * Trust Center — privacy in plain language, not buried in legal text.
 */
@Composable
fun TrustCenterScreen() {
    val repo = LocalRepository.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors
    var exported by remember { mutableStateOf<String?>(null) }

    JohnScreen(title = "Trust Center", subtitle = "Where your ministry data lives", showBack = true) {
        item {
            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Regular) {
                Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                    Text("PRIVATE TO YOU", style = MaterialTheme.typography.labelSmall, color = colors.positive)
                    listOf(
                        "Sermons and drafts",
                        "Personal and counselling notes",
                        "Prayer requests and follow-ups",
                        "Your tasks and ideas",
                    ).forEach {
                        Text("✓ $it", style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
                    }
                    Text(
                        "Other pastors cannot see these records, even if they belong to the same church. " +
                            "Access is checked on the server for every single request.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = colors.secondary,
                    )
                }
            }
        }

        item {
            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                    Text("WHAT JOHN CAN SEE", style = MaterialTheme.typography.labelSmall, color = colors.accentSoft)
                    Text(
                        "John is given the minimum information needed to answer each question — " +
                            "usually the record you are looking at, plus the preferences you chose to store. " +
                            "Your whole workspace is never sent at once.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = colors.secondary,
                    )
                    Text(
                        "Financial records are only reachable when your role has finance permission.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = colors.secondary,
                    )
                }
            }
        }

        item {
            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                    Text("ACTIONS JOHN WILL NEVER TAKE ALONE", style = MaterialTheme.typography.labelSmall, color = colors.warning)
                    listOf(
                        "Delete a sermon or record",
                        "Change financial entries",
                        "Share a private pastoral note",
                        "Send an announcement",
                        "Change anyone's permissions",
                    ).forEach {
                        Text("• $it", style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
                    }
                    Text(
                        "Each of these requires your explicit confirmation on a card you can read first.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = colors.secondary,
                    )
                }
            }
        }

        item { SectionHeader("Your data") }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                GlassButton("Export everything", {
                    scope.launch {
                        exported = runCatching { repo.exportData() }
                            .map { "Export ready — ${it.length} characters of your data." }
                            .getOrDefault("John could not prepare the export right now.")
                    }
                })
                exported?.let {
                    Text(it, style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                }
            }
        }
    }
}
