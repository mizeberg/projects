package com.johnai.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.johnai.app.data.Sermon
import com.johnai.app.navigation.AiFocus
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.glass.GlassButton
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.glass.GlassProgressBar
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import kotlinx.coroutines.delay

/** Keeps the screen awake while preaching, and releases it on exit. */
@Composable
private fun KeepScreenOn() {
    val view = LocalView.current
    DisposableEffect(Unit) {
        view.keepScreenOn = true
        onDispose { view.keepScreenOn = false }
    }
}

/**
 * PREACH MODE.
 *
 * Readability beats decoration here: no glass over text, no reflections,
 * no animation. Large type, high contrast, one section at a time.
 */
@Composable
fun PreachModeScreen(sermonId: String) {
    val repo = LocalRepository.current
    val nav = LocalNavigator.current
    var sermon by remember { mutableStateOf<Sermon?>(null) }
    var index by remember { mutableIntStateOf(0) }
    var fontSize by remember { mutableStateOf(26f) }

    KeepScreenOn()

    LaunchedEffect(sermonId) {
        sermon = runCatching { repo.sermon(sermonId) }.getOrNull()
    }

    val s = sermon
    Box(
        Modifier
            .fillMaxSize()
            // Deliberately flat black: maximum contrast under stage lighting.
            .background(Color.Black)
            .safeDrawingPadding()
            .padding(Space.m)
    ) {
        if (s == null) {
            Text("Loading your sermon…", color = Color.White.copy(alpha = 0.7f))
            return@Box
        }
        val sections = s.body.filter { it.text.isNotBlank() }
        Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(Space.s)) {
            Text(
                s.title,
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Medium,
            )
            if (s.passages.isNotEmpty()) {
                Text(s.passages.joinToString(" · "), color = Color(0xFFB9A6F5), fontSize = 15.sp)
            }
            if (sections.isEmpty()) {
                Text(
                    "This sermon has no written sections yet.",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 18.sp,
                )
            } else {
                val current = sections[index.coerceIn(0, sections.lastIndex)]
                Text(
                    current.kind.uppercase(),
                    color = Color.White.copy(alpha = 0.45f),
                    fontSize = 13.sp,
                )
                Box(
                    Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                ) {
                    Text(
                        current.text,
                        color = Color.White,
                        fontSize = fontSize.sp,
                        lineHeight = (fontSize * 1.45f).sp,
                    )
                }
                Text(
                    "Section ${index + 1} of ${sections.size}",
                    color = Color.White.copy(alpha = 0.45f),
                    fontSize = 13.sp,
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(Space.xs), verticalAlignment = Alignment.CenterVertically) {
                GlassButton("Previous", { if (index > 0) index -= 1 })
                GlassButton("Next", { if (index < sections.lastIndex) index += 1 }, emphasised = true)
                GlassButton("A-", { fontSize = (fontSize - 2f).coerceAtLeast(16f) })
                GlassButton("A+", { fontSize = (fontSize + 2f).coerceAtMost(48f) })
                GlassButton("Exit", { nav.popBackStack() })
            }
        }
    }
}

/**
 * FOCUS MODE.
 *
 * One sermon, one section, a timer the pastor chose, and Ask John. Nothing else.
 * No streaks, no scores — this is not a productivity game.
 */
@Composable
fun FocusModeScreen(sermonId: String) {
    val repo = LocalRepository.current
    val nav = LocalNavigator.current
    val colors = JohnTheme.colors

    var sermon by remember { mutableStateOf<Sermon?>(null) }
    var durationMinutes by remember { mutableIntStateOf(0) }
    var remainingSeconds by remember { mutableIntStateOf(0) }
    var draft by remember { mutableStateOf("") }

    LaunchedEffect(sermonId) {
        sermon = runCatching { repo.sermon(sermonId) }.getOrNull()
    }

    LaunchedEffect(durationMinutes) {
        if (durationMinutes <= 0) return@LaunchedEffect
        remainingSeconds = durationMinutes * 60
        while (remainingSeconds > 0) {
            delay(1000)
            remainingSeconds -= 1
        }
    }

    val s = sermon
    Box(
        Modifier
            .fillMaxSize()
            .safeDrawingPadding()
            .imePadding()
            .padding(Space.m)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(Space.m)) {
            Text("FOCUS", style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
            Text(
                s?.title ?: "Focus",
                style = MaterialTheme.typography.displayLarge,
                color = colors.foreground,
            )
            if (s?.passages?.isNotEmpty() == true) {
                Text(s.passages.joinToString(" · "), style = MaterialTheme.typography.bodyLarge, color = colors.accentSoft)
            }

            if (durationMinutes == 0) {
                Text("How long would you like to work?", style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                Row(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                    listOf(30, 60, 90).forEach { minutes ->
                        GlassButton("$minutes min", { durationMinutes = minutes })
                    }
                }
            } else {
                GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin) {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                        Text(
                            "%02d:%02d".format(remainingSeconds / 60, remainingSeconds % 60),
                            style = MaterialTheme.typography.headlineLarge,
                            color = colors.foreground,
                        )
                        GlassProgressBar(
                            value = 1f - (remainingSeconds / (durationMinutes * 60f)),
                            label = "Focus session progress",
                        )
                    }
                }
            }

            s?.readiness?.remaining?.firstOrNull()?.let { next ->
                Text("Next step: $next", style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
            }

            OutlinedTextField(
                value = draft,
                onValueChange = { draft = it },
                label = { Text("Write here, then save it as a note") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 6,
            )

            Row(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                GlassButton("Ask John") {
                    AiFocus.set("sermon", sermonId, "This sermon", screen = "focus")
                    nav.navigate(Routes.AI)
                }
                GlassButton("Exit focus", { nav.popBackStack() })
            }
        }
    }
}
