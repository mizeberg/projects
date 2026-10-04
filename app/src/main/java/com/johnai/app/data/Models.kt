package com.johnai.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class AuthResponse(val token: String, val user: User)

@Serializable
data class User(val id: String, val email: String, val displayName: String = "")

@Serializable
data class Profile(
    val userId: String = "",
    val preferredName: String = "",
    val role: String = "",
    val churchId: String? = null,
    val timeZone: String = "UTC",
    val language: String = "en",
    val bibleTranslations: List<String> = emptyList(),
    val ministryAreas: List<String> = emptyList(),
    val sermonWorkflow: String = "",
    val writingStyle: String = "",
    val aiTone: String = "calm",
    val aiResponseLength: String = "medium",
    val proactiveAi: Boolean = true,
    val homeSections: List<String> = emptyList(),
    val onboardingComplete: Boolean = false,
)

@Serializable
data class Session(val user: User, val profile: Profile? = null)

@Serializable
data class Church(val id: String = "", val name: String = "", val location: String = "")

/* -------- home -------- */

@Serializable
data class PulseSource(val type: String, val id: String, val title: String = "")

@Serializable
data class PulseItem(
    val id: String,
    val category: String,
    val title: String,
    val subtitle: String = "",
    val detail: String = "",
    val route: String = "",
    /** The plain-language rule that caused this item to surface. */
    val rule: String = "",
    val sources: List<PulseSource> = emptyList(),
)

@Serializable
data class TodayItem(val id: String, val title: String, val at: String? = null, val kind: String)

@Serializable
data class TodayResponse(val date: String = "", val items: List<TodayItem> = emptyList())

@Serializable
data class ContinueItem(
    val type: String,
    val id: String,
    val title: String,
    val position: String = "",
    val at: String = "",
    val route: String = "",
)

@Serializable
data class InboxEntry(val type: String, val id: String, val title: String, val route: String = "")

@Serializable
data class Inbox(val actions: List<InboxEntry> = emptyList(), val information: List<InboxEntry> = emptyList())

/* -------- sermons -------- */

@Serializable
data class ChecklistItem(val id: String, val label: String, val done: Boolean = false)

@Serializable
data class TimelineStep(val id: String, val label: String, val date: String = "", val done: Boolean = false)

@Serializable
data class SermonSection(
    val id: String,
    val kind: String,
    val text: String = "",
    /** "user" or "ai" — AI content is always visually distinguished and never silent. */
    val author: String = "user",
)

@Serializable
data class Readiness(
    val percent: Int = 0,
    val done: Int = 0,
    val total: Int = 0,
    val remaining: List<String> = emptyList(),
)

@Serializable
data class Sermon(
    val id: String,
    val title: String,
    val subtitle: String = "",
    val keyIdea: String = "",
    val seriesId: String? = null,
    val passages: List<String> = emptyList(),
    val tags: List<String> = emptyList(),
    val status: String = "IDEA",
    val preachingDate: String? = null,
    val service: String = "",
    val body: List<SermonSection> = emptyList(),
    val checklist: List<ChecklistItem> = emptyList(),
    val timeline: List<TimelineStep> = emptyList(),
    val lastPosition: String = "",
    val visibility: String = "private",
    val updatedAt: String = "",
    val readiness: Readiness = Readiness(),
)

@Serializable
data class SermonCounts(
    val bibleReferences: Int = 0,
    val sections: Int = 0,
    val mainPoints: Int = 0,
    val illustrations: Int = 0,
    val applications: Int = 0,
    val linkedNotes: Int = 0,
    val linkedTasks: Int = 0,
    val openTasks: Int = 0,
)

@Serializable
data class Observation(val text: String, val source: JsonElement? = null)

@Serializable
data class SermonIntelligence(
    val sermonId: String = "",
    val counts: SermonCounts = SermonCounts(),
    val readiness: Readiness = Readiness(),
    val observations: List<Observation> = emptyList(),
)

@Serializable
data class SermonVersion(val id: String, val label: String = "", val createdAt: String = "")

@Serializable
data class SeriesSermon(val id: String, val title: String, val status: String = "", val preachingDate: String? = null)

@Serializable
data class Series(
    val id: String,
    val title: String,
    val description: String = "",
    val sermons: List<SeriesSermon> = emptyList(),
)

/* -------- other entities -------- */

@Serializable
data class Task(
    val id: String,
    val title: String,
    val description: String = "",
    val category: String = "personal",
    val priority: String = "normal",
    val status: String = "TODO",
    val dueAt: String? = null,
    val linkedType: String = "",
    val linkedId: String = "",
)

@Serializable
data class Note(
    val id: String,
    val title: String,
    val body: String = "",
    val kind: String = "general",
    val tags: List<String> = emptyList(),
    val favorite: Boolean = false,
    val linkedType: String = "",
    val linkedId: String = "",
    val updatedAt: String = "",
)

@Serializable
data class PrayerRequest(
    val id: String,
    val title: String,
    val person: String = "",
    val request: String = "",
    val category: String = "",
    val status: String = "NEW",
    val followUpAt: String? = null,
    val notes: String = "",
)

@Serializable
data class MinistryEvent(
    val id: String,
    val name: String,
    val description: String = "",
    val venue: String = "",
    val startsAt: String? = null,
    val endsAt: String? = null,
    val collectedTarget: Double = 0.0,
)

@Serializable
data class LedgerEntry(
    val id: String,
    val kind: String,
    val name: String,
    val category: String = "",
    val amount: Double = 0.0,
    val vendor: String = "",
    val occurredAt: String = "",
)

@Serializable
data class EventFinances(
    val eventId: String = "",
    val entries: List<LedgerEntry> = emptyList(),
    val totalCollected: Double = 0.0,
    val totalSpent: Double = 0.0,
    val balance: Double = 0.0,
)

@Serializable
data class Meeting(
    val id: String,
    val title: String,
    val startsAt: String? = null,
    val location: String = "",
    val participants: List<String> = emptyList(),
    val agenda: String = "",
    val notes: String = "",
)

@Serializable
data class MeetingProposal(
    val title: String,
    val category: String = "meeting",
    val linkedType: String = "meeting",
    val linkedId: String = "",
    val sourceLine: String = "",
)

@Serializable
data class MeetingActionItems(
    val meetingId: String = "",
    val proposals: List<MeetingProposal> = emptyList(),
    val requiresConfirmation: Boolean = true,
)

@Serializable
data class Idea(val id: String, val text: String, val source: String = "text", val createdAt: String = "")

/* -------- progress -------- */

@Serializable
data class SermonProgress(val total: Int = 0, val preached: Int = 0, val ready: Int = 0)

@Serializable
data class TaskProgress(val total: Int = 0, val completed: Int = 0, val percent: Int? = null)

@Serializable
data class PrayerProgress(val open: Int = 0, val answered: Int = 0)

@Serializable
data class EventProgress(val upcoming: Int = 0)

@Serializable
data class CountOnly(val total: Int = 0)

@Serializable
data class Goal(
    val id: String,
    val title: String,
    val category: String = "",
    val metric: String = "manual",
    val target: Double = 0.0,
    val current: Double = 0.0,
)

@Serializable
data class Progress(
    val sermons: SermonProgress = SermonProgress(),
    val tasks: TaskProgress = TaskProgress(),
    val prayer: PrayerProgress = PrayerProgress(),
    val events: EventProgress = EventProgress(),
    val notes: CountOnly = CountOnly(),
    val ideas: CountOnly = CountOnly(),
    val goals: List<Goal> = emptyList(),
)

@Serializable
data class WorkloadDay(
    val date: String,
    val task: Int = 0,
    val meeting: Int = 0,
    val event: Int = 0,
    val sermon: Int = 0,
    val total: Int = 0,
)

@Serializable
data class Workload(val days: List<WorkloadDay> = emptyList(), val observation: String? = null)

/* -------- search + map -------- */

@Serializable
data class SearchHit(val id: String, val title: String = "", val status: String = "", val route: String = "")

@Serializable
data class SearchGroup(val type: String, val count: Int = 0, val results: List<SearchHit> = emptyList())

@Serializable
data class SearchResults(val query: String = "", val groups: List<SearchGroup> = emptyList())

@Serializable
data class MapNode(val type: String, val id: String, val title: String = "")

@Serializable
data class MapEdge(val from: MapNode, val to: MapNode, val label: String = "")

@Serializable
data class MinistryMap(val root: MapNode, val edges: List<MapEdge> = emptyList())

/* -------- AI -------- */

@Serializable
data class AiContextSource(val type: String, val id: String, val title: String = "")

@Serializable
data class AiContext(
    val screen: String? = null,
    val used: List<AiContextSource> = emptyList(),
)

@Serializable
data class ActionCard(
    val tool: String,
    val mode: String,
    val title: String,
    val args: JsonElement? = null,
    val confirmLabel: String = "Confirm",
)

@Serializable
data class AiResponse(
    /** answer | confirm | clarify | navigate | denied */
    val type: String,
    val message: String = "",
    val tool: String? = null,
    val route: String? = null,
    val card: ActionCard? = null,
    val context: AiContext = AiContext(),
    val sources: List<AiContextSource> = emptyList(),
)

@Serializable
data class AiMessage(
    val id: String,
    val role: String,
    val content: String,
    val createdAt: String = "",
    val sources: List<AiContextSource> = emptyList(),
)

@Serializable
data class MemoryItem(
    val id: String,
    val content: String,
    val source: String = "user",
    val enabled: Boolean = true,
    val createdAt: String = "",
)

@Serializable
data class Skill(val id: String, val name: String, val tools: List<String> = emptyList())

@Serializable
data class ApiError(val error: String = "", val message: String = "")
