package com.kozmos.components.surface

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.breadcrumb.KozmosBreadcrumb
import com.kozmos.components.drawn
import com.kozmos.components.fieldwrapper.KozmosFieldWrapper
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.savelocationcard.KozmosSaveLocationCard
import com.kozmos.components.segmentedcontrol.KozmosSegmentedControl
import com.kozmos.components.table.KozmosTableHeaderCell
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.components.timeline.KozmosTimelineTime
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Parts that drew their muted text or icon in foreground/500 itself, not
 * through `kozmosMutedForeground`, draw the muted colour, foreground/400, as
 * React draws the same part with `text-muted-foreground`: a field's helper
 * text, a timeline's time, a segmented control's idle segment (on
 * background/100, the contract's other muted pair), the save-location card's
 * edit pencil, a breadcrumb's earlier crumb and a table's header.
 *
 * Each part is drawn in light on the page at twice the density, so its
 * strokes cover whole pixels; the colour it draws is the darkest pixel in the
 * box TalkBack is told the text or the pencil is in, held to a swatch of the
 * token within 10 a channel. Foreground/500 is 23 to 28 a channel away.
 */
class KozmosMutedPartsInkTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private var root = IntSize.Zero
    private var boxes: Map<String, Rect> = emptyMap()

    private fun SemanticsNode.named(into: MutableMap<String, Rect> = mutableMapOf()): Map<String, Rect> {
        config.getOrNull(SemanticsProperties.Text)?.let { text -> into[text.joinToString { it.text }] = boundsInRoot }
        config.getOrNull(SemanticsProperties.ContentDescription)?.let { said -> into[said.joinToString()] = boundsInRoot }
        children.forEach { it.named(into) }
        return into
    }

    private fun drawn(content: @Composable () -> Unit): DrawnPixels = paparazzi.drawn(frames) {
        val view = LocalView.current
        val density = LocalDensity.current
        CompositionLocalProvider(
            LocalKozmosUseDarkTokens provides false,
            LocalDensity provides Density(density.density * 2f, density.fontScale)
        ) {
            KozmosMaterialTheme {
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(KozmosThemeTokens.primitivesColorsBackground0)
                        .onGloballyPositioned {
                            root = it.size
                            boxes = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.named()
                        }
                        .padding(16.dp)
                ) { content() }
            }
        }
    }

    private fun swatch(): Int {
        var colour = 0
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                colour = KozmosThemeTokens.primitivesColorsForeground400.toArgb()
            }
        }
        return colour
    }

    /** The darkest opaque pixel inside [box], in root pixels. */
    private fun darkest(drawn: DrawnPixels, box: Rect): Int? {
        val scale = drawn.width.toFloat() / root.width
        var found: Int? = null
        var lightest = Int.MAX_VALUE
        val xs = (box.left * scale).toInt().coerceAtLeast(0)..(box.right * scale).toInt().coerceAtMost(drawn.width - 1)
        val ys = (box.top * scale).toInt().coerceAtLeast(0)..(box.bottom * scale).toInt().coerceAtMost(drawn.height - 1)
        for (y in ys) for (x in xs) {
            val argb = drawn.argb(x, y)
            if (argb ushr 24 <= 240) continue
            val lightness = DrawnPixels.lightness(argb)
            if (lightness < lightest) { lightest = lightness; found = argb }
        }
        return found
    }

    private class Part(val name: String, val target: String, val content: @Composable () -> Unit)

    private val parts = listOf(
        Part("FieldWrapper's helper text", "Helper text") {
            KozmosFieldWrapper(helperText = "Helper text") { Box(Modifier.size(1.dp)) }
        },
        Part("TimelineTime", "09:00") { KozmosTimelineTime("09:00") },
        Part("SegmentedControl's idle segment", "Lift") {
            // Full width: at twice the density two segments at their least width
            // run off the page.
            KozmosSegmentedControl(options = listOf("Walk", "Lift"), selectedIndex = 0, onOptionSelected = {}, fullWidth = true)
        },
        Part("SaveLocationCard's edit pencil", "Edit location note") {
            KozmosSaveLocationCard(title = "Gate 12", description = "Terminal 2", isSaved = true, onEditNote = {})
        },
        Part("Breadcrumb's earlier crumb", "Home") { KozmosBreadcrumb(items = listOf("Home", "Gate 12"), onItemClick = {}) },
        Part("TableHeaderCell", "Name") { Row { KozmosTableHeaderCell("Name") } }
    )

    @Test
    fun aPartsMutedTextOrIconIsTheMutedColour() {
        val muted = swatch()
        val wrong = mutableListOf<String>()
        for (part in parts) {
            val drawn = drawn(part.content)
            val box = boxes[part.target]
            if (box == null) {
                wrong += "${part.name}: \"${part.target}\" is not laid out (${boxes.keys})"
                continue
            }
            val ink = darkest(drawn, box)
            println("Muted Android, ${part.name}: ${ink?.let(DrawnPixels::hex) ?: "nothing"}, foreground/400 ${DrawnPixels.hex(muted)}")
            if (ink == null || !DrawnPixels.matches(ink, muted, tolerance = 10)) {
                wrong += "${part.name}: drew ${ink?.let(DrawnPixels::hex) ?: "nothing"}, not foreground/400 ${DrawnPixels.hex(muted)}"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
