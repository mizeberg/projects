package com.johnai.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.johnai.app.data.Sermon
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.components.EmptyState
import com.johnai.app.ui.glass.GlassButton
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.glass.GlassProgressBar
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import kotlinx.coroutines.launch

/** The sermon vault: everything, searchable, filterable, with real statuses. */
@Composable
fun SermonsScreen() {
    val nav = LocalNavigator.current
    val repo = LocalRepository.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors

    var query by remember { mutableStateOf("") }
    var composing by remember { mutableStateOf(false) }
    var newTitle by remember { mutableStateOf("") }
    var reloadKey by remember { mutableStateOf(0) }

    val (state, reload) = rememberLoader(query, reloadKey) { it.sermons(query.ifBlank { null }) }

    JohnScreen(title = "Sermons", subtitle = "Your preaching workspace and archive", showBack = true) {
        item {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                label = { Text("Search by title, passage, idea or text") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
        }

        item {
            if (composing) {
                GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Regular) {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
                        OutlinedTextField(
                            value = newTitle,
                            onValueChange = { newTitle = it },
                            label = { Text("Sermon title") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                            GlassButton("Cancel", { composing = false; newTitle = "" })
                            GlassButton(
                                "Create",
                                {
                                    val title = newTitle.trim()
                                    if (title.isNotBlank()) {
                                        scope.launch {
                                            val created = repo.createSermon(title, null, emptyList())
                                            composing = false
                                            newTitle = ""
                                            nav.navigate(Routes.sermon(created.id))
                                        }
                                    }
                                },
                                emphasised = true,
                            )
                        }
                    }
                }
            } else {
                GlassButton("New sermon", { composing = true }, emphasised = true)
            }
        }

        item {
            AsyncContent(state, reload) { sermons ->
                if (sermons.isEmpty()) {
                    EmptyState(
                        title = "No sermons yet",
                        message = if (query.isBlank()) {
                            "Start your first sermon workspace and John will track its preparation with you."
                        } else {
                            "Nothing in your workspace matches \"$query\"."
                        },
                        actionLabel = if (query.isBlank()) "Create sermon" else null,
                        onAction = { composing = true },
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
                        sermons.forEach { sermon ->
                            SermonRow(sermon) { nav.navigate(Routes.sermon(sermon.id)) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SermonRow(sermon: Sermon, onOpen: () -> Unit) {
    val colors = JohnTheme.colors
    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin, onClick = onOpen) {
        Column(verticalArrangement = Arrangement.spacedBy(Space.xxs)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    sermon.status.replace('_', ' '),
                    style = MaterialTheme.typography.labelSmall,
                    color = colors.accentSoft,
                    modifier = Modifier.weight(1f),
                )
                sermon.preachingDate?.let {
                    Text(it.take(10), style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
                }
            }
            Text(sermon.title, style = MaterialTheme.typography.titleLarge, color = colors.foreground)
            if (sermon.passages.isNotEmpty()) {
                Text(sermon.passages.joinToString(" · "), style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
            }
            if (sermon.readiness.total > 0) {
                Column(Modifier.padding(top = Space.xxs)) {
                    GlassProgressBar(
                        value = sermon.readiness.percent / 100f,
                        label = "${sermon.readiness.percent} percent of your preparation checklist complete",
                    )
                    Text(
                        "${sermon.readiness.done} of ${sermon.readiness.total} preparation steps",
                        style = MaterialTheme.typography.labelSmall,
                        color = colors.tertiary,
                        modifier = Modifier.padding(top = Space.xxs),
                    )
                }
            }
        }
    }
}
