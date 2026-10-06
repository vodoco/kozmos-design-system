package com.kozmos.components.container

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/** GAP-134: React's Container pads the sides only, by `inset`; Compose's padded every side. */
class KozmosContainerInsetTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun windowInsetStepsWithTheWidthAndPanelKeepsSixteen() {
        assertEquals(16.dp, KozmosContainerInset.Window.padding(390.dp))
        assertEquals(16.dp, KozmosContainerInset.Window.padding(639.dp))
        assertEquals(24.dp, KozmosContainerInset.Window.padding(640.dp))
        assertEquals(24.dp, KozmosContainerInset.Window.padding(1023.dp))
        assertEquals(32.dp, KozmosContainerInset.Window.padding(1024.dp))
        for (width in listOf(390.dp, 800.dp, 1280.dp)) assertEquals(16.dp, KozmosContainerInset.Panel.padding(width))
    }

    @Test fun panelInsetPadsTheSidesOnly() = probe(KozmosContainerInset.Panel, side = 16f, top = 0f)
    @Test fun windowInsetPadsTheSidesOnly() = probe(KozmosContainerInset.Window, side = 16f, top = 0f)
    @Test fun theDefaultStillPadsEverySide() = probe(null, side = 16f, top = 16f)

    private fun probe(inset: KozmosContainerInset?, side: Float, top: Float) {
        var density = 1f
        val tree = paparazzi.readSemantics {
            density = LocalDensity.current.density
            Box(Modifier.width(360.dp)) {
                val probe = @androidx.compose.runtime.Composable {
                    Box(Modifier.fillMaxWidth().height(40.dp).semantics { contentDescription = "probe" })
                }
                if (inset == null) KozmosContainer { probe() } else KozmosContainer(inset) { probe() }
            }
        }
        val probe = tree.named("probe").frame
        val state = "$inset"
        assertEquals(state, side, probe.left / density, 1f)
        assertEquals(state, side, (360f * density - probe.right) / density, 1f)
        assertEquals(state, top, probe.top / density, 1f)
        assertTrue(state, probe.width > 0f)
    }
}
