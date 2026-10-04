package com.johnai.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.ui.Modifier
import com.johnai.app.data.SermonSection
import com.johnai.app.navigation.AiFocus
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.glass.GlassButton
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.UUID

private val SECTION_KINDS = listOf(
    "introduction", "point", "subpoint", "illustration",
    "application", "conclusion", "prayer", "note",
)

/**
 * Structured sermon editor.
 *
 * Sections are typed, so Sermon Intelligence can count real points,
 * illustrations and applications instead of guessing from prose. Every section
 * records its author: AI-assisted text is labelled and never silently replaces
 * what the pastor wrote.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SermonEditorScreen(sermonId: String) {
    val repo = LocalRepository.current
    val nav = LocalNavigator.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors

    val sections = remember { mutableStateListOf<SermonSection>() }
    var loaded by remember { mutableStateOf(false) }
    var title by remember { mutableStateOf("") }
    var dirty by remember { mutableStateOf(false) }
    var savedAt by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(sermonId) {
        runCatching { repo.sermon(sermonId) }
            .onSuccess {
                title = it.title
                sections.clear()
                sections.addAll(it.body)
                loaded = true
            }
            .onFailure { error = "John could not open this sermon." }
    }

    // Autosave: debounced, version-snapshotted on the server, never destructive.
    LaunchedEffect(dirty) {
        if (!dirty) return@LaunchedEffect
        delay(1200)
        runCatching { repo.updateSermonBody(sermonId, sections.toList()) }
            .onSuccess { savedAt = "Saved"; dirty = false }
            .onFailure { error = "John could not save that change. Your text is still here — try again." }
    }

    JohnScreen(
        title = title.ifBlank { "Sermon" },
        subtitle = when {
            error != null -> error
            dirty -> "Saving…"
            savedAt != null -> "All changes saved"
            else -> null
        },
        showBack = true,
    ) {
        if (!loaded) {
            item { com.johnai.app.ui.components.SkeletonList(4) }
            return@JohnScreen
        }

        itemsIndexedSections(sections) { index, section ->
            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Thin) {
                Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                        Text(
                            section.kind.uppercase(),
                            style = MaterialTheme.typography.labelSmall,
                            color = colors.accentSoft,
                        )
                        if (section.author == "ai") {
                            Text(
                                "AI DRAFT — REVIEW BEFORE USING",
                                style = MaterialTheme.typography.labelSmall,
                                color = colors.warning,
                            )
                        }
                    }
                    OutlinedTextField(
                        value = section.text,
                        onValueChange = {
                            sections[index] = section.copy(text = it)
                            dirty = true
                        },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                        GlassButton("Remove") {
                            sections.removeAt(index)
                            dirty = true
                        }
                        GlassButton("Ask John") {
                            AiFocus.set("sermon", sermonId, "This sermon", screen = "sermon-editor")
                            nav.navigate(Routes.AI)
                        }
                    }
                }
            }
        }

        item {
            GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.UltraThin) {
                Column(verticalArrangement = Arrangement.spacedBy(Space.xs)) {
                    Text("ADD SECTION", style = MaterialTheme.typography.labelSmall, color = colors.tertiary)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                        SECTION_KINDS.forEach { kind ->
                            GlassButton(kind.replaceFirstChar { it.uppercase() }) {
                                sections.add(
                                    SermonSection(
                                        id = UUID.randomUUID().toString(),
                                        kind = kind,
                                        text = "",
                                        author = "user",
                                    )
                                )
                                dirty = true
                            }
                        }
                    }
                }
            }
        }

        item {
            GlassButton("Save now", {
                scope.launch {
                    runCatching { repo.updateSermonBody(sermonId, sections.toList()) }
                        .onSuccess { savedAt = "Saved"; dirty = false }
                        .onFailure { error = "John could not save right now." }
                }
            }, emphasised = true)
        }
    }
}

private fun androidx.compose.foundation.lazy.LazyListScope.itemsIndexedSections(
    sections: List<SermonSection>,
    content: @Composable (Int, SermonSection) -> Unit,
) {
    items(sections.size, key = { sections[it].id }) { index -> content(index, sections[index]) }
}
