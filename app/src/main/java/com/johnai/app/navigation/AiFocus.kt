package com.johnai.app.navigation

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.johnai.app.data.AiRequestContext

/**
 * The entity John is currently focused on.
 *
 * "Ask John" from anywhere in the app sets this, so a question asked while
 * viewing a sermon or an event is answered against that record — and only that
 * record. The pastor can always clear it from the AI screen.
 */
object AiFocus {
    var context by mutableStateOf<AiRequestContext?>(null)
        private set

    var label by mutableStateOf<String?>(null)
        private set

    fun set(entityType: String?, entityId: String?, label: String?, screen: String? = null) {
        context = AiRequestContext(screen = screen, entityType = entityType, entityId = entityId)
        this.label = label
    }

    fun clear() {
        context = null
        label = null
    }
}
