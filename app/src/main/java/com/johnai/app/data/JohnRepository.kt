package com.johnai.app.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.encodeToJsonElement
import kotlinx.serialization.json.put

/**
 * Single repository over the John AI domain API.
 *
 * The UI, the command palette, the voice assistant and the AI agent all read and
 * write through this one object, so there is exactly one copy of ministry logic.
 */
class JohnRepository(
    private val sessionStore: SessionStore,
) {
    private val _session = MutableStateFlow<Session?>(null)
    val session: StateFlow<Session?> = _session.asStateFlow()

    val api = JohnApi(tokenProvider = { sessionStore.token() })

    val isSignedIn: Boolean get() = sessionStore.token() != null

    /* ---------------- auth ---------------- */

    suspend fun register(email: String, password: String, displayName: String): Session {
        val res: AuthResponse = api.post("/api/auth/register", JohnApi.credentials(email, password, displayName))
        sessionStore.saveToken(res.token)
        return refreshSession()
    }

    suspend fun signIn(email: String, password: String): Session {
        val res: AuthResponse = api.post("/api/auth/login", JohnApi.credentials(email, password))
        sessionStore.saveToken(res.token)
        return refreshSession()
    }

    suspend fun refreshSession(): Session {
        val s: Session = api.get("/api/me")
        _session.value = s
        return s
    }

    fun signOut() {
        sessionStore.clear()
        _session.value = null
    }

    suspend fun deleteAccount() {
        api.delete<JsonObject>("/api/me", buildJsonObject { put("confirm", true) })
        signOut()
    }

    suspend fun exportData(): String = api.request("GET", "/api/me/export")

    /* ---------------- personalization ---------------- */

    suspend fun updateProfile(patch: JsonObject): Profile {
        val p: Profile = api.patch("/api/me/profile", patch)
        _session.value = _session.value?.copy(profile = p)
        return p
    }

    suspend fun createChurch(name: String, location: String): Church =
        api.post("/api/me/church", buildJsonObject { put("name", name); put("location", location) })

    /* ---------------- home ---------------- */

    suspend fun pulse(dismissed: Set<String> = emptySet()): List<PulseItem> =
        decodeList(PulseItem.serializer(), "/api/home/pulse" + if (dismissed.isEmpty()) "" else "?dismissed=${dismissed.joinToString(",")}")

    suspend fun today(): TodayResponse = api.get("/api/home/today")

    suspend fun continueItems(): List<ContinueItem> = decodeList(ContinueItem.serializer(), "/api/home/continue")

    suspend fun inbox(): Inbox = api.get("/api/home/inbox")

    /* ---------------- sermons ---------------- */

    suspend fun sermons(query: String? = null): List<Sermon> =
        decodeList(Sermon.serializer(), "/api/sermons" + if (query.isNullOrBlank()) "" else "?query=$query")

    suspend fun sermon(id: String): Sermon = api.get("/api/sermons/$id")

    suspend fun createSermon(title: String, preachingDate: String?, passages: List<String>): Sermon =
        api.post("/api/sermons", buildJsonObject {
            put("title", title)
            if (preachingDate != null) put("preachingDate", preachingDate)
            put("passages", api.json.encodeToJsonElement(passages))
        })

    suspend fun updateSermon(id: String, patch: JsonObject): Sermon = api.patch("/api/sermons/$id", patch)

    suspend fun updateSermonBody(id: String, body: List<SermonSection>): Sermon =
        updateSermon(id, buildJsonObject { put("body", api.json.encodeToJsonElement(body)) })

    suspend fun updateChecklist(id: String, checklist: List<ChecklistItem>): Sermon =
        updateSermon(id, buildJsonObject { put("checklist", api.json.encodeToJsonElement(checklist)) })

    /** Returns the snapshot needed to power Undo. */
    suspend fun deleteSermon(id: String): JsonObject = api.delete("/api/sermons/$id")

    suspend fun restoreSermon(snapshot: JsonObject): Sermon =
        api.post("/api/sermons/restore", buildJsonObject { put("snapshot", snapshot) })

    suspend fun sermonIntelligence(id: String): SermonIntelligence = api.get("/api/sermons/$id/intelligence")

    suspend fun sermonMap(id: String): MinistryMap = api.get("/api/sermons/$id/map")

    suspend fun sermonVersions(id: String): List<SermonVersion> =
        decodeList(SermonVersion.serializer(), "/api/sermons/$id/versions")

    suspend fun restoreVersion(sermonId: String, versionId: String): Sermon =
        api.post("/api/sermons/$sermonId/versions/$versionId/restore")

    suspend fun series(): List<Series> = decodeList(Series.serializer(), "/api/series")

    /* ---------------- tasks / notes / prayer / ideas ---------------- */

    suspend fun tasks(): List<Task> = decodeList(Task.serializer(), "/api/tasks")

    suspend fun createTask(title: String, dueAt: String?, category: String = "personal"): Task =
        api.post("/api/tasks", buildJsonObject {
            put("title", title); put("category", category)
            if (dueAt != null) put("dueAt", dueAt)
        })

    suspend fun setTaskStatus(id: String, status: String): Task =
        api.patch("/api/tasks/$id", buildJsonObject { put("status", status) })

    suspend fun deleteTask(id: String): JsonObject = api.delete("/api/tasks/$id")

    suspend fun notes(): List<Note> = decodeList(Note.serializer(), "/api/notes")

    suspend fun createNote(title: String, body: String, linkedType: String = "", linkedId: String = ""): Note =
        api.post("/api/notes", buildJsonObject {
            put("title", title); put("body", body)
            put("linkedType", linkedType); put("linkedId", linkedId)
        })

    suspend fun updateNote(id: String, patch: JsonObject): Note = api.patch("/api/notes/$id", patch)

    suspend fun prayer(): List<PrayerRequest> = decodeList(PrayerRequest.serializer(), "/api/prayer")

    suspend fun createPrayer(title: String, person: String, followUpAt: String?): PrayerRequest =
        api.post("/api/prayer", buildJsonObject {
            put("title", title); put("person", person)
            if (followUpAt != null) put("followUpAt", followUpAt)
        })

    suspend fun setPrayerStatus(id: String, status: String): PrayerRequest =
        api.patch("/api/prayer/$id", buildJsonObject { put("status", status) })

    suspend fun ideas(): List<Idea> = decodeList(Idea.serializer(), "/api/ideas")

    suspend fun captureIdea(text: String, source: String = "text"): Idea =
        api.post("/api/ideas", buildJsonObject { put("text", text); put("source", source) })

    /* ---------------- events / meetings ---------------- */

    suspend fun events(): List<MinistryEvent> = decodeList(MinistryEvent.serializer(), "/api/events")

    suspend fun createEvent(name: String, startsAt: String?): MinistryEvent =
        api.post("/api/events", buildJsonObject {
            put("name", name); if (startsAt != null) put("startsAt", startsAt)
        })

    suspend fun finances(eventId: String): EventFinances = api.get("/api/events/$eventId/finances")

    suspend fun addLedgerEntry(eventId: String, kind: String, name: String, amount: Double): EventFinances =
        api.post("/api/events/$eventId/finances", buildJsonObject {
            put("kind", kind); put("name", name); put("amount", amount)
        })

    suspend fun meetings(): List<Meeting> = decodeList(Meeting.serializer(), "/api/meetings")

    suspend fun createMeeting(title: String, startsAt: String?): Meeting =
        api.post("/api/meetings", buildJsonObject {
            put("title", title); if (startsAt != null) put("startsAt", startsAt)
        })

    suspend fun updateMeeting(id: String, patch: JsonObject): Meeting = api.patch("/api/meetings/$id", patch)

    suspend fun proposedActionItems(meetingId: String): MeetingActionItems =
        api.get("/api/meetings/$meetingId/action-items")

    /** Only ever called after the pastor reviews and confirms the proposals. */
    suspend fun confirmActionItems(meetingId: String, proposals: List<MeetingProposal>): List<Task> {
        val body = buildJsonObject {
            put("confirm", true)
            put("proposals", api.json.encodeToJsonElement(proposals))
        }
        val text = api.request("POST", "/api/meetings/$meetingId/action-items", body)
        return api.json.decodeFromString(ListSerializer(Task.serializer()), text)
    }

    /* ---------------- progress / search ---------------- */

    suspend fun progress(): Progress = api.get("/api/progress")

    suspend fun workload(): Workload = api.get("/api/workload")

    suspend fun search(query: String): SearchResults = api.get("/api/search?q=$query")

    /* ---------------- AI ---------------- */

    suspend fun ask(message: String, context: AiRequestContext?): AiResponse =
        api.post("/api/ai/ask", buildJsonObject {
            put("message", message)
            if (context != null) put("context", api.json.encodeToJsonElement(context))
        })

    suspend fun executeConfirmed(tool: String, args: JsonObject?): AiResponse =
        api.post("/api/ai/execute", buildJsonObject {
            put("tool", tool); put("confirm", true)
            if (args != null) put("args", args)
        })

    suspend fun conversation(): List<AiMessage> = decodeList(AiMessage.serializer(), "/api/ai/conversation")

    suspend fun clearConversation(): JsonObject = api.delete("/api/ai/conversation")

    suspend fun suggestions(screen: String?, entityType: String?): List<String> {
        val q = buildString {
            append("/api/ai/suggestions")
            val parts = buildList {
                if (screen != null) add("screen=$screen")
                if (entityType != null) add("entityType=$entityType")
            }
            if (parts.isNotEmpty()) append("?").append(parts.joinToString("&"))
        }
        val text = api.request("GET", q)
        return api.json.decodeFromString(ListSerializer(String.serializer()), text)
    }

    suspend fun skills(): List<Skill> = decodeList(Skill.serializer(), "/api/ai/skills")

    suspend fun memory(): List<MemoryItem> = decodeList(MemoryItem.serializer(), "/api/ai/memory")

    suspend fun setMemoryEnabled(id: String, enabled: Boolean): MemoryItem =
        api.patch("/api/ai/memory/$id", buildJsonObject { put("enabled", enabled) })

    suspend fun deleteMemory(id: String): JsonObject = api.delete("/api/ai/memory/$id")

    suspend fun clearMemory(): JsonObject = api.delete("/api/ai/memory")

    /* ---------------- internals ---------------- */

    private suspend fun <T> decodeList(
        serializer: kotlinx.serialization.KSerializer<T>,
        path: String,
    ): List<T> = api.json.decodeFromString(ListSerializer(serializer), api.request("GET", path))
}

/** The minimum context John is allowed to use for a request. */
@kotlinx.serialization.Serializable
data class AiRequestContext(
    val screen: String? = null,
    val entityType: String? = null,
    val entityId: String? = null,
)
