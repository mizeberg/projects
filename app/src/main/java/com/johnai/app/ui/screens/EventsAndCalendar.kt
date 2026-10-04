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
import com.johnai.app.data.JohnApiException
import com.johnai.app.navigation.AiFocus
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.components.EmptyState
import com.johnai.app.ui.components.ErrorState
import com.johnai.app.ui.components.KeyValueRow
import com.johnai.app.ui.glass.GlassButton
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/** Calendar: an agenda built from real meetings, events and preaching dates. */
@Composable
fun CalendarScreen() {
    val nav = LocalNavigator.current
    val colors = JohnTheme.colors
    val (todayState, reloadToday) = rememberLoader { it.today() }
    val (meetingsState, reloadMeetings) = rememberLoader { it.meetings() }
    val (eventsState, reloadEvents) = rememberLoader { it.events() }

    JohnScreen(title = "Calendar", showBack = true) {
        item { SectionHeader("Today") }
        item {
            AsyncContent(todayState, reloadToday) { today ->
                if (today.items.isEmpty()) {
                    EmptyState("Today is clear", "Nothing is scheduled for today.")
                } else {
                    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                        Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                            today.items.forEach { item ->
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        formatTime(item.at).ifBlank { "—" },
                                        style = MaterialTheme.typography.labelLarge,
                                        color = colors.accentSoft,
                                        
                                    )
                                    Text(
                                        "  ${item.title}",
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

        item { SectionHeader("Upcoming meetings") }
        item {
            AsyncContent(meetingsState, reloadMeetings) { meetings ->
                if (meetings.isEmpty()) {
                    EmptyState("No meetings", "Meetings you schedule appear here with their agendas.")
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                        meetings.forEach { m ->
                            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin, onClick = { nav.navigate(Routes.meeting(m.id)) }) {
                                Column {
                                    Text(m.title, style = MaterialTheme.typography.titleMedium, color = colors.foreground)
                                    Text(
                                        buildString {
                                            append(m.startsAt?.take(10) ?: "No date")
                                            append(" · ")
                                            append(if (m.agenda.isBlank()) "No agenda prepared" else "Agenda ready")
                                        },
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

        item { SectionHeader("Upcoming events") }
        item {
            AsyncContent(eventsState, reloadEvents) { events ->
                if (events.isEmpty()) {
                    EmptyState("No events", "Your upcoming events will appear here.")
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                        events.forEach { e ->
                            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin, onClick = { nav.navigate(Routes.event(e.id)) }) {
                                Text(
                                    "${e.name}${e.startsAt?.let { " · ${it.take(10)}" } ?: ""}",
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
}

@Composable
fun EventsScreen() {
    val repo = LocalRepository.current
    val nav = LocalNavigator.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors
    var version by remember { mutableStateOf(0) }
    var name by remember { mutableStateOf("") }
    val (state, reload) = rememberLoader(version) { it.events() }

    JohnScreen(title = "Events", showBack = true) {
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(Space.xs), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = name, onValueChange = { name = it },
                    label = { Text("New event") }, singleLine = true,
                    modifier = Modifier.weight(1f),
                )
                GlassButton("Add", {
                    val n = name.trim()
                    if (n.isNotBlank()) scope.launch { repo.createEvent(n, null); name = ""; version += 1 }
                }, emphasised = true)
            }
        }
        item {
            AsyncContent(state, reload) { events ->
                if (events.isEmpty()) {
                    EmptyState("No events", "Create an event to track its tasks, documents and finances together.")
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                        events.forEach { e ->
                            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin, onClick = { nav.navigate(Routes.event(e.id)) }) {
                                Column {
                                    Text(e.name, style = MaterialTheme.typography.titleMedium, color = colors.foreground)
                                    e.startsAt?.let {
                                        Text(it.take(10), style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
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

/**
 * Event workspace with its finance ledger.
 *
 * Totals are summed from recorded entries — balance = collected − spent, always.
 * If the signed-in user lacks finance permission the server refuses, and we say
 * so plainly rather than showing an empty ledger that implies there is no money.
 */
@Composable
fun EventScreen(eventId: String) {
    val repo = LocalRepository.current
    val nav = LocalNavigator.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors
    var version by remember { mutableStateOf(0) }
    var entryName by remember { mutableStateOf("") }
    var entryAmount by remember { mutableStateOf("") }
    var isExpense by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    val (eventState, reloadEvent) = rememberLoader(eventId, version) { repo ->
        repo.events().firstOrNull { it.id == eventId }
    }
    val (financeState, reloadFinance) = rememberLoader(eventId, version) { it.finances(eventId) }

    JohnScreen(title = "Event", showBack = true) {
        item {
            AsyncContent(eventState, reloadEvent) { event ->
                if (event == null) {
                    EmptyState("Event not found", "It may have been removed.")
                } else {
                    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Prominent) {
                        Column {
                            Text(event.name, style = MaterialTheme.typography.displayLarge, color = colors.foreground)
                            event.startsAt?.let {
                                Text(it.take(10), style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                            }
                        }
                    }
                }
            }
        }

        item { SectionHeader("Finances") }
        item {
            AsyncContent(financeState, reloadFinance) { finances ->
                Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
                    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Regular) {
                        Column {
                            KeyValueRow("Total collected", "%.2f".format(finances.totalCollected))
                            KeyValueRow("Total spent", "%.2f".format(finances.totalSpent))
                            KeyValueRow("Balance", "%.2f".format(finances.balance))
                        }
                    }
                    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                        Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                            Row(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                                GlassButton("Expense", { isExpense = true }, emphasised = isExpense)
                                GlassButton("Collection", { isExpense = false }, emphasised = !isExpense)
                            }
                            OutlinedTextField(
                                value = entryName, onValueChange = { entryName = it },
                                label = { Text("Description") }, singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                            OutlinedTextField(
                                value = entryAmount, onValueChange = { entryAmount = it },
                                label = { Text("Amount") }, singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                            GlassButton("Record", {
                                val amount = entryAmount.toDoubleOrNull()
                                if (entryName.isNotBlank() && amount != null && amount >= 0) {
                                    scope.launch {
                                        try {
                                            repo.addLedgerEntry(
                                                eventId,
                                                if (isExpense) "expense" else "collection",
                                                entryName.trim(),
                                                amount,
                                            )
                                            entryName = ""; entryAmount = ""; error = null; version += 1
                                        } catch (e: JohnApiException) {
                                            error = e.message
                                        }
                                    }
                                } else {
                                    error = "Enter a description and a positive amount."
                                }
                            }, emphasised = true)
                        }
                    }
                    error?.let { ErrorState(it) }
                    if (finances.entries.isEmpty()) {
                        EmptyState("No entries recorded", "Collections and expenses you record appear here with a running balance.")
                    } else {
                        finances.entries.forEach { entry ->
                            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin) {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Column {
                                        Text(entry.name, style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
                                        Text(entry.kind.uppercase(), style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
                                    }
                                    Text(
                                        "%.2f".format(entry.amount),
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = if (entry.kind == "expense") colors.warning else colors.positive,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        item {
            GlassButton("Ask John about this event") {
                AiFocus.set("event", eventId, "This event")
                nav.navigate(Routes.AI)
            }
        }
    }
}

/**
 * Meeting workspace, including the meeting-to-task workflow:
 * John proposes action items from your own notes; nothing is created until you
 * review and confirm.
 */
@Composable
fun MeetingScreen(meetingId: String) {
    val repo = LocalRepository.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors
    var version by remember { mutableStateOf(0) }
    var notes by remember { mutableStateOf<String?>(null) }
    var agenda by remember { mutableStateOf<String?>(null) }
    var confirmation by remember { mutableStateOf<String?>(null) }

    val (meetingState, reloadMeeting) = rememberLoader(meetingId, version) { repo ->
        repo.meetings().firstOrNull { it.id == meetingId }
    }
    val (proposalState, reloadProposals) = rememberLoader(meetingId, version) { it.proposedActionItems(meetingId) }

    JohnScreen(title = "Meeting", showBack = true) {
        item {
            AsyncContent(meetingState, reloadMeeting) { meeting ->
                if (meeting == null) {
                    EmptyState("Meeting not found", "It may have been removed.")
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
                        Text(meeting.title, style = MaterialTheme.typography.displayLarge, color = colors.foreground)
                        OutlinedTextField(
                            value = agenda ?: meeting.agenda,
                            onValueChange = { agenda = it },
                            label = { Text("Agenda") },
                            minLines = 3,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        OutlinedTextField(
                            value = notes ?: meeting.notes,
                            onValueChange = { notes = it },
                            label = { Text("Notes — prefix a line with \"Action:\" or \"TODO:\" to propose a task") },
                            minLines = 5,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        GlassButton("Save meeting", {
                            scope.launch {
                                repo.updateMeeting(
                                    meetingId,
                                    buildJsonObject {
                                        put("agenda", agenda ?: meeting.agenda)
                                        put("notes", notes ?: meeting.notes)
                                    },
                                )
                                version += 1
                            }
                        }, emphasised = true)
                    }
                }
            }
        }

        item { SectionHeader("Proposed action items") }
        item {
            AsyncContent(proposalState, reloadProposals) { proposals ->
                Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                    if (proposals.proposals.isEmpty()) {
                        EmptyState(
                            "No action items found",
                            "John only proposes tasks from lines you marked with \"Action:\", \"TODO:\" or \"Follow-up:\".",
                        )
                    } else {
                        proposals.proposals.forEach {
                            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin) {
                                Text(it.title, style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
                            }
                        }
                        GlassButton("Create ${proposals.proposals.size} task(s)", {
                            scope.launch {
                                val created = repo.confirmActionItems(meetingId, proposals.proposals)
                                confirmation = "Created ${created.size} task(s)."
                                version += 1
                            }
                        }, emphasised = true)
                    }
                    confirmation?.let {
                        Text(it, style = MaterialTheme.typography.bodyLarge, color = colors.positive)
                    }
                }
            }
        }
    }
}
