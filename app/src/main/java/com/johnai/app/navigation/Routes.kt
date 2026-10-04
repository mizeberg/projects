package com.johnai.app.navigation

/** Real routes. The AI navigates with exactly these — there is no parallel fake router. */
object Routes {
    const val SPLASH = "splash"
    const val AUTH = "auth"
    const val ONBOARDING = "onboarding"

    const val HOME = "home"
    const val WORK = "work"
    const val AI = "ai"
    const val PROGRESS = "progress"
    const val PROFILE = "profile"

    const val SERMONS = "sermons"
    const val SERMON = "sermon"
    const val SERMON_EDITOR = "sermon-editor"
    const val PREACH = "preach"
    const val FOCUS = "focus"
    const val TASKS = "tasks"
    const val PRAYER = "prayer"
    const val NOTES = "notes"
    const val CALENDAR = "calendar"
    const val EVENTS = "events"
    const val EVENT = "event"
    const val MEETINGS = "meetings"
    const val MEETING = "meeting"
    const val IDEAS = "ideas"
    const val INBOX = "inbox"
    const val MEMORY = "memory"
    const val TRUST = "trust"
    const val SETTINGS = "settings"

    fun sermon(id: String) = "$SERMON/$id"
    fun sermonEditor(id: String) = "$SERMON_EDITOR/$id"
    fun preach(id: String) = "$PREACH/$id"
    fun focus(id: String) = "$FOCUS/$id"
    fun event(id: String) = "$EVENT/$id"
    fun meeting(id: String) = "$MEETING/$id"

    /**
     * Maps a server-provided route string (used by pulse items and AI navigation)
     * onto a real in-app destination. Unknown routes fall back to the workspace
     * rather than silently doing nothing.
     */
    fun resolve(raw: String): String {
        val clean = raw.substringBefore('?')
        return when {
            clean.startsWith("$SERMON/") -> clean
            clean.startsWith("$EVENT/") -> clean
            clean.startsWith("$MEETING/") -> clean
            clean.startsWith("task") -> TASKS
            clean.startsWith("prayer") -> PRAYER
            clean.startsWith("note") -> NOTES
            clean == SERMONS -> SERMONS
            clean == TASKS || clean == PRAYER || clean == NOTES || clean == CALENDAR ||
                clean == EVENTS || clean == PROGRESS || clean == INBOX -> clean
            else -> WORK
        }
    }
}
