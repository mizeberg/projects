package com.johnai.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.navigation.Routes
import com.johnai.app.ui.components.ErrorState
import com.johnai.app.ui.glass.GlassButton
import com.johnai.app.ui.glass.GlassCard
import com.johnai.app.ui.glass.GlassProgressBar
import com.johnai.app.ui.theme.GlassLevel
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.addJsonArray
import kotlinx.serialization.json.add

private val ROLES = listOf(
    "senior_pastor" to "Senior pastor", "associate_pastor" to "Associate pastor",
    "assistant_pastor" to "Assistant pastor", "youth_pastor" to "Youth pastor",
    "children_pastor" to "Children's pastor", "worship_pastor" to "Worship pastor",
    "teaching_pastor" to "Teaching pastor", "campus_pastor" to "Campus pastor",
    "church_planter" to "Church planter", "missionary" to "Missionary",
    "ministry_leader" to "Ministry leader", "bivocational" to "Bivocational pastor",
)

private val MINISTRY_AREAS = listOf(
    "preaching", "teaching", "pastoral care", "counselling", "youth", "children",
    "worship", "administration", "leadership", "outreach", "missions",
    "discipleship", "small groups", "prayer", "events",
)

private val WORKFLOWS = listOf(
    "notes_first" to "Notes first", "bible_study_first" to "Bible study first",
    "outline_first" to "Outline first", "research_first" to "Research first",
    "ai_assisted" to "AI assisted", "mixed" to "A mix, it varies",
)

/**
 * Progressive onboarding. Nothing here is mandatory beyond a name — John must
 * never assume a denomination, a church size, a translation or a rhythm.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OnboardingScreen() {
    val repo = LocalRepository.current
    val nav = LocalNavigator.current
    val scope = rememberCoroutineScope()
    val colors = JohnTheme.colors

    var step by remember { mutableStateOf(0) }
    var preferredName by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("") }
    var churchName by remember { mutableStateOf("") }
    var churchLocation by remember { mutableStateOf("") }
    var translationInput by remember { mutableStateOf("") }
    val translations = remember { mutableStateListOf<String>() }
    val areas = remember { mutableStateListOf<String>() }
    var workflow by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    val totalSteps = 6

    fun finish() {
        busy = true
        scope.launch {
            try {
                if (churchName.isNotBlank()) repo.createChurch(churchName.trim(), churchLocation.trim())
                repo.updateProfile(
                    buildJsonObject {
                        put("preferredName", preferredName.trim())
                        put("role", role)
                        put("sermonWorkflow", workflow)
                        put("timeZone", java.util.TimeZone.getDefault().id)
                        addJsonArray("bibleTranslations") { translations.forEach { add(it) } }
                        addJsonArray("ministryAreas") { areas.forEach { add(it) } }
                        put("onboardingComplete", true)
                    }
                )
                nav.navigate(Routes.HOME) { popUpTo(Routes.ONBOARDING) { inclusive = true } }
            } catch (e: Exception) {
                error = "John could not save your setup. Please try again."
            } finally {
                busy = false
            }
        }
    }

    Box(
        Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(Space.m)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(Space.m)) {
            GlassProgressBar(value = (step + 1) / totalSteps.toFloat(), label = "Setup step ${step + 1} of $totalSteps")

            when (step) {
                0 -> StepCard("Welcome to John AI", "Your ministry, organized around you. This takes a minute, and you can change anything later.") {
                    OutlinedTextField(
                        value = preferredName,
                        onValueChange = { preferredName = it },
                        label = { Text("What should we call you?") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }

                1 -> StepCard("Your ministry role", "This shapes what John puts first — nothing else.") {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                        ROLES.forEach { (id, label) ->
                            SelectChip(label, role == id) { role = if (role == id) "" else id }
                        }
                    }
                }

                2 -> StepCard("Your church", "All optional. Leave anything blank and John will simply not refer to it.") {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
                        OutlinedTextField(
                            value = churchName, onValueChange = { churchName = it },
                            label = { Text("Church name") }, singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        OutlinedTextField(
                            value = churchLocation, onValueChange = { churchLocation = it },
                            label = { Text("Location") }, singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }

                3 -> StepCard("Bible translations", "Add the translations you actually preach and study from.") {
                    Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
                        OutlinedTextField(
                            value = translationInput,
                            onValueChange = { translationInput = it },
                            label = { Text("Add a translation") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        GlassButton("Add", {
                            if (translationInput.isNotBlank()) {
                                translations.add(translationInput.trim()); translationInput = ""
                            }
                        })
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                            translations.forEach { t ->
                                SelectChip(t, true) { translations.remove(t) }
                            }
                        }
                    }
                }

                4 -> StepCard("Ministry responsibilities", "Choose what you actually carry.") {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                        MINISTRY_AREAS.forEach { area ->
                            SelectChip(area.replaceFirstChar { it.uppercase() }, areas.contains(area)) {
                                if (areas.contains(area)) areas.remove(area) else areas.add(area)
                            }
                        }
                    }
                }

                else -> StepCard("How do you prepare sermons?", "John uses this only to draft an editable preparation timeline.") {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                        WORKFLOWS.forEach { (id, label) ->
                            SelectChip(label, workflow == id) { workflow = if (workflow == id) "" else id }
                        }
                    }
                }
            }

            error?.let { ErrorState(it) }

            Row(horizontalArrangement = Arrangement.spacedBy(Space.xs)) {
                if (step > 0) TextButton(onClick = { step -= 1 }) { Text("Back", color = colors.secondary) }
                GlassButton(
                    text = if (step == totalSteps - 1) "Enter my workspace" else "Continue",
                    onClick = { if (step == totalSteps - 1) finish() else step += 1 },
                    enabled = !busy && (step != 0 || preferredName.isNotBlank()),
                    emphasised = true,
                )
            }
        }
    }
}

@Composable
private fun StepCard(title: String, body: String, content: @Composable () -> Unit) {
    val colors = JohnTheme.colors
    Column(verticalArrangement = Arrangement.spacedBy(Space.s)) {
        Text(title, style = MaterialTheme.typography.displayLarge, color = colors.foreground)
        Text(body, style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
        GlassCard(Modifier.fillMaxWidth(), level = GlassLevel.Regular) { content() }
    }
}

@Composable
private fun SelectChip(label: String, selected: Boolean, onClick: () -> Unit) {
    GlassCard(
        level = if (selected) GlassLevel.Thick else GlassLevel.UltraThin,
        selected = selected,
        onClick = onClick,
        contentPadding = androidx.compose.foundation.layout.PaddingValues(
            horizontal = Space.s, vertical = Space.xs,
        ),
    ) {
        Text(
            label,
            style = MaterialTheme.typography.labelLarge,
            color = if (selected) JohnTheme.colors.foreground else JohnTheme.colors.secondary,
        )
    }
}
