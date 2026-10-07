package com.kozmos.components.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.components.readSemantics
import com.kozmos.components.routesummary.KozmosRoutePresentation
import com.kozmos.components.routesummary.KozmosRouteSummary
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.docsnippets.RoutePreviewSummary
import com.kozmos.docsnippets.StepByStepSummary
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * RouteSummary's actions (GAP-110) and its route preview (GAP-111): the
 * journey's actions after the progress, in equal columns in reading order,
 * and the navigation layout with no End and the place's line under the
 * destination. Read as TalkBack is told it, where each node sits.
 */
class KozmosRouteSummaryActionsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private var density = 1f
    /** Each action's whole layout box, its touch target, by label. */
    private val targets = mutableMapOf<String, Rect>()

    /** The progress a test gives the summary: a bar TalkBack can find. */
    @Composable private fun Rail() {
        Box(Modifier.fillMaxWidth().height(6.dp).semantics { contentDescription = "Progress" })
    }

    /** An action whose touch target is kept by its label. */
    @Composable private fun Action(label: String, variant: KozmosButtonVariant = KozmosButtonVariant.Default) {
        KozmosButton(onClick = {}, variant = variant,
            modifier = Modifier.onGloballyPositioned { targets[label] = it.boundsInRoot() }) { Text(label) }
    }

    /** The summary, hosted, in 320dp, in [direction], at [fontScale]. */
    private fun read(
        direction: LayoutDirection = LayoutDirection.Ltr,
        fontScale: Float = 1f,
        summary: @Composable () -> Unit
    ): ReadSemantics = paparazzi.readSemantics {
        density = LocalDensity.current.density
        CompositionLocalProvider(
            LocalDensity provides Density(LocalDensity.current.density, fontScale),
            LocalLayoutDirection provides direction
        ) {
            MaterialTheme {
                Box(Modifier.width(320.dp).semantics { contentDescription = "Summary" }) { summary() }
            }
        }
    }

    @Composable private fun Steps(previous: String = "Previous", next: String = "Next") {
        Action(previous, KozmosButtonVariant.Outline)
        Action(next)
    }

    private fun ReadSemantics.button(label: String): ReadNode =
        merged.single { label in it.texts && it.role == Role.Button }

    private fun dp(px: Float) = px / density

    // GAP-110: the actions

    @Test fun withoutActionsNothingFollowsTheProgress() {
        for (explicit in listOf(false, true)) {
            val tree = read {
                if (explicit) {
                    KozmosRouteSummary(destination = "Airport Shuttles", onEndRoute = {},
                        presentation = KozmosRoutePresentation.Hosted, actions = null) { Rail() }
                } else {
                    KozmosRouteSummary(destination = "Airport Shuttles", onEndRoute = {},
                        presentation = KozmosRoutePresentation.Hosted) { Rail() }
                }
            }
            assertEquals("explicit $explicit: something follows the progress",
                tree.named("Summary").bounds.bottom, tree.named("Progress").bounds.bottom, 0.5f)
            assertEquals(listOf("End"), tree.merged.filter { it.role == Role.Button }.flatMap { it.texts })
        }
    }

    @Test fun actionsFollowTheProgressInTraversalOrder() {
        val tree = read {
            KozmosRouteSummary(destination = "Airport Shuttles", durationText = "4 min", distanceText = "201 m",
                onEndRoute = {}, presentation = KozmosRoutePresentation.Hosted, actions = { Steps() }) { Rail() }
        }
        val order = tree.merged.map { it.description ?: it.texts.joinToString() }
        val progress = order.indexOf("Progress")
        val previous = order.indexOf("Previous")
        val next = order.indexOf("Next")
        assertTrue("traversal: $order", progress in 0 until previous && previous < next)
        // Under the progress, the summary's 12dp apart, and the summary's last part.
        val rail = tree.named("Progress").bounds
        assertEquals(12f, dp(tree.button("Previous").frame.top - rail.bottom), 2.5f)
        assertEquals(tree.named("Summary").bounds.bottom, targets.getValue("Next").bottom, 0.5f)
    }

    @Test fun actionsShareTheWidthEqually() {
        val tree = read {
            KozmosRouteSummary(destination = "Airport Shuttles", onEndRoute = {},
                presentation = KozmosRoutePresentation.Hosted,
                actions = { Steps(previous = "Back", next = "Continue to the next step") }) { Rail() }
        }
        val summary = tree.named("Summary").bounds
        val previous = targets.getValue("Back")
        val next = targets.getValue("Continue to the next step")
        assertEquals("widths $previous $next", previous.width, next.width, 1f)
        assertEquals(8f, dp(next.left - previous.right), 0.5f)
        assertEquals(summary.left, previous.left, 0.5f)
        assertEquals(summary.right, next.right, 2f)
        // The drawn buttons fill their columns too.
        assertEquals(previous.width, tree.button("Back").frame.width, 1f)
        assertEquals(next.width, tree.button("Continue to the next step").frame.width, 1f)
    }

    @Test fun everyActionKeepsA48dpTouchTarget() {
        // One line each; a label that wraps; and the same at twice the text size.
        for ((fontScale, labels, wraps) in listOf(
            Triple(1f, listOf("Previous", "Next"), false),
            Triple(1f, listOf("Zurück zum vorherigen Schritt", "Weiter"), true),
            Triple(2f, listOf("Zurück zum vorherigen Schritt", "Weiter"), true)
        )) {
            targets.clear()
            val tree = read(fontScale = fontScale) {
                KozmosRouteSummary(destination = "Airport Shuttles", onEndRoute = {},
                    presentation = KozmosRoutePresentation.Hosted,
                    actions = { Steps(previous = labels[0], next = labels[1]) }) { Rail() }
            }
            val case = "$fontScale ${labels[0]}"
            for (label in labels) {
                val target = targets.getValue(label)
                val drawn = tree.button(label).frame
                assertTrue("$case: $label target ${dp(target.height)}", dp(target.height) >= 48f - 0.5f)
                assertTrue("$case: $label drawn ${dp(drawn.height)}", dp(drawn.height) >= 44f - 0.5f)
            }
            val (first, second) = labels.map { tree.button(it).frame }
            if (wraps) {
                // A label that wraps grows its button, and the other with it.
                assertTrue("$case: ${labels[0]} does not wrap: ${dp(first.height)}", dp(first.height) > 48f)
                assertEquals("$case: the row's buttons differ in height", first.height, second.height, 1f)
            } else {
                // One line each: Kozmos Buttons draw 44 in their 48 (D7), not 48.
                assertEquals("$case: drawn ${dp(first.height)}", 44f, dp(first.height), 1f)
                assertEquals("$case: drawn ${dp(second.height)}", 44f, dp(second.height), 1f)
            }
        }
    }

    @Test fun rightToLeftMirrorsTheActions() {
        val tree = read(direction = LayoutDirection.Rtl) {
            KozmosRouteSummary(destination = "المطار", onEndRoute = {},
                presentation = KozmosRoutePresentation.Hosted,
                actions = { Steps(previous = "السابق", next = "التالي") }) { Rail() }
        }
        val summary = tree.named("Summary").bounds
        val previous = targets.getValue("السابق")
        val next = targets.getValue("التالي")
        assertTrue("Previous $previous is not at the inline start of Next $next", previous.left > next.left)
        assertEquals(summary.right, previous.right, 0.5f)
        assertEquals(summary.left, next.left, 2f)
        assertEquals(previous.width, next.width, 1f)
    }

    @Test fun aTrailingLambdaStillFillsTheProgress() {
        val tree = read {
            // The newer overload, with actions named and the progress trailing.
            KozmosRouteSummary(destination = "Gate 12", onEndRoute = {},
                presentation = KozmosRoutePresentation.Hosted, actions = { Action("Next") }) { Rail() }
            // The original overload, positional to its fourth parameter.
            KozmosRouteSummary("Gate 14", "4 min", "201 m", {}) {
                Box(Modifier.fillMaxWidth().height(6.dp).semantics { contentDescription = "Original progress" })
            }
        }
        assertNotNull(tree.named("Progress"))
        assertNotNull(tree.named("Original progress"))
        assertTrue(tree.button("Next").frame.top > tree.named("Progress").bounds.bottom)
    }

    // GAP-111: the route preview

    @Test fun thePreviewWithoutEndHasNoEndButton() {
        val tree = read {
            KozmosRouteSummary(destination = "Tessel Shoes", locationText = "Store · Level 1 · Harbour Point Mall",
                durationText = "3 min", distanceText = "205 m", presentation = KozmosRoutePresentation.Hosted,
                actions = {
                    Action("Go")
                    Action("Details", KozmosButtonVariant.Outline)
                })
        }
        assertEquals(listOf("Go", "Details"), tree.merged.filter { it.role == Role.Button }.flatMap { it.texts })
        assertFalse(tree.merged.any { "End" in it.texts })
        // The place's line follows the destination, under it.
        val texts = tree.unmerged.flatMap { node -> node.texts.map { it to node } }
        val title = texts.single { it.first == "Tessel Shoes" }.second
        val location = texts.single { it.first == "Store · Level 1 · Harbour Point Mall" }.second
        assertTrue(texts.indexOfFirst { it.second === location } > texts.indexOfFirst { it.second === title })
        assertTrue("$location is not under $title", location.bounds.top >= title.bounds.bottom - 0.5f)
        assertEquals(title.bounds.left, location.bounds.left, 0.5f)
    }

    // The docs' snippets (docsnippets/RouteSummaryActions.kt)

    @Test fun theDocsSnippetsComposeTheirActionsInEqualColumns() {
        val steps = paparazzi.readSemantics {
            MaterialTheme { Box(Modifier.width(320.dp)) { StepByStepSummary(listOf("Step 1 of 3", "Step 2 of 3", "Step 3 of 3"), onEnd = {}) } }
        }
        val previous = steps.button("Previous")
        val next = steps.button("Next")
        assertFalse("Previous is available on the first step", previous.enabled)
        assertTrue(next.enabled)
        assertEquals(previous.frame.width, next.frame.width, 1f)
        val preview = paparazzi.readSemantics {
            MaterialTheme { Box(Modifier.width(320.dp)) { RoutePreviewSummary(onGo = {}, onDetails = {}) } }
        }
        assertEquals(listOf("Go", "Details"), preview.merged.filter { it.role == Role.Button }.flatMap { it.texts })
        assertEquals(preview.button("Go").frame.width, preview.button("Details").frame.width, 1f)
    }
}
