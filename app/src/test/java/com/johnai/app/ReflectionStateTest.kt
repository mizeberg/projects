package com.johnai.app

import com.johnai.app.ui.glass.ReflectionState
import com.johnai.app.ui.theme.Reflection
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ReflectionStateTest {

    @Test
    fun `reflection sits at idle until the surface moves`() {
        val state = ReflectionState(enabled = true)
        assertEquals(Reflection.IDLE, state.intensity, 0.0001f)
    }

    @Test
    fun `faster scrolling raises intensity but never past the budget`() {
        val slow = ReflectionState(enabled = true).apply { repeat(10) { onScroll(6f) } }
        val fast = ReflectionState(enabled = true).apply { repeat(10) { onScroll(400f) } }

        assertTrue("slow scrolling stays subtle", slow.intensity < Reflection.NORMAL_MAX)
        assertTrue("fast scrolling is stronger", fast.intensity > slow.intensity)
        assertTrue("never exceeds the documented maximum", fast.intensity <= Reflection.FAST_MAX + 0.0001f)
    }

    @Test
    fun `reflection decays back to idle once motion stops - it does not loop`() {
        val state = ReflectionState(enabled = true)
        repeat(10) { state.onScroll(200f) }
        repeat(400) { state.settle() }

        assertEquals(Reflection.IDLE, state.intensity, 0.001f)
        assertEquals(0f, state.velocity, 0.001f)
    }

    @Test
    fun `fast scrolling asks the glass to simplify expensive effects`() {
        val state = ReflectionState(enabled = true)
        state.onScroll(300f)
        assertTrue(state.simplifyEffects)
        repeat(100) { state.settle() }
        assertTrue(!state.simplifyEffects)
    }

    @Test
    fun `reduced motion disables reflection entirely`() {
        val state = ReflectionState(enabled = false)
        repeat(10) { state.onScroll(400f) }
        assertEquals(Reflection.IDLE, state.intensity, 0.0001f)
    }
}
