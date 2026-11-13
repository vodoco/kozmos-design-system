package com.kozmos.components.tabs

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.indication
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.addOutline
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.layout.HorizontalAlignmentLine
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.Measured
import androidx.compose.ui.layout.ParentDataModifier
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.offset
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.dp
import com.kozmos.components.motion.rememberKozmosAnimationsOn
import kotlin.math.ceil
import kotlin.math.roundToInt
import kotlin.math.sign
import com.kozmos.components.icon.KozmosIconSize
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosShadows
import com.kozmos.tokens.KozmosThemeTokens

/**
 * How far a tab's segment sits inside the list's track, on every side: the
 * track's 4dp padding, React's `p-1`. The segment's corner is the track's
 * less this, so the two curves stay the same distance apart all the way
 * round (decision 65).
 */
private val TabsInset = KozmosDimensions.primitivesLayoutSpacing50

/**
 * How far past the track's ends its scroll container reaches, so that it
 * never clips the raised segment's shadow there while the tabs fit: the
 * scroll container clips what it holds to its own box, and a selected end
 * tab's shadow reaches past the track's 4dp ends. A list that scrolls clips
 * to the track itself.
 */
private val TabsShadowReach = KozmosDimensions.primitivesLayoutSpacing200

/** The segment's least height: 36, in a 44dp track. React's list is 40; Figma's is 44, as here. */
private val TabsSegmentMinHeight = 36.dp

/** A tab's icon (GAP-152): 20dp, 4dp over its label, as React's and SwiftUI's. */
private val TabsIconSize = KozmosIconSize.Md.dp
private val TabsIconGap = KozmosDimensions.primitivesLayoutSpacing50

/**
 * True inside a [KozmosTabsList]: its tabs fill the list's height, which is
 * its tallest tab's (decision 3). A trigger in some other row keeps its own.
 */
internal val LocalTabsFillTrack = staticCompositionLocalOf { false }

@Composable
fun KozmosTabs(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(modifier = modifier.fillMaxWidth()) {
        content()
    }
}

/**
 * The tabs' track: background/100 with the control radius, React's
 * `TabsList` (`bg-muted p-1 rounded-control`). Each trigger draws its own
 * segment 4dp inside it, so the track pads only its ends here.
 *
 * TalkBack reads it as React's `tablist`: a selectable group, so TalkBack
 * is given the tabs as one collection, and each tab's place in it.
 *
 * Every tab is as tall as the tallest (decision 3): the list is its tallest
 * tab's height, and each tab fills it. When one tab has an icon, a tab of
 * words alone takes the same stacked height, its words centred down it, so
 * the raised segment fills the track whichever tab is selected. With no
 * icons every tab is the same 44dp as before.
 *
 * A list that fits its width is laid out as a `Row` would lay it out: its
 * tabs share the width by their weights, each as wide as the widest needs.
 * One that does not (GAP-254, decision 182) scrolls sideways inside its own
 * track, with no scroll bar (decision 75): the track keeps the width it is
 * given and is the scrolling viewport, its 4dp ends inside the scrolled
 * content, and each tab takes its natural width, its title never cut short.
 * The selected tab is scrolled into view by the least distance, at once when
 * the list is first laid out and, animated unless the system has removed
 * animations, whenever the selection moves; a tab given focus is brought
 * into view by the scroll container. Right to left it starts at the right.
 * Weights are read from [RowScope.weight]; the list does not align its tabs
 * by a baseline or an alignment line (`alignBy`), only by
 * [RowScope.align], centred by default.
 */
@Composable
fun KozmosTabsList(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit
) {
    val scroll = rememberScrollState()
    val reveal = remember { TabsReveal() }
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val animations = rememberKozmosAnimationsOn()
    LaunchedEffect(reveal.request) {
        val request = reveal.request ?: return@LaunchedEffect
        if (animations) scroll.animateScrollTo(request.target) else scroll.scrollTo(request.target)
    }
    Layout(
        content = {
            CompositionLocalProvider(LocalTabsFillTrack provides true) {
                TabsRowScope.content()
            }
        },
        modifier = modifier
            .fillMaxWidth()
            .selectableGroup()
            .background(KozmosThemeTokens.primitivesColorsBackground100, shape)
            // A list that scrolls clips its tabs to the track's rounded
            // ends; one that fits clips nothing, so the raised segment's
            // shadow is drawn as it always was.
            .drawWithContent {
                if (reveal.scrolls) {
                    val track = Path().apply { addOutline(shape.createOutline(size, layoutDirection, this@drawWithContent)) }
                    clipPath(track) { this@drawWithContent.drawContent() }
                } else {
                    drawContent()
                }
            }
            .boundedWidth()
            .reachPastEnds(TabsShadowReach)
            .horizontalScroll(scroll, enabled = reveal.scrolls),
        measurePolicy = remember(scroll, reveal) { TabsMeasurePolicy(scroll, reveal) }
    )
}

/**
 * Inside a parent of unbounded width, such as another horizontal scroller,
 * the list is as wide as its tabs need, rather than asking a scroll
 * container for an unbounded width, which throws.
 */
private fun Modifier.boundedWidth(): Modifier = layout { measurable, constraints ->
    val bounded = if (constraints.hasBoundedWidth) {
        constraints
    } else {
        val needed = measurable.maxIntrinsicWidth(constraints.maxHeight).coerceAtLeast(constraints.minWidth)
        constraints.copy(maxWidth = needed)
    }
    val placeable = measurable.measure(bounded)
    layout(placeable.width, placeable.height) { placeable.place(0, 0) }
}

/**
 * Measures what follows [reach] wider at each end than the box it is drawn
 * in, and places it [reach] before the start, so a clip it makes falls
 * [reach] past the box's ends.
 */
private fun Modifier.reachPastEnds(reach: Dp): Modifier = layout { measurable, constraints ->
    val past = reach.roundToPx()
    val placeable = measurable.measure(constraints.offset(horizontal = 2 * past))
    layout((placeable.width - 2 * past).coerceAtLeast(constraints.minWidth), placeable.height) {
        placeable.place(-past, 0)
    }
}

/** Whether the list scrolls, and where it was last asked to scroll to. */
private class TabsReveal {
    var scrolls by mutableStateOf(false)
    var request by mutableStateOf<TabsRevealRequest?>(null)
    /** The selected tab when the list was last laid out, by its place. */
    var selected: Int = -1
    /** Whether a scrolling list has been laid out once with its selection shown. */
    var shown = false
}

/** A new scroll offset; a fresh object each time, so the same offset asked twice runs twice. */
private class TabsRevealRequest(val target: Int)

/** What a child of the list says about itself: its weight, its alignment, whether it is the selected tab. */
private class TabsParentData(
    var weight: Float = 0f,
    var fill: Boolean = true,
    var align: Alignment.Vertical? = null,
    var selected: Boolean = false
)

private data class TabsWeight(val weight: Float, val fill: Boolean) : ParentDataModifier {
    override fun Density.modifyParentData(parentData: Any?): Any =
        ((parentData as? TabsParentData) ?: TabsParentData()).also {
            it.weight = weight
            it.fill = fill
        }
}

private data class TabsAlign(val alignment: Alignment.Vertical) : ParentDataModifier {
    override fun Density.modifyParentData(parentData: Any?): Any =
        ((parentData as? TabsParentData) ?: TabsParentData()).also { it.align = alignment }
}

private data class TabsSelected(val selected: Boolean) : ParentDataModifier {
    override fun Density.modifyParentData(parentData: Any?): Any =
        ((parentData as? TabsParentData) ?: TabsParentData()).also { it.selected = selected }
}

/**
 * The scope a [KozmosTabsList]'s content is given. A weight is a `Row`'s,
 * read by the list's own layout; alignment lines are not supported.
 */
private object TabsRowScope : RowScope {
    override fun Modifier.weight(weight: Float, fill: Boolean): Modifier {
        require(weight > 0.0) { "invalid weight $weight; must be greater than zero" }
        return this.then(TabsWeight(weight.coerceAtMost(Float.MAX_VALUE), fill))
    }

    override fun Modifier.align(alignment: Alignment.Vertical): Modifier = this.then(TabsAlign(alignment))
    override fun Modifier.alignBy(alignmentLine: HorizontalAlignmentLine): Modifier = this
    override fun Modifier.alignByBaseline(): Modifier = this
    override fun Modifier.alignBy(alignmentLineBlock: (Measured) -> Int): Modifier = this
}

/** The tabs' widths and the row's height, for a track so wide. */
private class TabsRow(val widths: IntArray, val fill: BooleanArray, val height: Int, val scrolls: Boolean)

/**
 * Lays the tabs out as `Row(Modifier.padding(horizontal = 4.dp)
 * .height(IntrinsicSize.Min))` did while they fit, weights and all, and at
 * their natural widths, from the start, once they do not.
 */
private class TabsMeasurePolicy(private val scroll: ScrollState, private val reveal: TabsReveal) : MeasurePolicy {

    private fun IntrinsicMeasureScope.row(measurables: List<IntrinsicMeasurable>, track: Int): TabsRow {
        val inset = TabsInset.roundToPx()
        val data = measurables.map { it.parentData as? TabsParentData }
        val weights = FloatArray(measurables.size) { data[it]?.weight ?: 0f }
        val naturals = IntArray(measurables.size) { measurables[it].maxIntrinsicWidth(Constraints.Infinity) }
        val totalWeight = weights.sum()
        val room = (track - 2 * inset).coerceAtLeast(0)
        // What equal shares need: each weighted tab as wide as the widest
        // needs for its weight, beside the others' own widths.
        val fixed = naturals.indices.filter { weights[it] == 0f }.sumOf { naturals[it] }
        val perWeight = naturals.indices.filter { weights[it] > 0f }.maxOfOrNull { naturals[it] / weights[it] } ?: 0f
        val needed = fixed + ceil(perWeight * totalWeight).toInt()
        val scrolls = needed > room
        val widths = IntArray(measurables.size)
        val fill = BooleanArray(measurables.size) { data[it]?.fill ?: true }
        if (scrolls) {
            naturals.copyInto(widths)
            fill.fill(true)
        } else {
            // As a Row shares out its room: the tabs without a weight take
            // their own width, the rest split what is left by weight, the
            // rounding's remainder a pixel at a time from the start.
            var used = 0
            for (i in naturals.indices) if (weights[i] == 0f) {
                widths[i] = minOf(naturals[i], room - used).coerceAtLeast(0)
                used += widths[i]
            }
            val remaining = room - used
            val unit = if (totalWeight > 0f) remaining / totalWeight else 0f
            var remainder = remaining - naturals.indices.filter { weights[it] > 0f }.sumOf { (unit * weights[it]).roundToInt() }
            for (i in naturals.indices) if (weights[i] > 0f) {
                val step = remainder.sign
                remainder -= step
                widths[i] = maxOf(0, (unit * weights[i]).roundToInt() + step)
            }
        }
        // The row is as tall as its tallest tab at its width (IntrinsicSize.Min).
        val height = measurables.indices.maxOfOrNull { measurables[it].minIntrinsicHeight(widths[it]) } ?: 0
        return TabsRow(widths, fill, height, scrolls)
    }

    override fun MeasureScope.measure(measurables: List<Measurable>, constraints: Constraints): MeasureResult {
        // A scroll container passes on the width it was given as the least
        // width, and an unbounded greatest: the least is the track's width
        // and the reach past each of its ends (reachPastEnds).
        val viewport = constraints.minWidth
        val past = TabsShadowReach.roundToPx()
        val track = (viewport - 2 * past).coerceAtLeast(0)
        val inset = TabsInset.roundToPx()
        val row = row(measurables, track)
        val height = constraints.constrainHeight(row.height)
        val placeables = measurables.mapIndexed { i, measurable ->
            val width = row.widths[i]
            measurable.measure(Constraints(minWidth = if (row.fill[i]) width else 0, maxWidth = width, minHeight = 0, maxHeight = height))
        }
        val content = 2 * past + 2 * inset + placeables.sumOf { it.width }
        val width = maxOf(viewport, content)

        reveal.scrolls = row.scrolls
        val selected = measurables.indexOfFirst { (it.parentData as? TabsParentData)?.selected == true }
        if (row.scrolls && selected >= 0) {
            // The selected tab's span from the start, and the least scroll
            // that shows it in the track, with the track's 4dp beside it.
            // At a scroll of s the track shows [s + past, s + past + track).
            val start = past + inset + (0 until selected).sumOf { placeables[it].width }
            val end = start + placeables[selected].width
            val now = Snapshot.withoutReadObservation { scroll.value }
            val most = (content - viewport).coerceAtLeast(0)
            val target = when {
                start - inset < now + past -> start - inset - past
                end + inset > now + past + track -> minOf(end + inset - past - track, start - inset - past)
                else -> now
            }.coerceIn(0, most)
            if (!reveal.shown) {
                // First laid out scrolling: shown at once, before it is drawn.
                reveal.shown = true
                if (target != now) scroll.dispatchRawDelta((target - now).toFloat())
            } else if (selected != reveal.selected && target != now) {
                reveal.request = TabsRevealRequest(target)
            }
        }
        reveal.selected = selected

        return layout(width, height) {
            var x = past + inset
            placeables.forEachIndexed { i, placeable ->
                val align = (measurables[i].parentData as? TabsParentData)?.align ?: Alignment.CenterVertically
                placeable.placeRelative(x, align.align(placeable.height, height))
                x += placeable.width
            }
        }
    }

    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int): Int =
        2 * TabsShadowReach.roundToPx() + 2 * TabsInset.roundToPx() + measurables.sumOf { it.maxIntrinsicWidth(height) }

    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int): Int =
        maxIntrinsicWidth(measurables, height)

    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int): Int =
        row(measurables, (width - 2 * TabsShadowReach.roundToPx()).coerceAtLeast(0)).height

    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int): Int =
        row(measurables, (width - 2 * TabsShadowReach.roundToPx()).coerceAtLeast(0)).height
}

/**
 * One tab. Selected, it is React's raised segment (decision 65): a
 * background/0 segment 4dp inside the track, its corner concentric with the
 * track's, lifted by the raised elevation, with foreground/0 words. The
 * other tabs' words are foreground/400 on the track. Nothing on tabs is the
 * theme's colour.
 *
 * The whole 44dp height of the track is the tab's target, the segment's 4dp
 * inset included. React draws no press on a tab and rings it for keyboard
 * focus; Kozmos names no tab token for either, so here the platform's ripple
 * is the press and the focus indication, drawn in the segment's shape rather
 * than across the track.
 *
 * TalkBack reads it as React's `tab` with `aria-selected`: a tab, selected
 * or not selected.
 *
 * [icon], when given, is drawn 20dp over the title, 4dp above it and centred
 * with it (GAP-152); the segment keeps its padding, and the track grows to
 * hold it; in a [KozmosTabsList] the list's other tabs grow with it. It
 * takes the title's colour through [LocalContentColor] and is
 * decorative: TalkBack reads the tab by its title alone.
 */
@Composable
fun RowScope.KozmosTabsTrigger(
    value: String,
    title: String,
    selectedValue: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    icon: (@Composable () -> Unit)? = null
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    val isSelected = value == selectedValue
    val segment = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl - TabsInset)
    val interactionSource = remember { MutableInteractionSource() }

    val inList = LocalTabsFillTrack.current
    Box(
        modifier = modifier
            .weight(1f)
            .then(if (inList) Modifier.fillMaxHeight().then(TabsSelected(isSelected)) else Modifier)
            .selectable(
                selected = isSelected,
                interactionSource = interactionSource,
                indication = null,
                role = Role.Tab
            ) {
                trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "Tabs", eventName = "tab_switched", properties = mapOf("value" to value.toString())))
                onValueChange(value)
            }
            .padding(vertical = TabsInset)
            .then(
                if (isSelected) {
                    Modifier
                        .shadow(KozmosShadows.semanticsElevationRaised, segment)
                        .background(KozmosThemeTokens.primitivesColorsBackground0, segment)
                } else {
                    Modifier
                }
            )
            .clip(segment)
            .indication(interactionSource, LocalIndication.current)
            .heightIn(min = TabsSegmentMinHeight)
            .padding(
                horizontal = KozmosDimensions.primitivesLayoutSpacing150,
                vertical = KozmosDimensions.primitivesLayoutSpacing75
            ),
        contentAlignment = Alignment.Center
    ) {
        val ink = if (isSelected) KozmosThemeTokens.primitivesColorsForeground0 else KozmosThemeTokens.primitivesColorsForeground400
        if (icon == null) {
            TabTitle(title, ink)
        } else {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(TabsIconGap)
            ) {
                // Decorative, so a described icon cannot add to the title.
                // The fixed size also answers the list's intrinsic-height
                // query, so an icon built from a SubcomposeLayout (an async
                // image, BoxWithConstraints) is never asked and cannot throw.
                Box(
                    modifier = Modifier.size(TabsIconSize).clearAndSetSemantics {},
                    contentAlignment = Alignment.Center
                ) {
                    CompositionLocalProvider(LocalContentColor provides ink) { icon() }
                }
                TabTitle(title, ink)
            }
        }
    }
}

@Composable
private fun TabTitle(title: String, color: Color) {
    Text(
        text = title,
        color = color,
        style = MaterialTheme.typography.labelLarge,
        textAlign = TextAlign.Center,
        // One line, as React's `whitespace-nowrap`.
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
    )
}

@Composable
fun KozmosTabsContent(
    value: String,
    selectedValue: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    if (value == selectedValue) {
        Box(modifier = modifier.padding(top = KozmosDimensions.primitivesLayoutSpacing100)) {
            content()
        }
    }
}
