package com.kozmos.components.spinner

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import com.kozmos.components.live
import com.kozmos.components.motion.LocalKozmosAnimatorScale
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The arc turns while the system's animations are on and holds still while
 * they are off. Said through LocalKozmosAnimatorScale: Paparazzi drops a
 * write to Settings.Global, so a test that wrote the setting would draw with
 * animations on whatever it asked for. Read by how often the arc is drawn:
 * a turning arc is redrawn every frame, a still one never.
 */
class KozmosSpinnerMotionTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** How many times the arc is drawn in 20 frames, at animator [scale]. */
    private fun drawsIn20Frames(scale: Float): Int {
        var draws = 0
        var counted = -1
        paparazzi.live(content = {
            MaterialTheme {
                CompositionLocalProvider(LocalKozmosAnimatorScale provides scale) {
                    KozmosSpinner(modifier = Modifier.drawWithContent { draws++; drawContent() })
                }
            }
        }) {
            frames(5)
            val before = draws
            frames(20)
            counted = draws - before
        }
        return counted
    }

    @Test fun theArcTurnsWithAnimationsOnAndHoldsStillWithThemOff() {
        val on = drawsIn20Frames(1f)
        assertTrue("with animations on the arc is not turning: $on draws in 20 frames", on >= 10)
        assertEquals("with animations off the arc is still redrawn", 0, drawsIn20Frames(0f))
    }
}
