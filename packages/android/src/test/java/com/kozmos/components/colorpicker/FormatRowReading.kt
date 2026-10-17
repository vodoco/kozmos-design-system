package com.kozmos.components.colorpicker

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.KeptFrames
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.abs
import kotlin.math.ceil

/**
 * A Pixel 5 made wide enough for a 430dp picker: its own screen is 393dp,
 * and a host wider than the screen is held to it. Nothing is recorded or
 * compared, so these tests leave no image behind.
 */
internal fun formatRowPaparazzi(): Paparazzi = Paparazzi(
    deviceConfig = DeviceConfig.PIXEL_5.copy(screenWidth = 1320, screenHeight = 3000),
    snapshotHandler = KeptFrames().handler
)

/**
 * One part of the open colour picker's format row — the format menu, a value
 * box, the opacity box or its "%" — as it was laid out, in dp. [start] is
 * measured from the picker's inline-start edge, so a right-to-left row reads
 * as a left-to-right one does; [top] from the picker's top.
 */
internal data class FormatRowPart(
    val words: String,
    /** The box: the part's outermost layout bounds, its border included. */
    val start: Float,
    val top: Float,
    val width: Float,
    val height: Float,
    /** The text's own layout box, inside the box's padding. */
    val textStart: Float,
    val textTop: Float,
    val textWidth: Float,
    val textHeight: Float,
    /** How wide the text is on one line, in whole pixels, as a layout measures it. */
    val textOneLineWidth: Float,
    /** How tall the text's lines are: more than [textHeight], and they are cut. */
    val linesHeight: Float,
    val lines: Int,
    /** The text is drawn past its own box, so its layout cut it. */
    val overflows: Boolean,
    /** Whether the part takes a press, as the format menu does. */
    val clickable: Boolean
) {
    val end: Float get() = start + width
    val bottom: Float get() = top + height
    val middle: Float get() = top + height / 2

    /** What the box's border and padding add to its text's width. */
    val inset: Float get() = width - textWidth

    override fun toString(): String =
        "\"$words\" box ${f(start)}–${f(end)} × ${f(top)}–${f(bottom)} (${f(width)} × ${f(height)}), " +
            "text ${f(textWidth)} × ${f(textHeight)} of ${f(linesHeight)} in $lines line${if (lines == 1) "" else "s"}" +
            if (overflows) ", cut" else ""
}

private fun f(value: Float): String = "%.2f".format(value)

/** A node TalkBack moves to, as the merged tree gives it. */
internal data class SpokenPart(val words: String, val description: String?, val clickable: Boolean)

/** The open picker's format row, as laid out. */
internal class FormatRow(
    /** The picker's width as laid out, in whole pixels: 390dp at 2.75px a dp is drawn 1073px. */
    val width: Float,
    /** Pixels a dp. */
    val px: Float,
    val fontScale: Float,
    val rtl: Boolean,
    val format: KozmosColorPickerFormat,
    /** In the order they are composed, which is the order they are read. */
    val parts: List<FormatRowPart>,
    /** Where the slider above the row ends and the palette field below it starts. */
    val above: Float,
    val below: Float,
    /** The merged nodes that hold the row's words, in the tree's order. */
    val spoken: List<SpokenPart>
) {
    /** The panel's padding: the row is laid out between these. */
    val innerStart: Float get() = 12f
    val innerEnd: Float get() = width - 12f

    /** [dp] as the layout rounds it to whole pixels. */
    fun rounded(dp: Float): Float = Math.round(dp * px) / px

    /**
     * The parts by line, each from its inline start: parts are one line when
     * their middles are within a dp, as the row centres every part on its
     * line. Read top to bottom and each line from its start, as TalkBack
     * reads siblings by place.
     */
    val lines: List<List<FormatRowPart>>
        get() {
            val out = mutableListOf<MutableList<FormatRowPart>>()
            for (part in parts.sortedBy { it.middle }) {
                val line = out.lastOrNull()
                if (line != null && abs(line.first().middle - part.middle) < 1f) line += part else out += mutableListOf(part)
            }
            return out.map { line -> line.sortedBy { it.start } }
        }

    override fun toString(): String =
        "$format at ${f(width)}dp, font scale $fontScale, ${if (rtl) "right to left" else "left to right"}:\n" +
            parts.joinToString("\n") { "  $it" }
}

/** Every node under this one, this one first. */
private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

private fun SemanticsNode.words(): String? =
    config.getOrNull(SemanticsProperties.Text)?.joinToString { it.text }

/**
 * Draws the picker open, [width] wide, at [fontScale], and reads its format
 * row off the laid-out tree: each part's box is its layout node's outermost
 * bounds, its text the layout node's own, and the text's lines come from
 * the layout result its semantics hand TalkBack.
 */
internal fun Paparazzi.formatRow(
    width: Float,
    fontScale: Float,
    rtl: Boolean,
    format: KozmosColorPickerFormat,
    dark: Boolean = false,
    value: String = "#135BEC",
    paletteLabel: String = "Kozmos Design System 2.0"
): FormatRow {
    var read: FormatRow? = null
    snapshot {
        val view = LocalView.current
        val device = LocalDensity.current
        CompositionLocalProvider(
            LocalDensity provides Density(device.density, fontScale),
            LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
            LocalKozmosUseDarkTokens provides dark
        ) {
            KozmosMaterialTheme {
                Box(Modifier.fillMaxSize()) {
                    Box(
                        Modifier
                            .width(width.dp)
                            .onGloballyPositioned { host ->
                                read = readFormatRow(view as ViewRootForTest, host, device.density, fontScale, rtl, format, paletteLabel)
                            }
                    ) {
                        KozmosColorPicker(
                            value = value,
                            onValueChange = {},
                            paletteLabel = paletteLabel,
                            format = format,
                            defaultExpanded = true
                        )
                    }
                }
            }
        }
    }
    return checkNotNull(read) { "the picker was never laid out" }
}

private fun readFormatRow(
    view: ViewRootForTest,
    host: LayoutCoordinates,
    px: Float,
    fontScale: Float,
    rtl: Boolean,
    format: KozmosColorPickerFormat,
    paletteLabel: String
): FormatRow {
    val hostBounds = host.boundsInRoot()
    fun start(left: Float, size: Float): Float =
        if (rtl) (hostBounds.right - (left + size)) / px else (left - hostBounds.left) / px
    fun top(y: Float): Float = (y - hostBounds.top) / px

    val texts = view.semanticsOwner.unmergedRootSemanticsNode.flatten().filter { it.words() != null }
    val slider = texts.single { it.words() == "Opacity" }
    val palette = texts.single { it.words() == paletteLabel }
    val above = top(slider.positionInRoot.y + slider.size.height)
    val below = top(palette.positionInRoot.y)
    fun inRow(node: SemanticsNode): Boolean = top(node.positionInRoot.y).let { it > above && it < below }
    val parts = texts.filter(::inRow).map { node ->
        val layouts = mutableListOf<TextLayoutResult>()
        node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(layouts)
        val layout = layouts.single()
        val info = node.layoutInfo
        // The part's outermost coordinates are its first modifier's; its
        // own, inside every modifier, are the text's.
        val outer = info.getModifierInfo().firstOrNull()?.coordinates ?: info.coordinates
        val inner = info.coordinates
        val boxAt = outer.positionInRoot()
        val textAt = inner.positionInRoot()
        FormatRowPart(
            words = node.words().orEmpty(),
            start = start(boxAt.x, outer.size.width.toFloat()),
            top = top(boxAt.y),
            width = outer.size.width / px,
            height = outer.size.height / px,
            textStart = start(textAt.x, inner.size.width.toFloat()),
            textTop = top(textAt.y),
            textWidth = inner.size.width / px,
            textHeight = inner.size.height / px,
            textOneLineWidth = ceil(layout.multiParagraph.intrinsics.maxIntrinsicWidth) / px,
            linesHeight = layout.multiParagraph.height / px,
            lines = layout.lineCount,
            overflows = layout.hasVisualOverflow,
            clickable = node.config.contains(SemanticsActions.OnClick)
        )
    }
    val rowWords = parts.map { it.words }.toSet()
    val spoken = view.semanticsOwner.rootSemanticsNode.flatten()
        .filter { it.words() in rowWords && inRow(it) }
        .map {
            SpokenPart(
                words = it.words().orEmpty(),
                description = it.config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString(),
                clickable = it.config.contains(SemanticsActions.OnClick)
            )
        }
    return FormatRow(hostBounds.width / px, px, fontScale, rtl, format, parts, above, below, spoken)
}
