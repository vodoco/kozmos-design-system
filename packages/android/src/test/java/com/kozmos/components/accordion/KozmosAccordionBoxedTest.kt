package com.kozmos.components.accordion

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.drawn
import com.kozmos.components.live
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/** Paparazzi's device is 360 wide, so a panel of Cloud's 408 would be cut. */
private const val PANEL = 320f

/**
 * Open, closed, disabled and loading, in that order, as Pointr Cloud's
 * building editor draws them: the open header at 0, 30 of content under it,
 * then 90, 142 and 194.
 */
@Composable
private fun Sections(
    icon: (@Composable () -> Unit)? = { Box(Modifier.size(20.dp).background(Color.Magenta)) },
    loading: Boolean = true,
    onChange: (String?) -> Unit = {}
) {
    var open by remember { mutableStateOf<String?>("open") }
    val set: (String?) -> Unit = { open = it; onChange(it) }
    KozmosAccordion(Modifier.width(PANEL.dp), variant = KozmosAccordionVariant.Boxed) {
        KozmosAccordionItem {
            KozmosAccordionTrigger(value = "open", selectedValue = open, onValueChange = set, title = "Building details", label = "Step 1/5", icon = icon)
            KozmosAccordionContent(value = "open", selectedValue = open) { Spacer(Modifier.fillMaxWidth().height(30.dp)) }
        }
        KozmosAccordionItem {
            KozmosAccordionTrigger(value = "closed", selectedValue = open, onValueChange = set, title = "Location", label = "Step 2/5", icon = icon)
            KozmosAccordionContent(value = "closed", selectedValue = open) { Text("Where it is") }
        }
        KozmosAccordionItem(disabled = true) {
            KozmosAccordionTrigger(value = "disabled", selectedValue = open, onValueChange = set, title = "Levels", label = "Step 3/5", icon = icon)
            KozmosAccordionContent(value = "disabled", selectedValue = open) { Text("The levels") }
        }
        KozmosAccordionItem {
            KozmosAccordionTrigger(
                value = "loading", selectedValue = open, onValueChange = set, title = "Floor plans", label = "Step 4/5", icon = icon,
                loading = loading, loadingLabel = "Yükleniyor"
            )
            KozmosAccordionContent(value = "loading", selectedValue = open) { Text("The plans") }
        }
    }
}

/**
 * One section, open, then disabled or loading: its header at 0, and 8 under
 * the 44 its content, a magenta block and some words.
 */
@Composable
private fun OpenThenInert(disabled: Boolean = false, loading: Boolean = false) {
    KozmosAccordion(Modifier.width(PANEL.dp), variant = KozmosAccordionVariant.Boxed) {
        KozmosAccordionItem(disabled = disabled) {
            KozmosAccordionTrigger(value = "open", selectedValue = "open", onValueChange = {}, title = "Building details", label = "Step 1/5", loading = loading)
            KozmosAccordionContent(value = "open", selectedValue = "open") {
                Spacer(Modifier.fillMaxWidth().height(30.dp).background(Color.Magenta))
                Text("The form")
            }
        }
    }
}

/**
 * What TalkBack is told, and where the parts sit, of the boxed form. A header
 * is 44 here, this platform's target, where React's is the density's control
 * height, 40 compact and 44 touch. `disabled` and `loading` are new on this
 * platform: before them a trigger took every press.
 */
class KozmosAccordionBoxedTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun ReadSemantics.trigger(title: String): ReadNode {
        val found = merged.filter { title in it.texts }
        check(found.size == 1) { "expected one node showing \"$title\", found ${found.size} among ${merged.map { it.texts }}" }
        return found.single()
    }

    @Test fun headersAre44AndTheSections8Apart() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { Sections() } }
        val open = tree.trigger("Building details").frame
        val closed = tree.trigger("Location").frame
        val disabled = tree.trigger("Levels").frame
        val loading = tree.trigger("Floor plans").frame
        val dp = open.width / PANEL
        for ((name, frame) in listOf("open" to open, "closed" to closed, "disabled" to disabled, "loading" to loading)) {
            assertEquals("$name header's height, in dp", 44f, frame.height / dp, 0.6f)
            assertEquals("$name header's width, in dp", PANEL, frame.width / dp, 0.6f)
        }
        assertEquals("from the open header to the next: 8, its 30 of content, 8", 46f, (closed.top - open.bottom) / dp, 0.6f)
        assertEquals("closed to disabled", 8f, (disabled.top - closed.bottom) / dp, 0.6f)
        assertEquals("disabled to loading", 8f, (loading.top - disabled.bottom) / dp, 0.6f)
    }

    @Test fun aTriggerReadsItsLabelThenItsTitle() {
        val trigger = paparazzi.readSemantics { KozmosMaterialTheme { Sections() } }.trigger("Building details")
        assertEquals(listOf("Step 1/5", "Building details"), trigger.texts)
        assertEquals(Role.Button, trigger.role)
        assertNotNull("the open trigger offers collapse", trigger.collapse)
        assertTrue("an enabled trigger reads as disabled", trigger.enabled)
        assertNull("an idle trigger says a state", trigger.stateDescription)
    }

    @Test fun anIconSaysNothing() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { Sections(icon = { Text("Decoration") }) }
        }
        assertFalse("words TalkBack reads: ${tree.merged.map { it.texts }}", tree.merged.any { "Decoration" in it.texts })
    }

    @Test fun aDisabledTriggerOffersNothingAndItsPressRunsNothing() {
        val changes = mutableListOf<String?>()
        paparazzi.live(content = { KozmosMaterialTheme { Sections(onChange = { changes += it }) } }) {
            val trigger = read().trigger("Levels")
            assertFalse("it reads as enabled", trigger.enabled)
            assertNull("it offers expand", trigger.expand)
            assertNull("it offers collapse", trigger.collapse)
            trigger.click?.invoke()
            frames(4)
        }
        assertEquals("a press reached the product", emptyList<String?>(), changes)
    }

    @Test fun aLoadingTriggerSaysSoInTheProductsWordsAndItsPressRunsNothing() {
        val changes = mutableListOf<String?>()
        paparazzi.live(content = { KozmosMaterialTheme { Sections(onChange = { changes += it }) } }) {
            val trigger = read().trigger("Floor plans")
            assertEquals("Yükleniyor", trigger.stateDescription)
            assertFalse("it reads as enabled", trigger.enabled)
            assertNull("it offers expand", trigger.expand)
            trigger.click?.invoke()
            frames(4)
        }
        assertEquals("a press reached the product", emptyList<String?>(), changes)
    }

    /** When the product clears `loading`, the same trigger opens. */
    @Test fun aTriggerOpensOnceLoadingEnds() {
        val changes = mutableListOf<String?>()
        paparazzi.live(content = { KozmosMaterialTheme { Sections(loading = false, onChange = { changes += it }) } }) {
            val trigger = read().trigger("Floor plans")
            assertNull("it still says it is loading", trigger.stateDescription)
            assertTrue("it reads as disabled", trigger.enabled)
            assertTrue("expand was refused", checkNotNull(trigger.expand) { "it offers no expand" }())
            frames(4)
            assertNotNull("the opened trigger offers collapse", read().trigger("Floor plans").collapse)
        }
        assertEquals(listOf<String?>("loading"), changes)
    }

    /** Regular, as the live page draws it: read from what the text laid out in. */
    @Test fun theTitleIsRegular() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { Sections() } }
        assertEquals(FontWeight.Normal, tree.unmerged.single { "Building details" in it.texts }.fontWeight)
    }

    /** Open, then disabled or loading: no press, so it can't be closed, and the content stays. */
    @Test fun anOpenTriggerThatIsDisabledOrLoadingKeepsItsContent() {
        for ((disabled, loading) in listOf(true to false, false to true)) {
            val tree = paparazzi.readSemantics {
                KozmosMaterialTheme { OpenThenInert(disabled, loading) }
            }
            val trigger = tree.trigger("Building details")
            assertFalse("it reads as enabled", trigger.enabled)
            assertNull("it offers collapse", trigger.collapse)
            assertTrue("the open content went: ${tree.merged.map { it.texts }}", tree.merged.any { "The form" in it.texts })
        }
    }

    /** `disabled` is the item's in the default form too, and its open content stays. */
    @Test fun theDefaultFormTakesDisabledAndKeepsItsOpenContent() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosAccordion(Modifier.width(360.dp)) {
                    KozmosAccordionItem(disabled = true) {
                        KozmosAccordionTrigger(value = "hours", selectedValue = "hours", onValueChange = {}, title = "Opening hours")
                        KozmosAccordionContent(value = "hours", selectedValue = "hours") { Text("Nine to five") }
                    }
                }
            }
        }
        assertFalse("it reads as enabled", tree.trigger("Opening hours").enabled)
        assertTrue("the open content went: ${tree.merged.map { it.texts }}", tree.merged.any { "Nine to five" in it.texts })
    }

    @Test fun theDocsSnippetRuns() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                com.kozmos.docsnippets.BuildingSections(open = "details", onOpen = {}, levelsLoading = true, plansReached = false)
            }
        }
        assertEquals("Loading", tree.trigger("Levels").stateDescription)
        assertFalse(tree.trigger("Floor plans").enabled)
        assertNotNull(tree.trigger("Building details").collapse)
    }
}

/**
 * The boxed form as drawn, in the light and in the dark. The colours are
 * written out: they are what decision 149 names, so a token or a component
 * that drifted fails here. Drawn on a mid grey that is none of them, and found
 * by colour, never by dp: Paparazzi scales its frames
 * (paparazzi-frames-are-scaled), and CI's Linux anti-aliases edges differently
 * (paparazzi-linux-edge-pixels), so no count here must be zero except by a
 * margin well inside a part. No golden: nothing is recorded or compared.
 */
class KozmosAccordionBoxedPixelsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFF808080.toInt()
    private fun theme900(dark: Boolean) = if (dark) 0xFFCAD9FC.toInt() else 0xFF082975.toInt()
    private fun title(dark: Boolean) = if (dark) 0xFF000000.toInt() else 0xFFFFFFFF.toInt()
    private fun label(dark: Boolean) = if (dark) 0xFF0D44C2.toInt() else 0xFF7EA2F6.toInt()
    private fun grey(dark: Boolean) = if (dark) 0xFF17191C.toInt() else 0xFFE3E4E8.toInt()
    private fun page(dark: Boolean) = if (dark) 0xFF000000.toInt() else 0xFFFFFFFF.toInt()

    private fun draw(dark: Boolean, rtl: Boolean = false): DrawnPixels = paparazzi.drawn(frames) {
        CompositionLocalProvider(
            LocalKozmosUseDarkTokens provides dark,
            LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr
        ) {
            KozmosMaterialTheme {
                Box(Modifier.background(Color(host)).padding(16.dp)) { Sections() }
            }
        }
    }

    private class Box2(val left: Int, val top: Int, val right: Int, val bottom: Int) {
        val width get() = right - left + 1
        val height get() = bottom - top + 1
    }

    private fun DrawnPixels.box(colour: Int, tolerance: Int = 2, top: Int = 0, bottom: Int = height - 1): Box2? {
        var left = Int.MAX_VALUE; var up = Int.MAX_VALUE; var right = -1; var down = -1
        for (y in top..bottom) for (x in 0 until width) {
            if (DrawnPixels.matches(argb(x, y), colour, tolerance)) {
                left = minOf(left, x); up = minOf(up, y); right = maxOf(right, x); down = maxOf(down, y)
            }
        }
        return if (right < 0) null else Box2(left, up, right, down)
    }

    private fun DrawnPixels.count(x: IntRange, y: IntRange, match: (Int) -> Boolean): Int {
        var total = 0
        for (row in y) for (column in x) if (match(argb(column, row))) total++
        return total
    }

    @Test fun theOpenHeaderIsTheThemes900() {
        for (dark in listOf(false, true)) {
            val drawn = draw(dark)
            val fill = checkNotNull(drawn.box(theme900(dark))) { "dark=$dark: nothing is theme 900" }
            assertEquals("dark=$dark: $PANEL by 44", PANEL / 44f, fill.width.toFloat() / fill.height, 0.2f)
            // Words on the fill, in their tokens: the title's turns over with
            // the fill, where a white one would be 1.41:1 in the dark.
            val inside = fill.left..fill.right
            val rows = fill.top..fill.bottom
            assertTrue("dark=$dark: no title ink", drawn.count(inside, rows) { DrawnPixels.matches(it, title(dark), 30) } > 20)
            assertTrue("dark=$dark: no label ink", drawn.count(inside, rows) { DrawnPixels.matches(it, label(dark), 30) } > 8)
        }
    }

    /** The corner's pixel is the host's; a quarter of 16 in, it is the fill's. */
    @Test fun theHeadersCornersAreTheControlRadius() {
        val drawn = draw(false)
        val fill = checkNotNull(drawn.box(theme900(false)))
        val dp = fill.width / PANEL
        val at = { x: Float, y: Float -> drawn.argb(fill.left + (x * dp).toInt(), fill.top + (y * dp).toInt()) }
        assertFalse("(3, 3) is inside the corner", DrawnPixels.matches(at(3f, 3f), theme900(false), 12))
        assertTrue("(6, 6) is outside the corner", DrawnPixels.matches(at(6f, 6f), theme900(false), 12))
    }

    /**
     * A closed header has a chevron to see, so its absence below means
     * something. The disabled header's end is its grey alone; the loading
     * header's has a spinner in it.
     */
    @Test fun aDisabledHeaderDrawsNoChevronAndALoadingOneASpinner() {
        for (dark in listOf(false, true)) {
            val drawn = draw(dark)
            val fill = checkNotNull(drawn.box(theme900(dark)))
            val dp = fill.width / PANEL
            val y = { dpY: Float -> fill.top + (dpY * dp).toInt() }
            val mark = (fill.left + ((PANEL - 30f) * dp).toInt())..(fill.left + ((PANEL - 8f) * dp).toInt())
            val row = { top: Float -> y(top + 14f)..y(top + 30f) }
            val off = { ground: Int -> { argb: Int -> !DrawnPixels.matches(argb, ground, 6) } }
            assertTrue("dark=$dark: the closed header's chevron is missing, so this reads nothing", drawn.count(mark, row(90f), off(page(dark))) > 10)
            val disabled = drawn.count(mark, row(142f), off(grey(dark)))
            assertTrue("dark=$dark: the disabled header draws a chevron ($disabled pixels)", disabled < 4)
            assertTrue("dark=$dark: the loading header draws no spinner", drawn.count(mark, row(194f), off(grey(dark))) > 10)
        }
    }

    /**
     * Open, then disabled or loading: the header greys and keeps its hairline,
     * so its grey is 42 inside the 44, with none of the open fill or the open
     * label's ink, over its content.
     */
    @Test fun anOpenSectionThatIsDisabledOrLoadingIsGreyNotFilled() {
        val magenta = 0xFFFF00FF.toInt()
        for (dark in listOf(false, true)) {
            for ((disabled, loading) in listOf(true to false, false to true)) {
                val name = "dark=$dark, disabled=$disabled, loading=$loading"
                val drawn = paparazzi.drawn(frames) {
                    CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                        KozmosMaterialTheme {
                            Box(Modifier.background(Color(host)).padding(16.dp)) { OpenThenInert(disabled, loading) }
                        }
                    }
                }
                val everywhere = 0 until drawn.width
                val rows = 0 until drawn.height
                val filled = drawn.count(everywhere, rows) { DrawnPixels.matches(it, theme900(dark), 2) }
                assertTrue("$name: the header draws the open fill ($filled pixels)", filled < 4)
                val openLabel = drawn.count(everywhere, rows) { DrawnPixels.matches(it, label(dark), 30) }
                assertTrue("$name: the label is the open header's ($openLabel pixels)", openLabel < 4)
                val form = checkNotNull(drawn.box(magenta)) { "$name: the open content went" }
                val header = checkNotNull(drawn.box(grey(dark), bottom = form.top)) { "$name: no grey header" }
                val dp = form.width / PANEL
                assertEquals("$name: the grey's height inside the hairline, in dp", 42f, header.height / dp, 1f)
                assertEquals("$name: 8 under the header, in dp", 9f, (form.top - header.bottom - 1) / dp, 1.2f)
            }
        }
    }

    /** The icon, magenta here, starts 9 in, at the right when right to left. */
    @Test fun theIconStartsTheHeaderInEitherDirection() {
        val magenta = 0xFFFF00FF.toInt()
        for (rtl in listOf(false, true)) {
            val drawn = draw(false, rtl)
            val fill = checkNotNull(drawn.box(theme900(false)))
            val dp = fill.width / PANEL
            val icon = checkNotNull(drawn.box(magenta, top = fill.top, bottom = fill.bottom)) { "rtl=$rtl: no icon" }
            val inset = (if (rtl) fill.right - icon.right else icon.left - fill.left) / dp
            assertTrue("rtl=$rtl: the icon starts $inset in; expected 9", abs(inset - 9f) < 1.2f)
            assertEquals("rtl=$rtl: the icon's width, in dp", 20f, icon.width / dp, 1.2f)
        }
    }
}
