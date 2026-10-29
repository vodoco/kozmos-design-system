package com.kozmos.components.card

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.AlignmentLine
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.Measured
import androidx.compose.ui.layout.ParentDataModifier
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.layout.VerticalAlignmentLine
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sign

/**
 * How much room a card gives its content.
 *
 * [Default] is 24 on every side, the card as the system has always drawn it.
 * [Compact] is 16, for a card that is one setting in a column of settings
 * rather than a thing on its own (GAP-034).
 *
 * It is set on [KozmosCard] and reaches the parts through a CompositionLocal,
 * because a card padded one amount at the header and another at the content is
 * the bug, not the fix.
 */
enum class KozmosCardPadding {
    Default,
    Compact;

    val length: Dp
        get() = when (this) {
            Default -> KozmosDimensions.primitivesLayoutSpacing300
            Compact -> KozmosDimensions.primitivesLayoutSpacing200
        }
}

private val LocalKozmosCardPadding = compositionLocalOf { KozmosCardPadding.Default }

@Composable
fun KozmosCard(
    modifier: Modifier = Modifier,
    padding: KozmosCardPadding = KozmosCardPadding.Default,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.border(
            1.dp,
            KozmosThemeTokens.primitivesColorsBackground200,
            RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer)
        ),
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer),
        colors = CardDefaults.cardColors(
            containerColor = KozmosThemeTokens.primitivesColorsBackground0,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        content = {
            CompositionLocalProvider(LocalKozmosCardPadding provides padding) {
                val policy = remember(padding) { KozmosCardColumnPolicy(padding.length) }
                Layout(content = { KozmosCardColumnScope.content() }, measurePolicy = policy)
            }
        }
    )
}

/*
 * The card's column (GAP-194).
 *
 * KozmosCardContent and KozmosCardFooter pad their sides and bottom only,
 * because a header above them has already paid the top. With no header, the
 * one that came first touched the card's top edge. A part cannot see where it
 * sits among its siblings, but the layout they are children of can: so the
 * card is a layout of its own, which reads its first child's parent data and,
 * if that child is content or a footer, lays its children out that far down,
 * by the card's padding. It is React's rule, where the card sets the top on
 * its own first child (`[&>:first-child]`): a header-led card is drawn as
 * before; a part inside a wrapper (a Column around the parts) is not the
 * card's child and is left alone; a composable placed before the part keeps it
 * from being first; and a nested card reads only its own children.
 *
 * Below the top, the children are measured and placed as the Column the card
 * was: top to bottom with no spacing, at the start, with the ColumnScope its
 * content has always had — weight, align and alignBy. Column's own measure
 * policy cannot be handed another layout's children (it is internal to
 * foundation-layout), and its parent data class is internal too, so the card's
 * scope records them in parent data of its own and this policy follows
 * Column's arithmetic: the unweighted children first, each offered what the
 * ones before it left; the weighted ones sharing what is left by weight, the
 * rounding spread over the first; and the intrinsic sizes Column reports.
 * KozmosCardColumnTest holds it to a Column drawing the same children.
 */

/** What the card's column reads off one child. */
private class KozmosCardChild {
    var weight = 0f
    var fill = true
    var alignment: Alignment.Horizontal? = null
    var alignBy: ((Measured) -> Int)? = null

    /** Content and a footer: the card pays its padding above them when they are its first child. */
    var leads = false
}

private fun Any?.cardChild(): KozmosCardChild = this as? KozmosCardChild ?: KozmosCardChild()

private val Measured.cardChild: KozmosCardChild? get() = parentData as? KozmosCardChild

private val IntrinsicMeasurable.cardWeight: Float get() = (parentData as? KozmosCardChild)?.weight ?: 0f

private data class KozmosCardWeight(val weight: Float, val fill: Boolean) : ParentDataModifier {
    override fun Density.modifyParentData(parentData: Any?) =
        parentData.cardChild().also { it.weight = weight; it.fill = fill }
}

private data class KozmosCardAlign(val alignment: Alignment.Horizontal) : ParentDataModifier {
    override fun Density.modifyParentData(parentData: Any?) =
        parentData.cardChild().also { it.alignment = alignment; it.alignBy = null }
}

private data class KozmosCardAlignByLine(val line: VerticalAlignmentLine) : ParentDataModifier {
    override fun Density.modifyParentData(parentData: Any?) =
        parentData.cardChild().also { child -> child.alignBy = { it[line] }; child.alignment = null }
}

private data class KozmosCardAlignByBlock(val block: (Measured) -> Int) : ParentDataModifier {
    override fun Density.modifyParentData(parentData: Any?) =
        parentData.cardChild().also { it.alignBy = block; it.alignment = null }
}

/** Marks content and a footer, whose top the card pays when they come first. */
private object KozmosCardLeads : ParentDataModifier {
    override fun Density.modifyParentData(parentData: Any?) = parentData.cardChild().also { it.leads = true }
}

/** The ColumnScope the card's content has always had, read by the card's own column. */
private object KozmosCardColumnScope : ColumnScope {
    override fun Modifier.weight(weight: Float, fill: Boolean): Modifier {
        require(weight > 0.0) { "invalid weight $weight; must be greater than zero" }
        return this.then(KozmosCardWeight(weight.coerceAtMost(Float.MAX_VALUE), fill))
    }

    override fun Modifier.align(alignment: Alignment.Horizontal): Modifier = this.then(KozmosCardAlign(alignment))

    override fun Modifier.alignBy(alignmentLine: VerticalAlignmentLine): Modifier =
        this.then(KozmosCardAlignByLine(alignmentLine))

    override fun Modifier.alignBy(alignmentLineBlock: (Measured) -> Int): Modifier =
        this.then(KozmosCardAlignByBlock(alignmentLineBlock))
}

private class KozmosCardColumnPolicy(private val lead: Dp) : MeasurePolicy {
    /** The top the card pays: its padding, when its first child is content or a footer. */
    private fun Density.top(children: List<IntrinsicMeasurable>): Int =
        if ((children.firstOrNull()?.parentData as? KozmosCardChild)?.leads == true) lead.roundToPx() else 0

    override fun MeasureScope.measure(measurables: List<Measurable>, constraints: Constraints): MeasureResult {
        val top = top(measurables)
        val bounded = constraints.maxHeight != Constraints.Infinity
        val room = if (bounded) (constraints.maxHeight - top).coerceAtLeast(0) else Constraints.Infinity
        val placeables = arrayOfNulls<Placeable>(measurables.size)
        var fixed = 0
        var widest = 0
        var totalWeight = 0f
        var weighted = 0

        // The unweighted children, in order, each offered what the ones before it left.
        measurables.forEachIndexed { index, child ->
            val weight = (child.parentData as? KozmosCardChild)?.weight ?: 0f
            if (weight > 0f) {
                totalWeight += weight
                weighted++
            } else {
                val placeable = child.measure(
                    Constraints(
                        maxWidth = constraints.maxWidth,
                        maxHeight = if (bounded) (room - fixed).coerceAtLeast(0) else Constraints.Infinity
                    )
                )
                fixed += placeable.height
                widest = max(widest, placeable.width)
                placeables[index] = placeable
            }
        }

        // The weighted children share what is left, by weight.
        var weightedSpace = 0
        if (weighted > 0) {
            val target = if (bounded) room else (constraints.minHeight - top).coerceAtLeast(0)
            val remaining = (target - fixed).coerceAtLeast(0)
            val unit = remaining / totalWeight
            var remainder = remaining - measurables.sumOf { child ->
                ((child.parentData as? KozmosCardChild)?.weight ?: 0f).let { (unit * it).roundToInt() }
            }
            measurables.forEachIndexed { index, child ->
                if (placeables[index] == null) {
                    val data = child.parentData as KozmosCardChild
                    val share = remainder.sign
                    remainder -= share
                    val height = max(0, (unit * data.weight).roundToInt() + share)
                    val placeable = child.measure(
                        Constraints(
                            minHeight = if (data.fill && height != Constraints.Infinity) height else 0,
                            maxHeight = height,
                            maxWidth = constraints.maxWidth
                        )
                    )
                    weightedSpace += placeable.height
                    widest = max(widest, placeable.width)
                    placeables[index] = placeable
                }
            }
            weightedSpace = weightedSpace.coerceIn(0, if (bounded) (room - fixed).coerceAtLeast(0) else Int.MAX_VALUE)
        }

        // Children aligned by a line line up on it.
        var beforeLine = 0
        var afterLine = 0
        placeables.forEach { placeable ->
            val alignBy = placeable!!.cardChild?.alignBy ?: return@forEach
            val position = alignBy(placeable)
            val specified = position != AlignmentLine.Unspecified
            beforeLine = max(beforeLine, if (specified) position else 0)
            afterLine = max(afterLine, placeable.width - if (specified) position else placeable.width)
        }

        val height = max(top + fixed + weightedSpace, constraints.minHeight)
        val width = max(widest, max(constraints.minWidth, beforeLine + afterLine))
        return layout(width, height) {
            var y = top
            placeables.forEach { placeable ->
                placeable!!
                val child = placeable.cardChild
                val alignBy = child?.alignBy
                val x = if (alignBy != null) {
                    val position = alignBy(placeable)
                    if (position == AlignmentLine.Unspecified) {
                        0
                    } else {
                        val line = beforeLine - position
                        if (layoutDirection == LayoutDirection.Rtl) width - placeable.width - line else line
                    }
                } else {
                    (child?.alignment ?: Alignment.Start).align(0, width - placeable.width, layoutDirection)
                }
                placeable.place(x, y)
                y += placeable.height
            }
        }
    }

    // Column's intrinsic sizes, with the top added along the column.

    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int) =
        top(measurables) + intrinsicHeight(measurables) { minIntrinsicHeight(width) }

    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int) =
        top(measurables) + intrinsicHeight(measurables) { maxIntrinsicHeight(width) }

    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int) =
        intrinsicWidth(measurables, below(height, top(measurables))) { minIntrinsicWidth(it) }

    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int) =
        intrinsicWidth(measurables, below(height, top(measurables))) { maxIntrinsicWidth(it) }

    private fun below(height: Int, top: Int) =
        if (height == Constraints.Infinity) height else (height - top).coerceAtLeast(0)

    /** The children's height along the column: the unweighted ones', and the weighted ones' at the largest unit any asks for. */
    private fun intrinsicHeight(children: List<IntrinsicMeasurable>, height: IntrinsicMeasurable.() -> Int): Int {
        var unit = 0
        var fixed = 0
        var totalWeight = 0f
        children.forEach { child ->
            val weight = child.cardWeight
            val size = child.height()
            if (weight == 0f) {
                fixed += size
            } else if (weight > 0f) {
                totalWeight += weight
                unit = max(unit, (size / weight).roundToInt())
            }
        }
        return (unit * totalWeight).roundToInt() + fixed
    }

    /** The widest child, each asked at the height Column would give it. */
    private fun intrinsicWidth(children: List<IntrinsicMeasurable>, available: Int, width: IntrinsicMeasurable.(Int) -> Int): Int {
        if (children.isEmpty()) return 0
        var fixed = 0
        var widest = 0
        var totalWeight = 0f
        children.forEach { child ->
            val weight = child.cardWeight
            if (weight == 0f) {
                val left = if (available == Constraints.Infinity) Constraints.Infinity else available - fixed
                val height = min(child.maxIntrinsicHeight(Constraints.Infinity), left)
                fixed += height
                widest = max(widest, child.width(height))
            } else if (weight > 0f) {
                totalWeight += weight
            }
        }
        val unit = when {
            totalWeight == 0f -> 0
            available == Constraints.Infinity -> Constraints.Infinity
            else -> (max(available - fixed, 0) / totalWeight).roundToInt()
        }
        children.forEach { child ->
            val weight = child.cardWeight
            if (weight > 0f) {
                widest = max(widest, child.width(if (unit != Constraints.Infinity) (unit * weight).roundToInt() else Constraints.Infinity))
            }
        }
        return widest
    }
}

@Composable
fun KozmosCardHeader(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier.padding(LocalKozmosCardPadding.current.length)
    ) {
        content()
    }
}

@Composable
fun KozmosCardTitle(
    title: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleLarge,
        fontWeight = FontWeight.SemiBold,
        color = KozmosThemeTokens.primitivesColorsForeground100,
        modifier = modifier
    )
}

@Composable
fun KozmosCardDescription(
    description: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = description,
        style = MaterialTheme.typography.bodyMedium,
        color = KozmosThemeTokens.primitivesColorsForeground400,
        modifier = modifier.padding(top = KozmosDimensions.primitivesLayoutSpacing50)
    )
}

@Composable
fun KozmosCardContent(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    // Sides and bottom only: a header above has already paid the top. As the
    // card's first child, the card pays it (KozmosCardColumnPolicy).
    val padding = LocalKozmosCardPadding.current.length
    Column(
        modifier = modifier
            .then(KozmosCardLeads)
            .padding(horizontal = padding)
            .padding(bottom = padding)
    ) {
        content()
    }
}

@Composable
fun KozmosCardFooter(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit
) {
    // As KozmosCardContent: sides and bottom, and the top is the card's to
    // pay when the footer is its first child.
    val padding = LocalKozmosCardPadding.current.length
    Row(
        modifier = modifier
            .then(KozmosCardLeads)
            .padding(horizontal = padding)
            .padding(bottom = padding),
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
    ) {
        content()
    }
}
