package com.kozmos.components.card

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Card
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * GAP-194: content or a footer that is the card's first child pays the top.
 *
 * `KozmosCardContent` and `KozmosCardFooter` pad their sides and bottom only,
 * because a header above them has already paid the top. With no header, the
 * content (or a footer alone) touched the card's top edge: a site card's name
 * sat on its border. The card now pays its padding above its first child when
 * that is content or a footer, 24 by default and 16 compact, as React's card
 * has since #421 and SwiftUI's does (KozmosCardColumnTests).
 *
 * Measured from where each part's content starts (a 20dp block as wide as the
 * part gives it, the probe) to the card's edges. Then held to a Column drawing
 * the same children, which is what the card was: weights, alignment, right to
 * left and intrinsic sizes included, a header-led card lays out as before.
 */
class KozmosCardColumnTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val paddings = listOf(KozmosCardPadding.Default to 24f, KozmosCardPadding.Compact to 16f)

    // The top, measured.

    @Test
    fun aHeaderLedCardIsDrawnAsBefore() {
        for ((padding, p) in paddings) {
            val read = measure {
                KozmosCard(Modifier.testTag("card"), padding = padding) {
                    KozmosCardHeader { Probe("header") }
                    KozmosCardContent { Probe("content") }
                    KozmosCardFooter { Probe("footer") }
                }
            }
            val state = "$padding"
            assertNear("header's top: $state", p, read.inset("header").top)
            assertNear("the content pays no top: $state", p, read["content"].top - read["header"].bottom)
            assertNear("the footer pays no top: $state", p, read["footer"].top - read["content"].bottom)
            assertNear("footer's bottom: $state", p, read.inset("footer").bottom)
            for (part in listOf("header", "content", "footer")) {
                assertNear("$part's start: $state", p, read.inset(part).start)
                assertNear("$part's end: $state", p, read.inset(part).end)
            }
            assertNear("the card's height: $state", 3 * 20 + 4 * p, read["card"].height)
        }
    }

    @Test
    fun contentAlonePaysTheTop() {
        for ((padding, p) in paddings) {
            val read = measure {
                KozmosCard(Modifier.testTag("card"), padding = padding) { KozmosCardContent { Probe("content") } }
            }
            assertEquals("$padding", Inset(p, p, p, p), read.inset("content"))
        }
    }

    @Test
    fun contentAboveAFooterPaysTheTopOnce() {
        for ((padding, p) in paddings) {
            val read = measure {
                KozmosCard(Modifier.testTag("card"), padding = padding) {
                    KozmosCardContent { Probe("content") }
                    KozmosCardFooter { Probe("footer") }
                }
            }
            assertNear("content's top: $padding", p, read.inset("content").top)
            assertNear("the footer pays no top: $padding", p, read["footer"].top - read["content"].bottom)
            assertNear("footer's bottom: $padding", p, read.inset("footer").bottom)
        }
    }

    @Test
    fun aFooterAlonePaysTheTop() {
        for ((padding, p) in paddings) {
            val read = measure {
                KozmosCard(Modifier.testTag("card"), padding = padding) { KozmosCardFooter { Probe("footer") } }
            }
            assertEquals("$padding", Inset(p, p, p, p), read.inset("footer"))
        }
    }

    /**
     * The parts inside a wrapper are not the card's children: a header-led
     * wrapper is drawn as before, and content alone in one is left alone, as
     * React leaves a part inside a `form`.
     */
    @Test
    fun aPartInsideAWrapperIsLeftAlone() {
        val led = measure {
            KozmosCard(Modifier.testTag("card")) {
                Column {
                    KozmosCardHeader { Probe("header") }
                    KozmosCardContent { Probe("content") }
                }
            }
        }
        assertNear("header's top", 24f, led.inset("header").top)
        assertNear("the content pays no top", 24f, led["content"].top - led["header"].bottom)
        val alone = measure {
            KozmosCard(Modifier.testTag("card")) { Column { KozmosCardContent { Probe("content") } } }
        }
        assertNear("content in a wrapper", 0f, alone.inset("content").top)
    }

    /** A composable before the part is the first child: the MAP-64 boards' 16dp spacer keeps its 16. */
    @Test
    fun aComposableBeforeThePartKeepsItFromBeingFirst() {
        val read = measure {
            KozmosCard(Modifier.testTag("card")) {
                Spacer(Modifier.height(16.dp))
                KozmosCardContent { Probe("content") }
            }
        }
        assertNear("content's top", 16f, read.inset("content").top)
    }

    /**
     * A caller's padding on a part is applied outside it, as on its sides: it
     * adds to the top the card pays rather than replacing it. So a top padding
     * a product put on header-less content to work round GAP-194 now doubles,
     * and goes (the changelog's migration).
     */
    @Test
    fun aCallersPaddingAddsOutsideThePart() {
        val read = measure {
            KozmosCard(Modifier.testTag("card")) {
                KozmosCardContent(Modifier.padding(top = 8.dp, start = 4.dp)) { Probe("content") }
            }
        }
        assertEquals(Inset(24f + 8f, 24f + 4f, 24f, 24f), read.inset("content"))
    }

    /** A card in a card's content reads only its own children. */
    @Test
    fun aNestedCardTakesNothingFromTheOuterOne() {
        val read = measure {
            KozmosCard(Modifier.testTag("card")) {
                KozmosCardContent {
                    Probe("outer")
                    KozmosCard {
                        KozmosCardHeader { Probe("inner-header") }
                        KozmosCardContent { Probe("inner-content") }
                    }
                }
            }
        }
        assertNear("outer content's top", 24f, read.inset("outer").top)
        assertNear("inner content pays no top", 24f, read["inner-content"].top - read["inner-header"].bottom)
    }

    /**
     * Given a height, a header-less card shares it out below the top: content
     * weighted to fill what is left, and a footer that keeps its bottom. The
     * MAP-64 site cards in a row of equal heights are this card.
     */
    @Test
    fun aHeaderlessCardOfAGivenHeightKeepsItsTopAndBottom() {
        val read = measure {
            KozmosCard(Modifier.testTag("card").height(300.dp)) {
                KozmosCardContent(Modifier.weight(1f)) { Probe("content") }
                KozmosCardFooter { Probe("footer") }
            }
        }
        assertNear("the card's height", 300f, read["card"].height)
        assertNear("content's top", 24f, read.inset("content").top)
        assertNear("footer's bottom", 24f, read.inset("footer").bottom)
    }

    // Drawn as the Column it was.

    private class Shape(
        val name: String,
        val leads: Boolean,
        val modifier: Modifier = Modifier,
        val probes: List<String> = listOf("a", "b", "c"),
        val content: @Composable ColumnScope.() -> Unit
    )

    /**
     * The card lays its children out as the Column it was, below the top it
     * pays: offered its natural height, a fixed one, with weights that fill
     * and that don't, children aligned to the centre and the end, children
     * aligned by a line, text that wraps, in both directions. Each shape is
     * drawn twice, as a card and as a Column under the top (none for a
     * header-led card) in a Material card, and every probe, and the card,
     * sits where the Column put it.
     */
    @Test
    fun itLaysOutAsTheColumnItWas() {
        val words = "Terminal B's parking is open again from six, with step-free access from level 2."
        val shapes = listOf(
            Shape("header-led", leads = false) {
                KozmosCardHeader { Probe("a") }
                KozmosCardContent { Probe("b") }
                KozmosCardFooter { Probe("c") }
            },
            Shape("header-led, given a height, a weighted spacer", leads = false, Modifier.height(400.dp)) {
                KozmosCardHeader { Probe("a") }
                KozmosCardContent { Probe("b") }
                Spacer(Modifier.weight(1f))
                KozmosCardFooter { Probe("c") }
            },
            Shape("header-less, given a height, weights that fill and don't", leads = true, Modifier.height(301.dp)) {
                KozmosCardContent(Modifier.weight(1f)) { Probe("a") }
                Box(Modifier.weight(2f, fill = false).height(30.dp).fillMaxWidth().testTag("b"))
                KozmosCardFooter(Modifier.weight(1.5f)) { Probe("c") }
            },
            Shape("aligned to the centre and the end", leads = true) {
                KozmosCardContent { Probe("a") }
                Box(Modifier.align(Alignment.CenterHorizontally).width(40.dp).height(10.dp).testTag("b"))
                Box(Modifier.align(Alignment.End).width(60.dp).height(10.dp).testTag("c"))
            },
            Shape("aligned by a line", leads = false) {
                KozmosCardHeader { Probe("a") }
                Box(Modifier.alignBy { it.measuredWidth / 2 }.width(40.dp).height(10.dp).testTag("b"))
                Box(Modifier.alignBy { it.measuredWidth / 4 }.width(100.dp).height(10.dp).testTag("c"))
            },
            Shape("header-less, text that wraps", leads = true, probes = listOf("a", "b")) {
                KozmosCardContent { Text(words, Modifier.testTag("a")) }
                KozmosCardFooter { Text(words, Modifier.testTag("b")) }
            },
        )
        for (shape in shapes) {
            for (direction in LayoutDirection.values()) {
                val top = if (shape.leads) 24.dp else 0.dp
                val card = measure(direction) { KozmosCard(Modifier.testTag("card").then(shape.modifier), content = shape.content) }
                val column = measure(direction) { Reference(top, shape.modifier, content = shape.content) }
                val state = "${shape.name}, $direction"
                assertFrame("the card: $state", column["card"], card["card"])
                for (probe in shape.probes) {
                    assertFrame("$probe: $state", column.relative(probe), card.relative(probe))
                }
            }
        }
    }

    /**
     * Cards in a row as tall as its tallest, which asks each card its
     * intrinsic height: a header-led card and a header-less one with weighted
     * content, beside the same children in Columns.
     */
    @Test
    fun itAnswersIntrinsicSizesAsTheColumnDid() {
        val headerLed: @Composable ColumnScope.() -> Unit = {
            KozmosCardHeader { Probe("a") }
            KozmosCardContent { Text("Terminal B's parking is open again from six.") }
        }
        val headerless: @Composable ColumnScope.() -> Unit = {
            KozmosCardContent(Modifier.weight(1f)) { Probe("b") }
            KozmosCardFooter { Probe("c") }
        }
        val cards = measure {
            Row(Modifier.height(IntrinsicSize.Min).width(320.dp)) {
                KozmosCard(Modifier.weight(1f).fillMaxHeight().testTag("card"), content = headerLed)
                KozmosCard(Modifier.weight(1f).fillMaxHeight().testTag("other"), content = headerless)
            }
        }
        val columns = measure {
            Row(Modifier.height(IntrinsicSize.Min).width(320.dp)) {
                Reference(0.dp, Modifier.weight(1f).fillMaxHeight(), content = headerLed)
                Reference(24.dp, Modifier.weight(1f).fillMaxHeight(), tag = "other", content = headerless)
            }
        }
        for (name in listOf("card", "other", "a", "b", "c")) {
            assertFrame(name, columns[name], cards[name])
        }
        val widths = measure {
            Column {
                KozmosCard(Modifier.width(IntrinsicSize.Max).testTag("card")) { KozmosCardContent { Text("Open from six", Modifier.testTag("a")) } }
            }
        }
        val widthsWere = measure {
            Column { Reference(24.dp, Modifier.width(IntrinsicSize.Max)) { KozmosCardContent { Text("Open from six", Modifier.testTag("a")) } } }
        }
        assertFrame("the card's intrinsic width", widthsWere["card"], widths["card"])
    }

    // Measuring.

    /** The old KozmosCard, a Column in a Material card, under [top]. */
    @Composable
    private fun Reference(top: Dp, modifier: Modifier, tag: String = "card", content: @Composable ColumnScope.() -> Unit) {
        Card(modifier.testTag(tag)) { Column(Modifier.padding(top = top)) { content() } }
    }

    @Composable
    private fun Probe(name: String) {
        Box(Modifier.fillMaxWidth().height(20.dp).testTag(name))
    }

    private data class Inset(val top: Float, val start: Float, val end: Float, val bottom: Float)

    /** Every tagged node's frame, in dp, laid out 320dp wide. */
    private class Frames(private val frames: Map<String, Rect>) {
        operator fun get(name: String): Rect = checkNotNull(frames[name]) { "no node tagged $name among ${frames.keys}" }
        fun relative(name: String): Rect? = frames[name]?.translate(-this["card"].left, -this["card"].top)

        /** How far a probe is from each of the card's edges, to the nearest half dp. */
        fun inset(name: String): Inset {
            val card = this["card"]
            val probe = this[name]
            fun round(value: Float) = Math.round(value * 2) / 2f
            return Inset(round(probe.top - card.top), round(probe.left - card.left), round(card.right - probe.right), round(card.bottom - probe.bottom))
        }
    }

    private fun measure(direction: LayoutDirection = LayoutDirection.Ltr, content: @Composable () -> Unit): Frames {
        var density = 1f
        val tree: ReadSemantics = paparazzi.readSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                CompositionLocalProvider(LocalLayoutDirection provides direction) {
                    Column(Modifier.width(320.dp)) { content() }
                }
            }
        }
        val frames = tree.unmerged.filter { it.tag != null }.associate { node ->
            node.tag!! to node.frame.let { Rect(it.left / density, it.top / density, it.right / density, it.bottom / density) }
        }
        return Frames(frames)
    }

    private fun assertNear(message: String, expected: Float, actual: Float) {
        assertTrue("$message: $actual, wanted $expected", abs(expected - actual) <= 0.5f)
    }

    /** Frames match to the half dp; each must have been drawn. */
    private fun assertFrame(message: String, expected: Rect?, actual: Rect?) {
        assertNotNull("$message: not drawn in the Column", expected)
        assertNotNull("$message: not drawn in the card", actual)
        expected!!
        actual!!
        val near = abs(expected.left - actual.left) <= 0.5f && abs(expected.top - actual.top) <= 0.5f &&
            abs(expected.width - actual.width) <= 0.5f && abs(expected.height - actual.height) <= 0.5f
        assertTrue("$message: $actual, wanted $expected", near)
    }
}
