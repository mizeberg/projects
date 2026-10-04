package com.johnai.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Checkbox
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
import com.johnai.app.navigation.AiFocus
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.components.EmptyState
import com.johnai.app.ui.glass.GlassButton
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/** MY WORK — the pastor's workspace index. Contextual, not a feature dump. */
@Composable
fun WorkScreen() {
    val nav = LocalNavigator.current
    val colors = JohnTheme.colors
    val sections = listOf(
        Triple("Sermons", "Prepare, archive and preach", Routes.SERMONS),
        Triple("Tasks", "Everything you owe someone", Routes.TASKS),
        Triple("Prayer", "Requests and follow-ups", Routes.PRAYER),
        Triple("Notes", "Study, meetings, counselling, ideas", Routes.NOTES),
        Triple("Calendar", "Services, meetings and deadlines", Routes.CALENDAR),
        Triple("Events", "Planning, tasks and finances", Routes.EVENTS),
        Triple("Inbox", "What needs action vs. awareness", Routes.INBOX),
    )
    JohnScreen(title = "My work", subtitle = "Your ministry workspace") {
        items(sections.size) { i ->
            val (title, body, route) = sections[i]
            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin, onClick = { nav.navigate(route) }) {
                Column {
                    Text(title, style = MaterialTheme.typography.titleLarge, color = colors.foreground)
                    Text(body, style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                }
            }
        }
    }
}

@Composable
fun TasksScreen() {
    val repo = LocalRepository.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors
    var version by remember { mutableStateOf(0) }
    var newTitle by remember { mutableStateOf("") }
    val (state, reload) = rememberLoader(version) { it.tasks() }

    JohnScreen(title = "Tasks", showBack = true) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                OutlinedTextField(
                    value = newTitle,
                    onValueChange = { newTitle = it },
                    label = { Text("New task") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                )
                GlassButton("Add", {
                    val t = newTitle.trim()
                    if (t.isNotBlank()) scope.launch {
                        repo.createTask(t, null)
                        newTitle = ""
                        version += 1
                    }
                }, emphasised = true)
            }
        }
        item {
            AsyncContent(state, reload) { tasks ->
                if (tasks.isEmpty()) {
                    EmptyState("No tasks", "Anything you or John capture will be listed here.")
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                        tasks.forEach { task ->
                            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(
                                        checked = task.status == "COMPLETED",
                                        onCheckedChange = { done ->
                                            scope.launch {
                                                repo.setTaskStatus(task.id, if (done) "COMPLETED" else "TODO")
                                                version += 1
                                            }
                                        },
                                    )
                                    Column(Modifier.weight(1f)) {
                                        Text(task.title, style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
                                        task.dueAt?.let {
                                            Text(
                                                "Due ${it.take(10)} ${formatTime(it)}",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = colors.tertiary,
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PrayerScreen() {
    val repo = LocalRepository.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors
    var version by remember { mutableStateOf(0) }
    var title by remember { mutableStateOf("") }
    var person by remember { mutableStateOf("") }
    val (state, reload) = rememberLoader(version) { it.prayer() }

    JohnScreen(
        title = "Prayer",
        subtitle = "Private by default. Nothing here is shared unless you share it.",
        showBack = true,
    ) {
        item {
            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                    OutlinedTextField(
                        value = title, onValueChange = { title = it },
                        label = { Text("Request") }, singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = person, onValueChange = { person = it },
                        label = { Text("Person (optional)") }, singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    GlassButton("Add request", {
                        val t = title.trim()
                        if (t.isNotBlank()) scope.launch {
                            repo.createPrayer(t, person.trim(), null)
                            title = ""; person = ""; version += 1
                        }
                    }, emphasised = true)
                }
            }
        }
        item {
            AsyncContent(state, reload) { requests ->
                if (requests.isEmpty()) {
                    EmptyState("Your prayer list is clear", "Requests and follow-ups you record appear here.")
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                        requests.forEach { p ->
                            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin) {
                                Column(verticalArrangement = Arrangement.spacedBy(Space.xxs)) {
                                    Text(p.status.replace('_', ' '), style = MaterialTheme.typography.labelSmall, color = colors.accentSoft)
                                    Text(p.title, style = MaterialTheme.typography.titleMedium, color = colors.foreground)
                                    if (p.person.isNotBlank()) {
                                        Text(p.person, style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                                    }
                                    p.followUpAt?.let {
                                        Text("Follow up ${it.take(10)}", style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
                                    }
                                    Row(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                                        GlassButton("Praying", {
                                            scope.launch { repo.setPrayerStatus(p.id, "PRAYING"); version += 1 }
                                        })
                                        GlassButton("Answered", {
                                            scope.launch { repo.setPrayerStatus(p.id, "ANSWERED"); version += 1 }
                                        })
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NotesScreen() {
    val repo = LocalRepository.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors
    var version by remember { mutableStateOf(0) }
    var title by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    val (state, reload) = rememberLoader(version) { it.notes() }

    JohnScreen(title = "Notes", showBack = true) {
        item {
            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                    OutlinedTextField(
                        value = title, onValueChange = { title = it },
                        label = { Text("Title") }, singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = body, onValueChange = { body = it },
                        label = { Text("Note") }, minLines = 3,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    GlassButton("Save note", {
                        if (title.isNotBlank() || body.isNotBlank()) scope.launch {
                            repo.createNote(title.trim().ifBlank { "Untitled note" }, body.trim())
                            title = ""; body = ""; version += 1
                        }
                    }, emphasised = true)
                }
            }
        }
        item {
            AsyncContent(state, reload) { notes ->
                if (notes.isEmpty()) {
                    EmptyState("No notes yet", "Study notes, meeting notes and reflections live here.")
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                        notes.forEach { n ->
                            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin) {
                                Column {
                                    Text(n.title, style = MaterialTheme.typography.titleMedium, color = colors.foreground)
                                    if (n.body.isNotBlank()) {
                                        Text(
                                            n.body.take(160),
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
    }
}

@Composable
fun InboxScreen() {
    val nav = LocalNavigator.current
    val colors = JohnTheme.colors
    val (state, reload) = rememberLoader { it.inbox() }

    JohnScreen(
        title = "Ministry inbox",
        subtitle = "What needs action, and what only needs awareness.",
        showBack = true,
    ) {
        item {
            AsyncContent(state, reload) { inbox ->
                Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
                    Text("${inbox.actions.size} ACTIONS", style = MaterialTheme.typography.labelSmall, color = colors.accentSoft)
                    if (inbox.actions.isEmpty()) {
                        EmptyState("Nothing needs action", "Overdue tasks, due follow-ups and sermons in review appear here.")
                    } else {
                        inbox.actions.forEach { entry ->
                            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin, onClick = { nav.navigate(Routes.resolve(entry.route)) }) {
                                Text(entry.title, style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
                            }
                        }
                    }
                    Text("${inbox.information.size} FOR AWARENESS", style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
                    inbox.information.forEach { entry ->
                        GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin, onClick = { nav.navigate(Routes.resolve(entry.route)) }) {
                            Text(entry.title, style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                        }
                    }
                }
            }
        }
    }
}
