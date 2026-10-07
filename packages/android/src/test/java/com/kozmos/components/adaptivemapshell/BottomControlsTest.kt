package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.contracts.KozmosMapCollisionInsets
import com.kozmos.contracts.KozmosMapReadiness
import com.kozmos.components.live
import com.kozmos.components.readSettledSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.mapattribution.KozmosMapAttribution
import com.kozmos.components.mapattribution.KozmosMapAttributionCredit
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

    @Test fun bothControlRegionsHaveNamesAndKeepTheirChildren() {
        var presses = 0
        val tree = paparazzi.readSettledSemantics {
            MaterialTheme {
                KozmosAdaptiveMapShell(map = {}, modifier = Modifier.size(360.dp, 600.dp),
                    controls = { Box(Modifier.size(44.dp).clickable { presses++ }.semantics { contentDescription = "Locate" }) },
                    controlsBottomStart = { Box(Modifier.size(44.dp).clickable { presses++ }.semantics { contentDescription = "Language" }) },
                    controlsBottomEnd = { Box(Modifier.size(44.dp).clickable { presses++ }.semantics { contentDescription = "Zoom" }) })
            }
        }
        for (name in listOf("Map controls", "Map corner controls", "Locate", "Language", "Zoom")) {
            assertTrue("Missing $name", tree.names().contains(name))
        }
        for (name in listOf("Locate", "Language", "Zoom")) assertTrue(tree.named(name).click!!.invoke())
        assertEquals(3, presses)
    }

    @Test fun controlNamesCanBeLocalized() {
        val tree = paparazzi.readSettledSemantics {
            MaterialTheme {
                KozmosAdaptiveMapShell(map = {}, modifier = Modifier.size(360.dp, 600.dp),
                    controlsLabel = "Kartensteuerung", bottomControlsLabel = "Weitere Kartensteuerung",
                    controls = { Box(Modifier.size(44.dp).semantics { contentDescription = "Locate" }) },
                    controlsBottomEnd = { Box(Modifier.size(44.dp).semantics { contentDescription = "Zoom" }) })
            }
        }
        assertTrue(tree.names().containsAll(listOf("Kartensteuerung", "Weitere Kartensteuerung", "Locate", "Zoom")))
        assertFalse(tree.names().contains("Map controls"))
    }

    @Test fun absentControlsDoNotCreateEmptyContainers() {
        val tree = paparazzi.readSettledSemantics {
            MaterialTheme { KozmosAdaptiveMapShell(map = {}, modifier = Modifier.size(360.dp, 600.dp)) }
        }
        assertFalse(tree.names().contains("Map controls"))
        assertFalse(tree.names().contains("Map corner controls"))
    }

    @Test fun cornerPositionalSignatureAndTrailingCallbackStillCompile() {
        val tree = paparazzi.readSettledSemantics {
            MaterialTheme {
                KozmosAdaptiveMapShell({}, Modifier.size(360.dp, 300.dp), "Positional map", KozmosMapReadiness.Ready,
                    null, null, null, null, null, "Details", KozmosMapPanelPlacement.End,
                    KozmosMapCollisionInsets.Zero, null, com.kozmos.components.surface.KozmosSurfaceStyle.Solid,
                    KozmosDefaultPanelDetents, null, null, null, false, null) { _ -> }
            }
        }
        assertTrue(tree.names().contains("Positional map"))
    }

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
        assertFalse(tree.names().contains("Map corner controls"))
    }

    @Test fun hiddenLegacyControlsDoNotLeaveANamedContainer() {
        val tree = paparazzi.readSettledSemantics {
            MaterialTheme {
                KozmosAdaptiveMapShell(map = {}, modifier = Modifier.size(360.dp, 40.dp),
                    controls = { Box(Modifier.size(44.dp).semantics { contentDescription = "Locate" }) },
                    attribution = { Box(Modifier.size(100.dp, 20.dp)) })
            }
        }
        assertFalse(tree.names().contains("Map controls"))
        assertFalse(tree.names().contains("Locate"))
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
            if (contentHeight == 100) assertEquals(116f, panel.height / density, 1f)
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
    // GAP-135: an opened direction card and the sheet can leave the credits less room than
    // they need. They are never clipped into a scroll region: the Pointr logo goes first and the
    // credits keep their full height. A logo is whole or absent: the sheet gives way to a logo
    // alone that fits half the band (420: the test device gives the shell 640 of its 720), and
    // with less room than that it leaves (660).
    @Test fun roomyAttributionKeepsItsLogo() = squeezedAttribution(200, hasCredits = true, logoShown = true)
    @Test fun squeezedAttributionDropsTheLogoAndKeepsTheCredits() = squeezedAttribution(560, hasCredits = true, logoShown = false)
    @Test fun squeezedLogoAloneStaysWholeWhenTheSheetGivesWay() = squeezedAttribution(420, hasCredits = false, logoShown = true)
    @Test fun squeezedLogoAloneLeavesWithNoRoom() = squeezedAttribution(660, hasCredits = false, logoShown = false)
    private fun squeezedAttribution(barHeight: Int, hasCredits: Boolean, logoShown: Boolean) {
        val tree = paparazzi.readSettledSemantics {
            MaterialTheme {
                KozmosAdaptiveMapShell(
                    modifier = Modifier.size(390.dp, 720.dp), map = {},
                    topBar = { Box(Modifier.fillMaxWidth().height(barHeight.dp)) },
                    attribution = {
                        KozmosMapAttribution(credits = if (hasCredits)
                            listOf(KozmosMapAttributionCredit("a", "Indoor contributors")) else emptyList())
                    },
                    panel = { Box(Modifier.size(300.dp, 120.dp)) },
                    panelDetent = KozmosMapPanelDetent.Collapsed
                )
            }
        }
        val failures = mutableListOf<String>()
        fun expect(ok: Boolean, message: String) { if (!ok) failures += message }
        val logo = tree.merged.filter { it.description == "Pointr" }
        expect(logo.isNotEmpty() == logoShown, "logo shown ${logo.isNotEmpty()}, expected $logoShown: ${tree.names()}")
        for (node in logo) expect(node.frame.height - node.bounds.height < 1f, "the logo is cut, ${node.bounds} of ${node.frame}")
        val credit = tree.unmerged.filter { "Indoor contributors" in it.texts }
        expect(credit.isNotEmpty() == hasCredits, "credits shown ${credit.isNotEmpty()}, expected $hasCredits")
        for (node in credit) expect(node.frame.height - node.bounds.height < 1f, "the credits are cut, ${node.bounds} of ${node.frame}")
        val scrolls = tree.unmerged.filter { it.scrollBy != null && it.horizontalScroll == null }
        expect(scrolls.isEmpty(), "a vertical scroll region at ${scrolls.map { it.frame }}")
        assertTrue("bar $barHeight, credits $hasCredits:\n" + failures.joinToString("\n"), failures.isEmpty())
    }

    // GAP-135's follow-up (decision 58, extended): two 44-tall corners on a phone leave no middle
    // slot, so the attribution sits above them. However tall an opened direction card grows, the
    // attribution never reaches into it: the logo gives way first, then the corners, and the
    // credits keep their full height.
    @Test fun liftedCreditsSendTheCornersAwayRatherThanReachTheTopBar() {
        val reached = mutableSetOf<String>()
        val failures = mutableListOf<String>()
        var barHeight by mutableStateOf(300)
        // In a box, so the shell takes its own size rather than the window's.
        paparazzi.live(durationMillis = 15000, content = { Box {
            MaterialTheme {
                KozmosAdaptiveMapShell(
                    modifier = Modifier.size(390.dp, 720.dp), map = {},
                    topBar = { Box(Modifier.fillMaxWidth().height(barHeight.dp).semantics { contentDescription = "bar" }) },
                    attribution = {
                        KozmosMapAttribution(credits = listOf(KozmosMapAttributionCredit("a", "Indoor contributors")))
                    },
                    controlsBottomStart = { Box(Modifier.size(120.dp, 44.dp).semantics { contentDescription = "start" }) },
                    controlsBottomEnd = { Box(Modifier.size(120.dp, 44.dp).semantics { contentDescription = "end" }) },
                    panel = { Box(Modifier.size(300.dp, 120.dp)) },
                    panelDetent = KozmosMapPanelDetent.Collapsed
                )
            }
        } }) {
            // Up to 560: past it, the card leaves less than the credits alone need even with no
            // corners, the extreme decision 58 leaves as it is.
            for (height in 300..560 step 20) {
                barHeight = height
                frames(8)
                val tree = read()
                // Settled, it holds still from one frame to the next.
                fun shape(read: com.kozmos.components.ReadSemantics) =
                    read.merged.map { it.description to it.frame }
                frames(4)
                if (shape(read()) != shape(tree)) failures += "bar $height: the layout never settles"
                val logo = tree.merged.filter { it.description == "Pointr" }.map { it.frame }
                // The copy the shell measures while the brand has given way is never placed,
                // and TalkBack, walking the merged tree, finds no second credit in it.
                val credits = tree.unmerged.filter { it.placed && "Indoor contributors" in it.texts }.map { it.frame }
                val spoken = tree.merged.count { "Indoor contributors" in it.texts }
                val bar = tree.named("bar").frame
                val corners = tree.names().containsAll(listOf("start", "end"))
                val state = "bar $height: logo $logo, credits $credits, top bar $bar, ${tree.names()}"
                if (credits.size != 1 || spoken != 1) { failures += "one credit, $spoken spoken, $state"; continue }
                for (part in logo + credits) if (part.overlaps(bar)) failures += "the attribution reaches into the top bar, $state"
                if (corners) for (id in listOf("start", "end"))
                    for (part in logo + credits) if (part.overlaps(tree.named(id).frame)) failures += "$id overlaps, $state"
                val lifted = corners && credits.single().bottom < tree.named("end").frame.top
                reached += "${if (logo.isNotEmpty()) "logo" else "credits"} ${if (corners) (if (lifted) "above corners" else "beside corners") else "without corners"}"
            }
        }
        for (expected in listOf("logo above corners", "credits above corners", "credits without corners"))
            if (expected !in reached) failures += "the sweep never reached \"$expected\": $reached"
        assertTrue(failures.joinToString("\n"), failures.isEmpty())
    }

    // And the logo comes back once it fits again: after the text grows and shrinks back, and after
    // the shell narrows and widens back with a brand of words that wraps in between. The full
    // height used to be measured only while the brand showed, so it stayed at its largest.
    @Test fun theLogoComesBackAfterATextRoundTrip() = roundTrip(text = true)
    @Test fun theLogoComesBackAfterAWidthRoundTrip() = roundTrip(text = false)
    private fun roundTrip(text: Boolean) {
        var fontScale by mutableFloatStateOf(1f)
        var width by mutableStateOf(390.dp)
        paparazzi.live(content = { Box {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(density.density, fontScale)) {
                MaterialTheme {
                    KozmosAdaptiveMapShell(
                        modifier = Modifier.size(width, 720.dp), map = {},
                        // Half the band under the card is what the panel leaves the attribution:
                        // about 73 under a 430 card, and 63 under a 450 one, on the test device.
                        topBar = { Box(Modifier.fillMaxWidth().height(if (text) 430.dp else 450.dp)) },
                        attribution = {
                            KozmosMapAttribution(
                                credits = listOf(KozmosMapAttributionCredit("a", "Indoor contributors")),
                                brand = if (text) null else ({
                                    Text("Pointr indoor maps partner", fontSize = 16.sp, lineHeight = 24.sp,
                                        modifier = Modifier.semantics { contentDescription = "Pointr" })
                                })
                            )
                        },
                        panel = { Box(Modifier.size(300.dp, 120.dp)) },
                        panelDetent = KozmosMapPanelDetent.Collapsed
                    )
                }
            }
        } }) {
            // Settled, the logo and the sheet hold still from one frame to the next: a decision that
            // flipped them back and forth would show here.
            suspend fun settledLogo(step: String): Boolean {
                val seen = (0 until 6).map {
                    frames(2)
                    val tree = read()
                    tree.merged.any { node -> node.description == "Pointr" } to tree.named("Map details").frame
                }
                assertEquals("$step: the attribution settles, $seen", 1, seen.distinct().size)
                return seen.first().first
            }
            suspend fun settle() = frames(10)
            settle()
            assertTrue("the logo shows at first", settledLogo("at first"))
            if (text) fontScale = 2.5f else width = 200.dp
            settle()
            assertFalse("the logo gives way", settledLogo("given way"))
            if (text) fontScale = 1f else width = 390.dp
            settle()
            assertTrue("the logo comes back when it fits again", settledLogo("back"))
        }
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
