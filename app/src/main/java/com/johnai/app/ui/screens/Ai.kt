package com.johnai.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.johnai.app.data.ActionCard
import com.johnai.app.data.AiContext
import com.johnai.app.data.AiResponse
import com.johnai.app.data.JohnApiException
import com.johnai.app.navigation.AiFocus
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.components.AiActionCard
import com.johnai.app.ui.components.AiContextPanel
import com.johnai.app.ui.glass.GlassAIOrb
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.glass.OrbState
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import com.johnai.app.ui.theme.Touch
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject

private data class ChatEntry(val role: String, val text: String, val sources: List<String> = emptyList())

/**
 * The John AI screen.
 *
 * The input field and send button are always visible above the keyboard.
 * Confirmation cards appear inline for any write, and the context panel shows
 * exactly which of the pastor's records John is using.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AiScreen() {
    val repo = LocalRepository.current
    val nav = LocalNavigator.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors

    val entries = remember { mutableStateListOf<ChatEntry>() }
    var input by remember { mutableStateOf("") }
    var orb by remember { mutableStateOf(OrbState.Idle) }
    var pending by remember { mutableStateOf<ActionCard?>(null) }
    var context by remember { mutableStateOf(AiContext()) }
    var suggestions by remember { mutableStateOf(listOf<String>()) }
    val listState = rememberLazyListState()

    LaunchedEffect(AiFocus.context) {
        suggestions = runCatching {
            repo.suggestions(AiFocus.context?.screen, AiFocus.context?.entityType)
        }.getOrDefault(emptyList())
    }

    LaunchedEffect(entries.size) {
        if (entries.isNotEmpty()) listState.animateScrollToItem(entries.lastIndex)
    }

    fun handle(response: AiResponse) {
        context = response.context
        when (response.type) {
            "confirm" -> {
                pending = response.card
                entries.add(ChatEntry("assistant", response.message))
            }
            "navigate" -> {
                entries.add(ChatEntry("assistant", response.message))
                response.route?.let { nav.navigate(Routes.resolve(it)) }
            }
            else -> entries.add(
                ChatEntry(
                    role = "assistant",
                    text = response.message,
                    sources = response.sources.map { it.title.ifBlank { it.type } },
                )
            )
        }
    }

    fun ask(message: String) {
        if (message.isBlank()) return
        entries.add(ChatEntry("user", message))
        input = ""
        pending = null
        orb = OrbState.Thinking
        scope.launch {
            try {
                handle(repo.ask(message, AiFocus.context))
                orb = OrbState.Responding
            } catch (e: JohnApiException) {
                entries.add(ChatEntry("assistant", e.message))
                orb = OrbState.Error
            } catch (e: Exception) {
                entries.add(ChatEntry("assistant", "John could not reach your workspace just now."))
                orb = OrbState.Error
            }
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .imePadding()
            .padding(horizontal = Space.m)
    ) {
        Row(Modifier.fillMaxWidth().padding(vertical = Space.xs), verticalAlignment = Alignment.CenterVertically) {
            GlassAIOrb(state = orb, sizeDp = 56.dp)
            Column(Modifier.padding(start = Space.s).weight(1f)) {
                Text("JOHN AI", style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
                Text(
                    AiFocus.label ?: "Your whole workspace",
                    style = MaterialTheme.typography.titleMedium,
                    color = colors.foreground,
                )
            }
            if (AiFocus.label != null) {
                Text(
                    "Clear",
                    style = MaterialTheme.typography.labelLarge,
                    color = colors.accentSoft,
                    modifier = Modifier
                        .padding(start = Space.xs)
                        .clickable(onClickLabel = "Clear AI context") { AiFocus.clear() },
                )
            }
        }

        AiContextPanel(context, onClear = { AiFocus.clear() })

        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            state = listState,
            verticalArrangement = Arrangement.spacedBy(Space.xs),
        ) {
            if (entries.isEmpty()) {
                item {
                    GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin) {
                        Column {
                            Text(
                                "John answers from what you have stored.",
                                style = MaterialTheme.typography.titleMedium,
                                color = colors.foreground,
                            )
                            Text(
                                "Ask about your sermons, tasks, prayer follow-ups, events or schedule. " +
                                    "If John does not have the information, it will say so rather than guess.",
                                style = MaterialTheme.typography.bodyLarge,
                                color = colors.secondary,
                            )
                        }
                    }
                }
            }
            items(entries.size) { i ->
                val entry = entries[i]
                GlassCard(
                    Modifier.fillMaxWidth(),
                    level = if (entry.role == "user") GlassLevel.UltraThin else GlassLevel.Thin,
                ) {
                    Column {
                        Text(
                            if (entry.role == "user") "YOU" else "JOHN",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (entry.role == "user") colors.tertiary else colors.accentSoft,
                        )
                        Text(entry.text, style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
                        if (entry.sources.isNotEmpty()) {
                            Text(
                                "Sources: ${entry.sources.joinToString(", ")}",
                                style = MaterialTheme.typography.labelSmall,
                                color = colors.tertiary,
                            )
                        }
                    }
                }
            }
            pending?.let { card ->
                item {
                    AiActionCard(
                        card = card,
                        onCancel = { pending = null },
                        onConfirm = {
                            scope.launch {
                                try {
                                    handle(repo.executeConfirmed(card.tool, card.args as? JsonObject))
                                } catch (e: JohnApiException) {
                                    entries.add(ChatEntry("assistant", e.message))
                                }
                                pending = null
                            }
                        },
                    )
                }
            }
        }

        if (suggestions.isNotEmpty() && entries.isEmpty()) {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                suggestions.forEach { suggestion ->
                    GlassCard(
                        level = GlassLevel.UltraThin,
                        onClick = { ask(suggestion) },
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = Space.s, vertical = Space.xs),
                    ) {
                        Text(suggestion, style = MaterialTheme.typography.labelLarge, color = colors.secondary)
                    }
                }
            }
        }

        Row(
            Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(vertical = Space.xs),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                placeholder = { Text("Ask John anything…") },
                modifier = Modifier.weight(1f),
                maxLines = 4,
            )
            IconButton(
                onClick = { orb = if (orb == OrbState.Listening) OrbState.Idle else OrbState.Listening },
                modifier = Modifier.size(Touch.preferred),
            ) {
                Icon(Icons.Filled.Mic, contentDescription = "Voice input", tint = colors.secondary)
            }
            IconButton(
                onClick = { ask(input.trim()) },
                enabled = input.isNotBlank(),
                modifier = Modifier.size(Touch.preferred),
            ) {
                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send", tint = colors.accentSoft)
            }
        }
    }
}
