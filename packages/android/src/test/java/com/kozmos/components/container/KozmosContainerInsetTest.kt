package com.kozmos.components.container

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.requiredWidth
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
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

    // Drawn at 360, 800 and 1100 wide, as KozmosContainerInsetTests draws them on iOS.
    @Test fun panelInsetPadsTheSidesOnlyAtEveryWidth() {
        for (width in listOf(360.dp, 800.dp, 1100.dp)) probe(KozmosContainerInset.Panel, width, side = 16f, top = 0f)
    }

    @Test fun windowInsetStepsWithItsOwnWidth() {
        probe(KozmosContainerInset.Window, 360.dp, side = 16f, top = 0f)
        probe(KozmosContainerInset.Window, 800.dp, side = 24f, top = 0f)
        probe(KozmosContainerInset.Window, 1100.dp, side = 32f, top = 0f)
    }

    @Test fun theDefaultStillPadsEverySide() = probe(null, 360.dp, side = 16f, top = 16f)

    /**
     * A row that matches its children's heights asks each for its intrinsic
     * height before measuring it. The container answered from a
     * BoxWithConstraints, which is a SubcomposeLayout and throws there.
     */
    @Test fun insetAnswersARowThatMatchesHeights() {
        var density = 1f
        val tree = paparazzi.readSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Row(Modifier.requiredWidth(808.dp).height(IntrinsicSize.Min).semantics { contentDescription = "row" }) {
                    KozmosContainer(KozmosContainerInset.Window, Modifier.weight(1f).semantics { contentDescription = "container" }) {
                        Box(Modifier.fillMaxWidth().height(40.dp).semantics { contentDescription = "probe" })
                    }
                    Box(Modifier.width(8.dp).fillMaxHeight().semantics { contentDescription = "rule" })
                }
            }
        }
        val container = tree.named("container").frame
        val probe = tree.named("probe").frame
        assertEquals(40f, tree.named("row").frame.height / density, 1f)
        assertEquals(40f, tree.named("rule").frame.height / density, 1f)
        // 800 wide, so the window's middle step.
        assertEquals(24f, (probe.left - container.left) / density, 1f)
        assertEquals(24f, (container.right - probe.right) / density, 1f)
    }

    /**
     * A column as wide as its widest child asks each for its intrinsic width:
     * the container's is its content's and the step that width lands on, so
     * 200 takes 16 a side and 700, past 640 once padded, takes 24.
     */
    @Test fun insetAnswersAColumnAsWideAsItsWidestChild() {
        for ((content, side) in listOf(200.dp to 16f, 700.dp to 24f)) {
            var density = 1f
            val tree = paparazzi.readSemantics {
                density = LocalDensity.current.density
                KozmosMaterialTheme {
                    Column(Modifier.requiredWidth(IntrinsicSize.Max).semantics { contentDescription = "column" }) {
                        KozmosContainer(KozmosContainerInset.Window) {
                            Box(Modifier.width(content).height(40.dp).semantics { contentDescription = "probe" })
                        }
                    }
                }
            }
            val column = tree.named("column").frame
            val probe = tree.named("probe").frame
            val state = "$content of content"
            assertEquals(state, content.value + 2 * side, column.width / density, 1f)
            assertEquals(state, side, (probe.left - column.left) / density, 1f)
            assertEquals(state, content.value, probe.width / density, 1f)
        }
    }

    private fun probe(inset: KozmosContainerInset?, width: Dp, side: Float, top: Float) {
        var density = 1f
        val tree = paparazzi.readSemantics {
            density = LocalDensity.current.density
            // requiredWidth, so the container is this wide whatever the window is.
            val modifier = Modifier.requiredWidth(width).semantics { contentDescription = "container" }
            val probe = @Composable {
                Box(Modifier.fillMaxWidth().height(40.dp).semantics { contentDescription = "probe" })
            }
            KozmosMaterialTheme {
                if (inset == null) KozmosContainer(modifier) { probe() } else KozmosContainer(inset, modifier) { probe() }
            }
        }
        val container = tree.named("container").frame
        val probe = tree.named("probe").frame
        val state = "$inset at $width"
        assertEquals(state, width.value, container.width / density, 1f)
        assertEquals(state, side, (probe.left - container.left) / density, 1f)
        assertEquals(state, side, (container.right - probe.right) / density, 1f)
        assertEquals(state, top, (probe.top - container.top) / density, 1f)
        assertTrue(state, probe.width > 0f)
    }
}
