package com.kozmos.components.notice

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.semantics.LiveRegionMode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's Notice on Compose (GAP-142, GAP-160): its four tones, the progress
 * and done states, the disclosure, the action (GAP-033) and the live region.
 * Mirrors Notice.test.tsx.
 */
class KozmosNoticeTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun read(content: @Composable () -> Unit): ReadSemantics =
        paparazzi.readSemantics { KozmosMaterialTheme { content() } }

    @Test fun theFourTonesAndTheirMarks() {
        assertEquals(listOf("Warning", "Info", "Critical", "Success"), KozmosNoticeTone.values().map { it.name })
        assertEquals(
            listOf("alert-triangle", "info-circle", "alert-circle", "check"),
            KozmosNoticeTone.values().map(::kozmosNoticeToneIcon)
        )
        assertEquals(0.5f, kozmosNoticeEdgeAlpha(KozmosNoticeTone.Success))
        assertEquals(0.6f, kozmosNoticeEdgeAlpha(KozmosNoticeTone.Critical))
        assertEquals(0.05f, KozmosNoticeFillAlpha)
    }

    @Test fun progressTurnsTheArcWhereTheMarkIsAndDoneEndsInACheck() {
        val tone = KozmosNoticeAppearance.of(null, KozmosNoticeIcon.Tone)
        assertEquals(KozmosNoticeAppearance.Mark.Tone, tone.mark)
        assertFalse(tone.trailingCheck)

        val custom = KozmosNoticeIcon.Custom { Text("*") }
        val working = KozmosNoticeAppearance.of(KozmosNoticeStatus.Progress, custom)
        assertEquals(KozmosNoticeAppearance.Mark.Spinner, working.mark)
        assertFalse(working.trailingCheck)

        val done = KozmosNoticeAppearance.of(KozmosNoticeStatus.Done, KozmosNoticeIcon.Tone)
        assertEquals(KozmosNoticeAppearance.Mark.None, done.mark)
        assertTrue(done.trailingCheck)
        // The product's own mark stays at the start when done.
        assertEquals(KozmosNoticeAppearance.Mark.Custom, KozmosNoticeAppearance.of(KozmosNoticeStatus.Done, custom).mark)
        // None means none, and no column.
        assertEquals(KozmosNoticeAppearance.Mark.None, KozmosNoticeAppearance.of(null, KozmosNoticeIcon.None).mark)
    }

    @Test fun theMarksSayNothingOverTheWords() {
        val tree = read {
            KozmosNotice(summary = "Saving the geometry", tone = KozmosNoticeTone.Info, status = KozmosNoticeStatus.Progress)
        }
        assertTrue(
            "the arc is described: ${tree.merged.mapNotNull { it.description }}",
            tree.merged.none { it.description == "Loading" }
        )
        assertNotNull(tree.merged.firstOrNull { "Saving the geometry" in it.texts })
    }

    @Test fun itIsAPoliteLiveRegionUnlessToldOtherwise() {
        fun regions(live: KozmosNoticeLive) = read {
            KozmosNotice(summary = "Geometry is set", tone = KozmosNoticeTone.Success, status = KozmosNoticeStatus.Done, live = live)
        }.unmerged.mapNotNull { it.liveRegion }
        assertEquals(listOf(LiveRegionMode.Polite), regions(KozmosNoticeLive.Polite))
        assertEquals(listOf(LiveRegionMode.Assertive), regions(KozmosNoticeLive.Assertive))
        assertEquals(emptyList<LiveRegionMode>(), regions(KozmosNoticeLive.Off))
    }

    @Test fun theDetailOpensBehindMore() {
        paparazzi.live(content = {
            KozmosMaterialTheme {
                KozmosNotice(summary = "Check allergens with the venue.", detail = "These results are AI-assisted.")
            }
        }) {
            val more = read().merged.single { "More" in it.texts }
            assertNotNull("collapsed, More offers expand", more.expand)
            assertNull(more.collapse)
            assertTrue(read().merged.none { "These results are AI-assisted." in it.texts })
            more.click!!.invoke()
            frames(2)
            val open = read().merged.single { "More" in it.texts }
            assertNotNull("open, More offers collapse", open.collapse)
            assertTrue(read().merged.any { "These results are AI-assisted." in it.texts })
        }
    }

    @Test fun notCollapsibleShowsTheDetailAndNoMore() {
        val tree = read {
            KozmosNotice(
                summary = "If someone's life is in danger, call 112 now",
                detail = "Airport staff can help too.",
                tone = KozmosNoticeTone.Critical,
                collapsible = false,
                action = { Text("Call 112") }
            )
        }
        assertTrue(tree.merged.none { "More" in it.texts })
        assertTrue(tree.merged.any { "Airport staff can help too." in it.texts })
        assertTrue(tree.merged.any { "Call 112" in it.texts })
    }

    @Test fun theActionSitsUnderTheTextInEveryState() {
        for (status in listOf(null, KozmosNoticeStatus.Progress, KozmosNoticeStatus.Done)) {
            val tree = read {
                KozmosNotice(summary = "Set Geometry", status = status, action = { Text("Set Building Boundary") })
            }
            val summary = tree.unmerged.first { "Set Geometry" in it.texts }
            val action = tree.unmerged.first { "Set Building Boundary" in it.texts }
            assertTrue("$status: the action is not under the summary", action.bounds.top >= summary.bounds.bottom)
        }
    }

    @Test fun withNoIconTheTextStartsAtTheEdge() {
        fun start(icon: KozmosNoticeIcon) = read {
            KozmosNotice(summary = "Results are generated by AI.", tone = KozmosNoticeTone.Info, icon = icon)
        }.unmerged.first { "Results are generated by AI." in it.texts }.bounds.left
        assertTrue("no icon left a column", start(KozmosNoticeIcon.None) < start(KozmosNoticeIcon.Tone))
    }

    // Review of #522 (item 3): in progress, nothing holds its words back:
    // the notice is still a polite live region holding "Saving the geometry".
    @Test fun inProgressItsLiveRegionStillHoldsItsWords() {
        val tree = read {
            KozmosNotice(summary = "Saving the geometry", tone = KozmosNoticeTone.Info, status = KozmosNoticeStatus.Progress)
        }
        val region = tree.unmerged.single { it.liveRegion != null }
        assertEquals(LiveRegionMode.Polite, region.liveRegion)
        assertTrue(tree.merged.any { "Saving the geometry" in it.texts })
    }

    // Review of #522 (item 6c): React's order on the summary row: the
    // summary, then the done check, then More.
    @Test fun theDoneCheckSitsBetweenTheSummaryAndMore() {
        val tree = read {
            KozmosNotice(
                summary = "Geometry is set",
                detail = "The building's boundary is saved.",
                tone = KozmosNoticeTone.Success,
                status = KozmosNoticeStatus.Done
            )
        }
        val summary = tree.unmerged.first { "Geometry is set" in it.texts }
        val check = tree.unmerged.single { it.tag == KozmosNoticeDoneTag }
        val more = tree.merged.single { "More" in it.texts }
        assertTrue("the check is not after the summary", check.bounds.left >= summary.bounds.right)
        assertTrue("More is not after the check", more.bounds.left >= check.bounds.right)
    }

    // Review of #522 (item 6f): the disclosure says its state, in the
    // product's words, English by default.
    @Test fun theDisclosureSaysItsStateInTheProductsWords() {
        fun state(open: Boolean, expanded: String? = null, collapsed: String? = null) = read {
            KozmosNotice(
                summary = "Check allergens with the venue.",
                detail = "These results are AI-assisted.",
                expanded = open,
                onExpandedChange = {},
                expandLabel = "Mehr",
                expandedStateLabel = expanded ?: "Expanded",
                collapsedStateLabel = collapsed ?: "Collapsed"
            )
        }.merged.single { "Mehr" in it.texts }.stateDescription
        assertEquals("Collapsed", state(open = false))
        assertEquals("Expanded", state(open = true))
        assertEquals("Eingeklappt", state(open = false, collapsed = "Eingeklappt"))
        assertEquals("Ausgeklappt", state(open = true, expanded = "Ausgeklappt"))
    }
}
