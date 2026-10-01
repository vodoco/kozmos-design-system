package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.contracts.KozmosMapCollisionInsets
import com.kozmos.contracts.KozmosMapReadiness
import com.kozmos.components.readSettledSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.Before
import org.junit.After
import android.os.Handler
import android.os.Looper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.android.asCoroutineDispatcher
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.test.resetMain

@OptIn(ExperimentalCoroutinesApi::class)
class BottomControlsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    @Before fun bindMain() { Dispatchers.setMain(Handler(Looper.getMainLooper()).asCoroutineDispatcher("paparazzi-main")) }
    @After fun resetMain() { Dispatchers.resetMain() }

    @Test fun existingPositionalSignatureStillCompilesAndMounts() {
        val onDetent: (KozmosMapPanelDetent) -> Unit = {}
        val tree = paparazzi.readSettledSemantics {
            MaterialTheme {
                KozmosAdaptiveMapShell(
                    {}, Modifier.size(360.dp, 300.dp), "Legacy map", KozmosMapReadiness.Ready,
                    null, null, null, null, null, "Details", KozmosMapPanelPlacement.End,
                    KozmosMapCollisionInsets.Zero, null, com.kozmos.components.surface.KozmosSurfaceStyle.Solid,
                    KozmosDefaultPanelDetents, null, onDetent
                )
            }
        }
        assertTrue(tree.names().contains("Legacy map"))
    }

    @Test fun narrowCornersWrapWithoutOverlap() {
        val layout = bottomControlsGeometry(328, IntSize(220, 44), IntSize(144, 160), 16)
        assertEquals(220, layout.height)
        assertEquals(60, layout.end.y)
        assertEquals(184, layout.end.x)
    }

    @Test fun outOfRoomControlsAreNotExposedToAccessibility() {
        val tree = paparazzi.readSettledSemantics {
            MaterialTheme {
                KozmosAdaptiveMapShell(
                    modifier = Modifier.size(360.dp, 120.dp), map = {},
                    controlsBottomStart = { Box(Modifier.size(220.dp, 44.dp).semantics { contentDescription = "start" }) },
                    controlsBottomEnd = { Box(Modifier.size(144.dp, 160.dp).semantics { contentDescription = "end" }) }
                )
            }
        }
        assertFalse(tree.names().contains("start"))
        assertFalse(tree.names().contains("end"))
    }

    @Test fun cameraPaddingIsOffByDefault() = cameraPadding(false)
    @Test fun widePanelHugsContentAndCornersStayAtMapEdges() = widePanel(LayoutDirection.Ltr, 100)
    @Test fun widePanelHugsContentRTL() = widePanel(LayoutDirection.Rtl, 100)
    @Test fun widePanelBoundsLongContent() = widePanel(LayoutDirection.Ltr, 1200)
    @Test fun widePanelBoundsLongContentRTL() = widePanel(LayoutDirection.Rtl, 1200)
    private fun widePanel(direction: LayoutDirection, contentHeight: Int) {
        paparazzi.unsafeUpdateConfig(deviceConfig = app.cash.paparazzi.DeviceConfig.PIXEL_C)
            var density = 1f
            val tree = paparazzi.readSettledSemantics {
                density = LocalDensity.current.density
                CompositionLocalProvider(LocalLayoutDirection provides direction) {
                    MaterialTheme {
                        KozmosAdaptiveMapShell(
                            modifier = Modifier.size(1000.dp, 600.dp), map = {},
                            panelPlacement = KozmosMapPanelPlacement.Start,
                            controlsBottomStart = { Box(Modifier.size(100.dp, 44.dp).semantics { contentDescription = "start" }) },
                            controlsBottomEnd = { Box(Modifier.size(60.dp, 140.dp).semantics { contentDescription = "end" }) },
                            panel = { Box(Modifier.size(300.dp, contentHeight.dp)) }
                        )
                    }
                }
            }
            val map = tree.named("Map").bounds
            val panel = tree.named("Map details").bounds
            val start = tree.named("start").bounds
            if (contentHeight == 100) assertEquals(100f, panel.height / density, 1f)
            assertTrue(panel.bottom + 16f * density <= start.top)
            assertTrue(panel.height <= 412f * density + 1)
            assertFalse(panel.overlaps(start))
            assertEquals(16f, (if (direction == LayoutDirection.Ltr) start.left - map.left else map.right - start.right) / density, 1f)
    }
    @Test fun attributionClearsCollapsedPanelLTR() = attributionLayout(LayoutDirection.Ltr, KozmosMapPanelDetent.Collapsed)
    @Test fun attributionClearsCollapsedPanelRTL() = attributionLayout(LayoutDirection.Rtl, KozmosMapPanelDetent.Collapsed)
    @Test fun attributionClearsLargePanelLTR() = attributionLayout(LayoutDirection.Ltr, KozmosMapPanelDetent.Large)
    @Test fun attributionClearsLargePanelRTL() = attributionLayout(LayoutDirection.Rtl, KozmosMapPanelDetent.Large)
    @Test fun fullSheetDoesNotExposeControlsOverAttribution() {
        val tree = paparazzi.readSettledSemantics {
            MaterialTheme {
                KozmosAdaptiveMapShell(
                    modifier = Modifier.size(360.dp, 720.dp), map = {},
                    attribution = { Box(Modifier.size(280.dp, 64.dp)) },
                    controls = { Box(Modifier.size(44.dp).semantics { contentDescription = "Map information" }) },
                    panel = { Box(Modifier.size(300.dp, 300.dp)) },
                    panelDetent = KozmosMapPanelDetent.Large
                )
            }
        }
        assertFalse(tree.names().contains("Map information"))
    }
    @Test fun attributionIsCenteredOnFullMapWithWidePanelLTR() = attributionSidePanel(LayoutDirection.Ltr)
    @Test fun attributionIsCenteredOnFullMapWithWidePanelRTL() = attributionSidePanel(LayoutDirection.Rtl)
    private fun attributionSidePanel(direction: LayoutDirection) {
        paparazzi.unsafeUpdateConfig(deviceConfig = app.cash.paparazzi.DeviceConfig.PIXEL_C)
        val tree = paparazzi.readSettledSemantics {
            CompositionLocalProvider(LocalLayoutDirection provides direction) {
                MaterialTheme {
                    KozmosAdaptiveMapShell(
                        modifier = Modifier.size(1000.dp, 600.dp), map = {},
                        attribution = { Box(Modifier.size(280.dp, 64.dp).semantics { contentDescription = "credits" }) },
                        panel = { Box(Modifier.size(300.dp, 900.dp)) }
                    )
                }
            }
        }
        val map = tree.named("Map").bounds
        val credit = tree.named("credits").bounds
        val panel = tree.named("Map details").bounds
        assertFalse(credit.overlaps(panel))
        assertEquals(map.center.x, credit.center.x, 1f)
    }
    @Test fun attributionCappedLargeSheetHandleCyclesFromItsActualDetent() {
        var requested: KozmosMapPanelDetent? = null
        val tree = paparazzi.readSettledSemantics {
            MaterialTheme {
                KozmosAdaptiveMapShell(
                    modifier = Modifier.size(360.dp, 720.dp), map = {},
                    attribution = { Box(Modifier.size(280.dp, 64.dp)) },
                    panel = { Box(Modifier.size(300.dp, 300.dp)) },
                    panelDetent = KozmosMapPanelDetent.Large,
                    onPanelDetentChange = { requested = it }
                )
            }
        }
        tree.named("Panel height").click!!.invoke()
        assertEquals(KozmosMapPanelDetent.Collapsed, requested)
    }
    private fun attributionLayout(direction: LayoutDirection, detent: KozmosMapPanelDetent) {
                var density = 1f
                var bottom = 0.0
                val tree = paparazzi.readSettledSemantics {
                    density = LocalDensity.current.density
                    CompositionLocalProvider(LocalLayoutDirection provides direction) {
                        MaterialTheme {
                            KozmosAdaptiveMapShell(
                                modifier = Modifier.size(360.dp, 720.dp), map = {},
                                attribution = { Box(Modifier.size(280.dp, 64.dp).semantics { contentDescription = "credits" }) },
                                controlsBottomStart = { Box(Modifier.size(100.dp, 44.dp).semantics { contentDescription = "start" }) },
                                controlsBottomEnd = { Box(Modifier.size(60.dp, 140.dp).semantics { contentDescription = "end" }) },
                                panel = { Box(Modifier.size(300.dp, 300.dp)) },
                                panelDetent = detent,
                                onCollisionInsetsChange = { bottom = it.bottom }
                            )
                        }
                    }
                }
                val map = tree.named("Map").bounds
                val credit = tree.named("credits").bounds
                val panel = tree.named("Map details").bounds
                assertEquals(64f, credit.height / density, 1f)
                assertEquals(map.center.x, credit.center.x, 1f)
                assertTrue(credit.top >= map.top)
                assertFalse("$credit overlaps $panel", credit.overlaps(panel))
                assertTrue(bottom >= (map.bottom - credit.top) / density - 1)
                if (detent == KozmosMapPanelDetent.Collapsed) {
                    for (id in listOf("start", "end")) {
                        assertFalse(credit.overlaps(tree.named(id).bounds))
                        assertEquals(16f, (panel.top - tree.named(id).bounds.bottom) / density, 1f)
                    }
                }
    }

    @Test fun cameraPaddingCanBeEnabled() = cameraPadding(true)
    private fun cameraPadding(pad: Boolean) {
            var bottom = -1.0
            paparazzi.readSettledSemantics {
                MaterialTheme {
                    KozmosAdaptiveMapShell(
                        modifier = Modifier.size(360.dp, 300.dp), map = {},
                        controlsBottomStart = { Box(Modifier.size(220.dp, 44.dp)) },
                        controlsBottomEnd = { Box(Modifier.size(144.dp, 160.dp)) },
                        bottomControlsPadCamera = pad,
                        onCollisionInsetsChange = { bottom = it.bottom }
                    )
                }
            }
            assertEquals(if (pad) 236.0 else 0.0, bottom, 1.0)
    }

    @Test fun hostedCornersWrapInLTR() = hostedCorners(LayoutDirection.Ltr)
    @Test fun hostedCornersWrapInRTL() = hostedCorners(LayoutDirection.Rtl)
    private fun hostedCorners(direction: LayoutDirection) {
            var density = 1f
            val tree = paparazzi.readSettledSemantics {
                density = LocalDensity.current.density
                CompositionLocalProvider(LocalLayoutDirection provides direction) {
                    MaterialTheme {
                        KozmosAdaptiveMapShell(
                            modifier = Modifier.size(360.dp, 300.dp),
                            map = {},
                            controlsBottomStart = {
                                Box(Modifier.size(220.dp, 44.dp).semantics { contentDescription = "start" })
                            },
                            controlsBottomEnd = {
                                Box(Modifier.size(144.dp, 160.dp).semantics { contentDescription = "end" })
                            }
                        )
                    }
                }
            }
            val map = tree.named("Map").bounds
            val a = tree.named("start").bounds
            val b = tree.named("end").bounds
            assertEquals(300f, map.height / density, 1f)
            assertFalse("$a overlaps $b", a.overlaps(b))
            for (rect in listOf(a, b)) {
                assertTrue(rect.left >= map.left && rect.top >= map.top)
                assertTrue(rect.right <= map.right && rect.bottom <= map.bottom)
                assertTrue(rect.height > 0)
            }
            assertEquals(if (direction == LayoutDirection.Ltr) 16f else 124f, (a.left - map.left) / density, 1f)
            assertEquals(if (direction == LayoutDirection.Ltr) 200f else 16f, (b.left - map.left) / density, 1f)
    }
}
