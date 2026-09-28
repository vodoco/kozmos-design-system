package com.kozmos.components.mapcontrolsgroup

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonLabelPlacement
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonPresentation
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.contracts.KozmosUserLocationState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * What TalkBack is told about the map's control cluster.
 *
 * These mirror MapControlsGroup.test.tsx and the SwiftUI tests. Row 67 gave
 * every control a name the product can translate. Row 77 made the location
 * control say it is on only while the map follows, and put a step-free toggle
 * in its place while a route is shown (Olcay, 2026-09-27).
 */
class KozmosMapControlsGroupSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private fun read(content: @Composable () -> Unit) =
        paparazzi.readSemantics { MaterialTheme { content() } }

    @Test
    fun everyControlTakesTheProductsName() {
        // Hard-coded English until row 67: a German device announced "Zoom in"
        // whatever else the product had translated.
        val tree = read {
            KozmosMapControlsGroup(
                onCompassReset = {},
                onMyLocation = {},
                locationLabel = "Mein Standort",
                zoomInLabel = "Vergrößern",
                zoomOutLabel = "Verkleinern",
                compassResetLabel = "Nach Norden ausrichten"
            )
        }

        assertEquals(Role.Button, tree.named("Vergrößern").role)
        assertEquals(Role.Button, tree.named("Verkleinern").role)
        assertEquals(Role.Button, tree.named("Nach Norden ausrichten").role)
        tree.named("Mein Standort")
        // No English left behind for a translated product.
        assertTrue(tree.names().none { it in listOf("Zoom in", "Zoom out", "Reset bearing") })
    }

    @Test
    fun theNamesDefaultToTheEnglishTheyWere() {
        val tree = read { KozmosMapControlsGroup(onCompassReset = {}, onMyLocation = {}) }

        tree.named("Zoom in")
        tree.named("Zoom out")
        tree.named("Reset bearing")
        tree.named("Locate me")
    }

    @Test
    fun theLocationControlRestsUntilTheMapFollows() {
        // Selected whatever the state until row 77, so a map that was not
        // following at all drew a control that said it was. Off by default, as
        // React's is.
        val tree = read { KozmosMapControlsGroup(onMyLocation = {}, locationLabel = "Focus") }
        assertEquals(false, tree.named("Focus").selected)
    }

    @Test
    fun theLocationControlIsOnOnlyWhileTheMapFollows() {
        for (state in KozmosUserLocationState.values()) {
            val tree = read {
                KozmosMapControlsGroup(onMyLocation = {}, locationLabel = "Focus", locationState = state)
            }
            val following = state == KozmosUserLocationState.Following ||
                state == KozmosUserLocationState.Heading
            // Heading's name goes on after the words (decision 40).
            val name = if (state == KozmosUserLocationState.Heading) "Focus, map turns with you" else "Focus"
            assertEquals("$state", following, tree.named(name).selected)
        }
    }

    @Test
    fun locatingIsAWaitRatherThanAPress() {
        // React's Button disables itself while it loads; the spinner stands in
        // the mark's place and the name says why.
        val tree = read {
            KozmosMapControlsGroup(
                onMyLocation = {},
                locationLabel = "Focus",
                locationStateLabel = "Locating",
                locationState = KozmosUserLocationState.Locating
            )
        }
        val control = tree.named("Focus, Locating")
        assertFalse(control.enabled)
        assertEquals(false, control.selected)
    }

    @Test
    fun revealingStartsIconOnlyWhateverThePresentationSays() {
        // While it reveals on change the control decides, and the first render
        // never reveals: a control that shouts its state on arrival announces
        // something the visitor did not just do.
        val tree = read {
            KozmosMapControlsGroup(
                onMyLocation = {},
                locationPresentation = KozmosMapControlButtonPresentation.Labelled,
                locationLabel = "Focus",
                locationRevealOnChange = true
            )
        }
        tree.named("Focus")
        assertTrue(tree.unmerged.none { "Focus" in it.texts })
    }

    @Test
    fun stepFreeTakesTheLocationControlsPlaceDuringARoute() {
        val asked = mutableListOf<Boolean>()
        var located = 0
        val tree = read {
            KozmosMapControlsGroup(
                onMyLocation = { located++ },
                locationLabel = "Focus",
                onStepFreeChange = { asked += it },
                stepFree = false
            )
        }

        val control = tree.named("Step-free, Off")
        assertEquals(false, control.selected)
        assertTrue(tree.names().none { it.startsWith("Focus") })

        // Called with the setting the visitor asked for, and nothing else.
        control.click!!.invoke()
        assertEquals(listOf(true), asked)
        assertEquals(0, located)
    }

    @Test
    fun stepFreeSaysItIsOnInTheProductsLanguage() {
        val asked = mutableListOf<Boolean>()
        val tree = read {
            KozmosMapControlsGroup(
                onStepFreeChange = { asked += it },
                stepFree = true,
                stepFreeLabel = "Stufenlos",
                stepFreeOnLabel = "Ein",
                stepFreeOffLabel = "Aus"
            )
        }

        val control = tree.named("Stufenlos, Ein")
        assertEquals(true, control.selected)
        control.click!!.invoke()
        assertEquals(listOf(false), asked)
    }

    @Test
    fun theGroupIsAControlWideNotTheMapWide() {
        // The zoom cluster's Divider fills the width it is offered, so in the
        // shell's corner — offered the whole map — the cluster stretched
        // across it. SwiftUI met the same trap and fixed its rule's width;
        // React's cluster is w-11.
        val tree = read {
            Box(Modifier.width(400.dp), contentAlignment = Alignment.TopEnd) {
                KozmosMapControlsGroup(
                    modifier = Modifier.testTag("group"),
                    onCompassReset = {},
                    onMyLocation = {}
                )
            }
        }

        val control = tree.named("Zoom in").bounds.width
        val group = tree.unmerged.single { it.tag == "group" }.bounds.width
        assertEquals("the group is $group wide beside a $control control", control, group, 0.5f)
    }

    @Test
    fun headingSaysMoreThanItsWordsToTalkBack() {
        // Decision 40: heading reads "On", as following does and as the SDK's
        // control does; its mark tells them apart on screen, and TalkBack hears
        // what the group adds after the words. The product translates it.
        val tree = read {
            KozmosMapControlsGroup(
                onMyLocation = {},
                locationLabel = "Focus",
                locationStateLabel = "On",
                locationState = KozmosUserLocationState.Heading
            )
        }
        assertEquals(true, tree.named("Focus, On, map turns with you").selected)

        val translated = read {
            KozmosMapControlsGroup(
                onMyLocation = {},
                locationLabel = "Fokus",
                locationStateLabel = "Ein",
                locationState = KozmosUserLocationState.Heading,
                locationHeadingDescription = "Karte dreht sich mit"
            )
        }
        translated.named("Fokus, Ein, Karte dreht sich mit")
    }

    @Test
    fun noPositionReadsItsStateAlone() {
        // The SDK's "No Location" is one line, with no "Focus" over it. The
        // name still starts what TalkBack hears.
        for (state in listOf(KozmosUserLocationState.Unavailable, KozmosUserLocationState.PermissionDenied)) {
            val tree = read {
                KozmosMapControlsGroup(
                    onMyLocation = {},
                    locationPresentation = KozmosMapControlButtonPresentation.Labelled,
                    locationLabelPlacement = KozmosMapControlButtonLabelPlacement.Stacked,
                    locationLabel = "Focus",
                    locationStateLabel = "No Location",
                    locationState = state
                )
            }
            tree.named("Focus, No Location")
            assertTrue("$state: No Location is not drawn", tree.unmerged.any { "No Location" in it.texts })
            assertTrue("$state: the name is drawn over No Location", tree.unmerged.none { "Focus" in it.texts })
        }
    }

    @Test
    fun theControlsAreTheSDKs48Square() {
        // Decision 40: the Tracking Indicator's 48 square, and 48 tall labelled.
        // A 100dp ruler gives the density the bounds are drawn at.
        val tree = read {
            Column {
                Box(Modifier.size(100.dp).testTag("ruler"))
                KozmosMapControlsGroup(onCompassReset = {}, onMyLocation = {}, locationLabel = "Focus")
            }
        }
        val dp = tree.unmerged.single { it.tag == "ruler" }.bounds.width / 100f
        for (name in listOf("Zoom in", "Zoom out", "Reset bearing", "Focus")) {
            val bounds = tree.named(name).bounds
            assertEquals("$name is ${bounds.width / dp}dp wide", 48f, bounds.width / dp, 0.5f)
            assertEquals("$name is ${bounds.height / dp}dp tall", 48f, bounds.height / dp, 0.5f)
        }

        val labelled = read {
            Column {
                Box(Modifier.size(100.dp).testTag("ruler"))
                KozmosMapControlsGroup(
                    onMyLocation = {},
                    locationPresentation = KozmosMapControlButtonPresentation.Labelled,
                    locationLabelPlacement = KozmosMapControlButtonLabelPlacement.Stacked,
                    locationLabel = "Focus",
                    locationStateLabel = "Off"
                )
            }
        }
        val labelledDp = labelled.unmerged.single { it.tag == "ruler" }.bounds.width / 100f
        val height = labelled.named("Focus, Off").bounds.height / labelledDp
        assertEquals("the labelled control is ${height}dp tall", 48f, height, 0.5f)
    }

    @Test
    fun stepFreeStacksAsTheLocationControlItReplacesIsSetTo() {
        val tree = read {
            KozmosMapControlsGroup(
                locationPresentation = KozmosMapControlButtonPresentation.Labelled,
                locationLabelPlacement = KozmosMapControlButtonLabelPlacement.Stacked,
                onStepFreeChange = {}
            )
        }

        val name = tree.unmerged.single { "Step-free" in it.texts }
        val state = tree.unmerged.single { "Off" in it.texts }
        // Centres, not edges: each line is a box as tall as its type (the
        // SDK's 16 on a 16 line), and the text's own box, with its leading,
        // overflows it (decision 40).
        assertTrue(
            "the state sits under the name: ${name.bounds} over ${state.bounds}",
            state.bounds.center.y > name.bounds.center.y && state.bounds.left == name.bounds.left
        )
    }
}
