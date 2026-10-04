package com.johnai.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.johnai.app.data.SearchResults
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * The global command palette: search + AI + navigation + actions in one place.
 *
 * It calls the same search endpoint and the same agent the rest of the app uses
 * — there is no parallel command system with its own logic.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CommandPalette(onDismiss: () -> Unit) {
    val repo = LocalRepository.current
    val nav = LocalNavigator.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors

    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<SearchResults?>(null) }
    var answer by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    // Debounced search as the pastor types.
    LaunchedEffect(query) {
        answer = null
        if (query.isBlank()) { results = null; return@LaunchedEffect }
        delay(250)
        results = runCatching { repo.search(query.trim()) }.getOrNull()
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(
            Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.55f))
                .clickable(onClickLabel = "Close") { onDismiss() }
        ) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .safeDrawingPadding()
                    .imePadding()
                    .padding(Space.m)
            ) {
                GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Prominent) {
                    Column(
                        Modifier.verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(Space.s),
                    ) {
                        OutlinedTextField(
                            value = query,
                            onValueChange = { query = it },
                            placeholder = { Text("Ask John anything…") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )

                        Text("QUICK ACTIONS", style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(Space.xs), verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                            listOf(
                                "New sermon" to Routes.SERMONS,
                                "New note" to Routes.NOTES,
                                "New task" to Routes.TASKS,
                                "Prayer request" to Routes.PRAYER,
                                "New event" to Routes.EVENTS,
                            ).forEach { (label, route) ->
                                GlassCard(
                                    level = GlassLevel.UltraThin,
                                    onClick = { onDismiss(); nav.navigate(route) },
                                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = Space.s, vertical = Space.xs),
                                ) {
                                    Text(label, style = MaterialTheme.typography.labelLarge, color = colors.foreground)
                                }
                            }
                        }

                        if (query.isNotBlank()) {
                            GlassCard(
                                Modifier.fillMaxWidth(),
                                level = GlassLevel.Thin,
                                onClick = {
                                    busy = true
                                    scope.launch {
                                        val response = runCatching { repo.ask(query.trim(), null) }.getOrNull()
                                        busy = false
                                        when {
                                            response == null -> answer = "John could not reach your workspace."
                                            response.type == "navigate" && response.route != null -> {
                                                onDismiss(); nav.navigate(Routes.resolve(response.route!!))
                                            }
                                            else -> answer = response.message
                                        }
                                    }
                                },
                            ) {
                                Text(
                                    if (busy) "Asking John…" else "Ask John: \"$query\"",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = colors.accentSoft,
                                )
                            }
                        }

                        answer?.let {
                            Text(it, style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
                        }

                        results?.let { r ->
                            if (r.groups.isEmpty()) {
                                Text(
                                    "Nothing in your workspace matches that.",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = colors.secondary,
                                )
                            } else {
                                r.groups.forEach { group ->
                                    Text(
                                        "${group.type.uppercase()} · ${group.count}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = colors.tertiary,
                                    )
                                    group.results.forEach { hit ->
                                        GlassCard(
                                            Modifier.fillMaxWidth(),
                                            level = GlassLevel.UltraThin,
                                            onClick = { onDismiss(); nav.navigate(Routes.resolve(hit.route)) },
                                        ) {
                                            Text(hit.title, style = MaterialTheme.typography.bodyLarge, color = colors.foreground)
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
