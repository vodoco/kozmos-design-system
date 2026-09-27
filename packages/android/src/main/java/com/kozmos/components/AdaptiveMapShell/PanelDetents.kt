package com.kozmos.components.adaptivemapshell

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.math.abs
import kotlin.math.roundToInt

// The bottom sheet's detents and the rules that move between them: the
// prototype's, driven and measured (docs/pointr-prototype-initial-sheet-
// 2026-09-20.md §1–§2), shared with the iOS and web shells. Pure, so every
// rule is tested without a finger.

/** Where the bottom sheet can rest. */
sealed class KozmosMapPanelDetent {
    /**
     * A peek: a fifth of the shell, or the row marked with `Modifier.kozmosPanelPeekAnchor()`; with no
     * row marked, tall enough for the whole panel header.
     */
    data object Collapsed : KozmosMapPanelDetent()

    /** The resting height, where the map and the sheet share the shell. */
    data object Medium : KozmosMapPanelDetent()

    /** Nearly the whole shell, for reading a long sheet. */
    data object Large : KozmosMapPanelDetent()

    /** As tall as the sheet's content, between collapsed and large; medium until measured. */
    data object Content : KozmosMapPanelDetent()

    /** A share of the shell's height. */
    data class Fraction(val value: Float) : KozmosMapPanelDetent()

    /** An exact height. */
    data class Height(val value: Dp) : KozmosMapPanelDetent()

    val description: String
        get() = when (this) {
            Collapsed -> "Collapsed"
            Medium -> "Half height"
            Large -> "Expanded"
            Content -> "Fitted to content"
            is Fraction -> "${(value * 100).roundToInt()} percent"
            is Height -> "${value.value.roundToInt()} dp"
        }

    companion object {
        const val COLLAPSED_FRACTION = 0.2f
        const val MEDIUM_FRACTION = 0.54f
        const val LARGE_FRACTION = 0.94f

        /** A collapsed sheet still has to fit the handle and a header row. */
        val collapsedFloor = 112.dp

        /** …but never takes more than this of a short shell. */
        const val COLLAPSED_CAP = 0.4f

        /** An anchored peek stays within these shares of the shell. */
        const val PEEK_FLOOR = 0.24f
        const val PEEK_CAP = 0.72f

        /** The margin under a peek anchor. */
        val peekMargin = 16.dp

        /** Outside this range there is either no map or no sheet worth showing. */
        const val MIN_FRACTION = 0.12f
        const val MAX_FRACTION = 0.94f

        /** The collapsed detent when the sheet's content marks a peek anchor. */
        fun anchoredCollapsedHeight(peekBottom: Dp, shellHeight: Dp): Dp =
            (peekBottom + peekMargin).coerceIn(shellHeight * PEEK_FLOOR, shellHeight * PEEK_CAP)

        /**
         * The collapsed detent when the sheet has a panel header and no peek
         * anchor: the plain collapsed height, grown only as far as the
         * header's bottom edge and the peek margin need, and never over three
         * quarters of the shell (row 73). A header is not an anchor: an
         * anchored peek's quarter-of-the-shell floor would grow the
         * prototype's fifth under a search row that already fits in it.
         */
        fun headerCollapsedHeight(headerBottom: Dp, shellHeight: Dp): Dp =
            maxOf(Collapsed.height(shellHeight), minOf(headerBottom + peekMargin, shellHeight * PEEK_CAP))
    }
}

/** What the shell has measured about the sheet's content. */
data class KozmosPanelMeasures(
    /** The content's own height, for the content detent; zero until measured. */
    val contentHeight: Dp = 0.dp,
    /** The bottom edge of the peek anchor — the panel header's, else the content's — from the sheet's top; zero when none. */
    val peekBottom: Dp = 0.dp,
    /** The panel header's bottom edge from the sheet's top, the handle's row included; zero without one. */
    val headerBottom: Dp = 0.dp
)

/** A detent's height in a shell of [shellHeight]. */
fun KozmosMapPanelDetent.height(shellHeight: Dp, measures: KozmosPanelMeasures = KozmosPanelMeasures()): Dp {
    val largest = shellHeight * KozmosMapPanelDetent.LARGE_FRACTION
    return when (this) {
        KozmosMapPanelDetent.Collapsed ->
            if (measures.peekBottom > 0.dp) {
                KozmosMapPanelDetent.anchoredCollapsedHeight(measures.peekBottom, shellHeight)
            } else if (measures.headerBottom > 0.dp) {
                KozmosMapPanelDetent.headerCollapsedHeight(measures.headerBottom, shellHeight)
            } else {
                // Proportional on a tall phone, but never so short on a
                // landscape shell that the handle and header stop fitting.
                maxOf(shellHeight * KozmosMapPanelDetent.COLLAPSED_FRACTION, KozmosMapPanelDetent.collapsedFloor)
                    .coerceAtMost(shellHeight * KozmosMapPanelDetent.COLLAPSED_CAP)
            }
        KozmosMapPanelDetent.Medium -> shellHeight * KozmosMapPanelDetent.MEDIUM_FRACTION
        KozmosMapPanelDetent.Large -> largest
        KozmosMapPanelDetent.Content ->
            if (measures.contentHeight <= 0.dp) {
                shellHeight * KozmosMapPanelDetent.MEDIUM_FRACTION
            } else {
                measures.contentHeight.coerceIn(KozmosMapPanelDetent.Collapsed.height(shellHeight, measures), largest)
            }
        is KozmosMapPanelDetent.Fraction ->
            shellHeight * value.coerceIn(KozmosMapPanelDetent.MIN_FRACTION, KozmosMapPanelDetent.MAX_FRACTION)
        is KozmosMapPanelDetent.Height -> value.coerceIn(0.dp, largest)
    }
}

/** The offered detents in ascending height, one per distinct height. */
fun orderPanelDetents(
    detents: List<KozmosMapPanelDetent>,
    shellHeight: Dp,
    measures: KozmosPanelMeasures = KozmosPanelMeasures()
): List<KozmosMapPanelDetent> {
    val seen = mutableSetOf<Int>()
    return detents
        .sortedBy { it.height(shellHeight, measures).value }
        .filter { seen.add(it.height(shellHeight, measures).value.roundToInt()) }
}

/** The offered detent closest to a height: where a drag snaps once it ends. */
fun nearestPanelDetent(
    detents: List<KozmosMapPanelDetent>,
    height: Dp,
    shellHeight: Dp,
    measures: KozmosPanelMeasures = KozmosPanelMeasures()
): KozmosMapPanelDetent? =
    orderPanelDetents(detents, shellHeight, measures).minByOrNull { abs((it.height(shellHeight, measures) - height).value) }

/** What a drag that starts on the sheet does, decided once at its first move. */
enum class KozmosPanelDragKind {
    /** Left to the content: a sideways move, or a scroll at the largest detent. */
    Content,

    /** Moves the sheet between its detents. */
    Sheet
}

/**
 * The prototype's rule: a sideways move is the content's; at the largest
 * detent an upward drag scrolls the content, and a downward one scrolls it
 * back to its top before the sheet moves; below the largest detent every
 * vertical drag moves the sheet. The nested-scroll connection applies the
 * same rule to a scrollable child, delta by delta.
 */
fun decidePanelDrag(dx: Float, dy: Float, atLargestDetent: Boolean, scrollOffset: Float): KozmosPanelDragKind =
    when {
        abs(dx) > abs(dy) -> KozmosPanelDragKind.Content
        atLargestDetent && (dy < 0f || scrollOffset > 0f) -> KozmosPanelDragKind.Content
        else -> KozmosPanelDragKind.Sheet
    }
