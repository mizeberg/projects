package com.johnai.app

import com.johnai.app.navigation.Routes
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * The AI and the Ministry Pulse navigate with server-provided route strings.
 * Every one of them must resolve to a real destination in the NavHost.
 */
class RoutesTest {

    @Test
    fun `entity routes keep their identifier`() {
        assertEquals("sermon/abc", Routes.resolve("sermon/abc"))
        assertEquals("event/xyz", Routes.resolve("event/xyz"))
        assertEquals("meeting/m1", Routes.resolve("meeting/m1"))
    }

    @Test
    fun `filtered list routes drop the query and land on the real screen`() {
        assertEquals(Routes.TASKS, Routes.resolve("tasks?filter=overdue"))
        assertEquals(Routes.PRAYER, Routes.resolve("prayer?filter=due"))
    }

    @Test
    fun `singular record routes fall back to their list screen`() {
        assertEquals(Routes.TASKS, Routes.resolve("task/123"))
        assertEquals(Routes.NOTES, Routes.resolve("note/123"))
    }

    @Test
    fun `an unknown route never dead-ends`() {
        assertEquals(Routes.WORK, Routes.resolve("something-we-removed"))
    }
}
