package com.kozmos.components.colorpicker

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.LayoutInfo
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
import kotlin.math.ceil

/**
 * A Pixel 5 made wide enough for a 430dp picker: its own screen is 393dp,
 * and a host wider than the screen is held to it. Nothing is recorded or
 * compared, so these tests leave no image behind.
 */
internal fun paletteFieldPaparazzi(): Paparazzi = Paparazzi(
    deviceConfig = DeviceConfig.PIXEL_5.copy(screenWidth = 1320, screenHeight = 3000),
    snapshotHandler = KeptFrames().handler
)

/** A box as laid out, in dp: [start] from the picker's inline-start edge, [top] from its top. */
internal data class PaletteBox(val start: Float, val top: Float, val width: Float, val height: Float) {
    val end: Float get() = start + width
    val bottom: Float get() = top + height
    val middle: Float get() = top + height / 2

    override fun toString(): String = "${f(start)}–${f(end)} × ${f(top)}–${f(bottom)} (${f(width)} × ${f(height)})"
}

/**
 * The open picker's palette field, the box under the format row that names
 * the palette, as it was laid out.
 */
internal data class PaletteField(
    /** The picker's width as laid out. */
    val width: Float,
    /** Pixels a dp. */
    val px: Float,
    val fontScale: Float,
    val rtl: Boolean,
    val dark: Boolean,
    /** The field: its outermost layout bounds, its border included. */
    val box: PaletteBox,
    /** Inside the field's padding. */
    val inner: PaletteBox,
    /** The panel's content box, inside its padding. */
    val panelInner: PaletteBox,
    /** The label's own layout box. */
    val text: PaletteBox,
    /** The caret at the field's end. */
    val caret: PaletteBox,
    /** How wide the label is on one line, as a layout measures it. */
    val textOneLineWidth: Float,
    /** How tall the label's lines are: more than the label's box, and they are cut. */
    val linesHeight: Float,
    val lines: Int,
    /** The lines whose bottoms are inside the label's box: the ones a reader sees whole. */
    val visibleLines: Int,
    /** What the reader sees of the label, an ellipsis included. */
    val shown: String,
    val ellipsized: Boolean,
    /** What TalkBack reads for the label. */
    val spoken: String
) {
    /** [dp] as the layout rounds it to whole pixels. */
    fun rounded(dp: Float): Float = Math.round(dp * px) / px

    /** The label's lines are taller than its box: its top or bottom is cut. */
    val cut: Boolean get() = linesHeight > text.height + 0.01f

    override fun toString(): String =
        "${f(width)}dp, font scale $fontScale, ${if (rtl) "right to left" else "left to right"}${if (dark) ", dark" else ""}: " +
            "field $box, inside its padding $inner; label $text, ${f(textOneLineWidth)} wide on one line, " +
            "${f(linesHeight)} of lines in $lines line${if (lines == 1) "" else "s"}, $visibleLines shown whole: \"$shown\"" +
            (if (ellipsized) ", ellipsized" else "") + (if (cut) ", cut" else "") + "; caret $caret"
}

private fun f(value: Float): String = "%.2f".format(value)

/** Every node under this one, this one first. */
private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

private fun SemanticsNode.words(): String? =
    config.getOrNull(SemanticsProperties.Text)?.joinToString { it.text }

/**
 * A layout node's children. [LayoutInfo] gives a node's parent but not its
 * children, and the caret is an icon with no semantics, so it is found as
 * the last child of the field's layout node, through the node's own list.
 */
private fun LayoutInfo.childInfos(): List<LayoutInfo> {
    val getter = javaClass.methods.first { it.name.startsWith("getChildren") && it.parameterCount == 0 }
    @Suppress("UNCHECKED_CAST")
    return (getter.invoke(this) as List<Any>).map { it as LayoutInfo }
}

/** The node's outermost coordinates: its first modifier's, or its own. */
private fun LayoutInfo.outer(): LayoutCoordinates = getModifierInfo().firstOrNull()?.coordinates ?: coordinates

private fun LayoutInfo.hasBorder(): Boolean =
    getModifierInfo().any { it.modifier.javaClass.simpleName.contains("Border") }

/**
 * Draws the picker open, [width] wide, at [fontScale], and reads its palette
 * field off the laid-out tree: the field is the nearest layout node round the
 * label that draws a border, its box that node's outermost bounds, and the
 * label's lines come from the layout result its semantics hand TalkBack.
 */
internal fun Paparazzi.paletteField(
    width: Float,
    fontScale: Float,
    rtl: Boolean = false,
    dark: Boolean = false,
    paletteLabel: String = "Kozmos Design System 2.0"
): PaletteField {
    var read: PaletteField? = null
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
                                read = readPaletteField(view as ViewRootForTest, host, device.density, fontScale, rtl, dark, paletteLabel)
                            }
                    ) {
                        KozmosColorPicker(
                            value = "#135BEC",
                            onValueChange = {},
                            paletteLabel = paletteLabel,
                            defaultExpanded = true
                        )
                    }
                }
            }
        }
    }
    return checkNotNull(read) { "the picker was never laid out" }
}

private fun readPaletteField(
    view: ViewRootForTest,
    host: LayoutCoordinates,
    px: Float,
    fontScale: Float,
    rtl: Boolean,
    dark: Boolean,
    paletteLabel: String
): PaletteField {
    val hostBounds = host.boundsInRoot()
    fun box(at: LayoutCoordinates): PaletteBox {
        val p = at.positionInRoot()
        val w = at.size.width.toFloat()
        val start = if (rtl) hostBounds.right - (p.x + w) else p.x - hostBounds.left
        return PaletteBox(start / px, (p.y - hostBounds.top) / px, w / px, at.size.height / px)
    }

    val label = view.semanticsOwner.unmergedRootSemanticsNode.flatten().single { it.words() == paletteLabel }
    val layouts = mutableListOf<TextLayoutResult>()
    label.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(layouts)
    val layout = layouts.single()

    var field: LayoutInfo = checkNotNull(label.layoutInfo.parentInfo) { "the label has no parent" }
    while (!field.hasBorder()) field = checkNotNull(field.parentInfo) { "no bordered box round the label" }
    val panel = checkNotNull(field.parentInfo) { "the field has no panel" }
    val caret = field.childInfos().last()

    val textHeightPx = layout.size.height.toFloat()
    val visible = (0 until layout.lineCount).filter { layout.getLineBottom(it) <= textHeightPx + 0.5f }
    val ellipsized = visible.any { layout.isLineEllipsized(it) }
    val drawn = layout.layoutInput.text.text
    val shown = visible.joinToString("") { line ->
        drawn.substring(layout.getLineStart(line), layout.getLineEnd(line, visibleEnd = true))
    } + if (ellipsized) "…" else ""

    val merged = view.semanticsOwner.rootSemanticsNode.flatten().filter { it.words()?.contains(paletteLabel) == true }

    return PaletteField(
        width = hostBounds.width / px,
        px = px,
        fontScale = fontScale,
        rtl = rtl,
        dark = dark,
        box = box(field.outer()),
        inner = box(field.coordinates),
        panelInner = box(panel.coordinates),
        text = box(label.layoutInfo.coordinates),
        caret = box(caret.outer()),
        textOneLineWidth = ceil(layout.multiParagraph.intrinsics.maxIntrinsicWidth) / px,
        linesHeight = layout.multiParagraph.height / px,
        lines = layout.lineCount,
        visibleLines = visible.size,
        shown = shown,
        ellipsized = ellipsized,
        spoken = merged.joinToString(" | ") { it.words().orEmpty() }
    )
}
