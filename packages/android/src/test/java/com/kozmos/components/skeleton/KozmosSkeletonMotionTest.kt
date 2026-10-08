package com.kozmos.components.skeleton

import androidx.compose.foundation.layout.size
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kozmos.components.live
import com.kozmos.components.motion.LocalKozmosAnimatorScale
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The sheen passes while the system's animations are on and holds still
 * while they are off. Said through LocalKozmosAnimatorScale: Paparazzi drops
 * a write to Settings.Global, so a test that wrote the setting would draw
 * with animations on whatever it asked for. The sheen's place is read where
 * the placeholder is composed, so a passing sheen recomposes it every frame
 * and a still one never does.
 */
class KozmosSkeletonMotionTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** How many times the placeholder recomposes in 20 frames, at animator [scale]. */
    private fun recompositionsIn20Frames(scale: Float): Long {
        var counted = -1L
        paparazzi.live(content = {
            KozmosMaterialTheme {
                CompositionLocalProvider(LocalKozmosAnimatorScale provides scale) {
                    KozmosSkeleton(modifier = Modifier.size(120.dp, 16.dp))
                }
            }
        }) {
            frames(5)
            val before = recompositions
            frames(20)
            counted = recompositions - before
        }
        return counted
    }

    @Test fun theSheenPassesWithAnimationsOnAndHoldsStillWithThemOff() {
        val on = recompositionsIn20Frames(1f)
        assertTrue("with animations on the sheen is not passing: $on recompositions in 20 frames", on >= 10)
        assertEquals("with animations off the sheen still moves", 0L, recompositionsIn20Frames(0f))
    }
}
