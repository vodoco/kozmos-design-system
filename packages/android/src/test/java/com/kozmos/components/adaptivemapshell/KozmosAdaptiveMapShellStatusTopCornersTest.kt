package com.kozmos.components.adaptivemapshell

import android.os.Handler
import android.os.Looper
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSettledSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosMapCollisionInsets
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.android.asCoroutineDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/**
 * GAP-123 (SDK-UI-002, decision 119): the shell's `status` slot and its two
 * top corners, as React's have been since 0.15.0 (#431). The status sits
 * between the bottom corners, level with them, centred on the map, and the
 * credits rise directly above it; with no room it is not drawn, and it never
 * pads the camera. The top corners sit 16 under the top edge at the logical
 * start and end, wrap the end under the start when both do not fit, push the
 * controls column 16 below them, share one named container, and pad the
 * camera's top only when asked. Read from the laid-out bounds, in dp, so
 * nothing here is a golden.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class KozmosAdaptiveMapShellStatusTopCornersTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    @Before fun bindMain() { Dispatchers.setMain(Handler(Looper.getMainLooper()).asCoroutineDispatcher("paparazzi-main")) }
    @After fun resetMain() { Dispatchers.resetMain() }

    private var density = 1f
    private var insets: KozmosMapCollisionInsets? = null

    private fun Box(name: String, width: Int, height: Int) =
        @androidx.compose.runtime.Composable { Box(Modifier.size(width.dp, height.dp).semantics { contentDescription = name }) }

    private fun read(
        status: Boolean = true,
        startWidth: Int = 120,
        controls: Boolean = false,
        padCamera: Boolean = false,
        height: Int = 600,
        direction: LayoutDirection = LayoutDirection.Ltr
    ): ReadSemantics = paparazzi.readSettledSemantics {
        density = LocalDensity.current.density
        CompositionLocalProvider(LocalLayoutDirection provides direction) {
            KozmosMaterialTheme {
                KozmosAdaptiveMapShell(
                    modifier = Modifier.size(360.dp, height.dp),
                    map = {},
                    attribution = Box("Credits", 200, 20),
                    controlsBottomStart = Box("Bottom start", 44, 44),
                    controlsBottomEnd = Box("Bottom end", 44, 44),
                    status = if (status) Box("Status", 160, 32) else null,
                    controlsTopStart = Box("Exit building", startWidth, 44),
                    controlsTopEnd = Box("Map information", 44, 44),
                    controls = if (controls) Box("Locate", 44, 88) else null,
                    topControlsPadCamera = padCamera,
                    onCollisionInsetsChange = { insets = it }
                )
            }
        }
    }

    private fun ReadSemantics.at(name: String) = named(name).bounds.let {
        androidx.compose.ui.geometry.Rect(it.left / density, it.top / density, it.right / density, it.bottom / density)
    }

    @Test fun theStatusSitsLevelWithTheBottomCornersAndTheCreditsRiseAboveIt() {
        val tree = read()
        val status = tree.at("Status")
        val corner = tree.at("Bottom start")
        val credits = tree.at("Credits")
        val map = tree.at("Map")
        assertEquals("level with the corners", corner.bottom, status.bottom, 1f)
        assertEquals("centred on the map", map.center.x, status.center.x, 1f)
        assertEquals("the credits directly above it", 16f, status.top - credits.bottom, 1f)
    }

    @Test fun withoutAStatusTheCreditsRestLevelWithTheCorners() {
        val tree = read(status = false)
        assertEquals(tree.at("Bottom start").bottom, tree.at("Credits").bottom, 1f)
    }

    @Test fun withNoRoomTheStatusIsNotDrawnAndStillRead() {
        // 130 tall: under the top corners the band holds the credits, not the
        // status and the credits, so the credits keep their place 16 above
        // the bottom edge, unraised.
        val tree = read(height = 130)
        assertEquals("the credits were raised by a status with no room", 114f, tree.at("Credits").bottom - tree.at("Map").top, 1f)
        // Still in the tree, so a pill's live region still announces.
        assertTrue(tree.names().contains("Status"))
    }

    /**
     * The camera keeps clear of the credits where they rest without the
     * status, level with the corners: their height and what is under them.
     */
    @Test fun theStatusNeverPadsTheCamera() {
        val tree = read()
        val restingCreditsTop = tree.at("Status").bottom - 20f
        assertEquals("a status moved the camera", (tree.at("Map").bottom - restingCreditsTop).toDouble(), insets!!.bottom, 0.5)
    }

    @Test fun theTopCornersShareARowAtTheStartAndTheEnd() {
        val tree = read()
        val map = tree.at("Map")
        val start = tree.at("Exit building")
        val end = tree.at("Map information")
        assertEquals("16 under the top", 16f, start.top - map.top, 1f)
        assertEquals("the end in the start's row", start.top, end.top, 1f)
        assertEquals("the start at the left", 16f, start.left - map.left, 1f)
        assertEquals("the end at the right", 16f, map.right - end.right, 1f)
    }

    @Test fun rightToLeftTheTopCornersMirror() {
        val tree = read(direction = LayoutDirection.Rtl)
        val map = tree.at("Map")
        assertEquals("the start at the right", 16f, map.right - tree.at("Exit building").right, 1f)
        assertEquals("the end at the left", 16f, tree.at("Map information").left - map.left, 1f)
    }

    @Test fun theEndWrapsUnderTheStart() {
        val tree = read(startWidth = 300)
        val start = tree.at("Exit building")
        val end = tree.at("Map information")
        assertEquals("the end 16 under the start", 16f, end.top - start.bottom, 1f)
        assertEquals("the end keeps its side", 16f, tree.at("Map").right - end.right, 1f)
    }

    @Test fun theControlsColumnStartsBelowTheTopCorners() {
        val tree = read(controls = true)
        assertEquals("16 below the corners", 16f, tree.at("Locate").top - tree.at("Exit building").bottom, 1f)
    }

    @Test fun theTopCornersShareOneNamedContainer() {
        val tree = read()
        assertTrue(tree.names().contains("Map top corner controls"))
        assertTrue(tree.named("Map top corner controls").traversalGroup)
        assertTrue(tree.names().containsAll(listOf("Exit building", "Map information")))
    }

    @Test fun theTopCornersDoNotPadTheCameraUnasked() {
        read()
        assertEquals("unasked, no top inset", 0.0, insets!!.top, 0.5)
    }

    @Test fun askedTheTopCornersPadTheCamerasTopToTheirBottomEdge() {
        val tree = read(padCamera = true)
        val bottom = tree.at("Exit building").bottom - tree.at("Map").top
        assertEquals("asked, to their bottom edge", bottom.toDouble(), insets!!.top, 0.5)
        assertEquals(16.0 + 44.0, insets!!.top, 0.5)
    }

    @Test fun withNoRoomTheTopCornersLeave() {
        val tree = read(height = 100)
        assertFalse(tree.names().contains("Exit building"))
        assertFalse(tree.names().contains("Map top corner controls"))
    }
}
