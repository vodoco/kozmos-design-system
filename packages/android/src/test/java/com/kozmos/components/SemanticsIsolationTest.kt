package com.kozmos.components

import androidx.compose.material3.Text
import androidx.compose.runtime.mutableStateOf
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/** Exercise hosts in sequence, including the out-of-frame writes made by logic tests. */
class SemanticsIsolationTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test
    fun settledReadsSurviveAnEarlierCompositionAndAnOutOfFrameWrite() {
        val state = mutableStateOf("before")
        paparazzi.readSemantics { Text(state.value) }
        state.value = "after"
        val result = paparazzi.readSettledSemantics { Text(state.value) }
        assertTrue(result.merged.any { "after" in it.texts })
    }

    @Test
    fun consecutiveLiveHostsHaveIndependentFramesAndState() {
        repeat(3) { index ->
            val state = mutableStateOf("before $index")
            paparazzi.live(content = { Text(state.value) }) {
                assertTrue(read().merged.any { "before $index" in it.texts })
                state.value = "after $index"
                frames(3)
                assertTrue(read().merged.any { "after $index" in it.texts })
            }
        }
    }
}
