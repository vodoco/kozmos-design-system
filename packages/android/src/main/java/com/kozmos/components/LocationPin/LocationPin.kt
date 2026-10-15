package com.kozmos.components.locationpin

import android.os.Build
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.absoluteOffset
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathOperation
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.AlignmentLine
import androidx.compose.ui.layout.HorizontalAlignmentLine
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.VerticalAlignmentLine
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalViewConfiguration
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.max
import androidx.compose.ui.unit.min
import androidx.compose.ui.unit.sp
import com.kozmos.components.poiresultcard.KozmosResultTapGate
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosShadows
import com.kozmos.tokens.KozmosThemeTokens
import kotlin.math.roundToInt
import kotlin.math.sqrt

/**
 * Where [KozmosLocationPin]'s `externalLabel` sits beside the marker. Left and
 * Right are the start and end sides: they change places in right to left.
 */
enum class KozmosLocationPinLabelPlacement {
    Top,
    Right,
    Bottom,
    Left
}

/**
 * The x of a [KozmosLocationPin]'s anchor in the pin's own box: the Result's
 * pointer tip, or the featured tile's or the place's dot centre. The pin's
 * layout provides it with [KozmosLocationPinAnchorY], wherever its label sits;
 * a map renderer's own `Layout` reads both off the measured pin, as
 * [kozmosLocationPinAt] does.
 */
val KozmosLocationPinAnchorX: VerticalAlignmentLine = VerticalAlignmentLine { a, b -> minOf(a, b) }

/** The y of a [KozmosLocationPin]'s anchor in the pin's own box: see [KozmosLocationPinAnchorX]. */
val KozmosLocationPinAnchorY: HorizontalAlignmentLine = HorizontalAlignmentLine { a, b -> minOf(a, b) }

/**
 * Puts a [KozmosLocationPin]'s anchor (its pointer's tip, or its dot's
 * centre) on [position], in pixels from the top left of the parent, as a
 * map's screen point is given, whatever the layout direction.
 *
 * Give it to each pin in a `Box` that fills the map: the pin fills that box
 * and draws its marker with the anchor on the point, and only its target takes
 * touches, so the map keeps the rest. [position] is read when the pin is
 * placed, so a map that moves re-places its pins without composing them again:
 *
 * ```
 * Box(Modifier.fillMaxSize()) {
 *     results.forEach { result ->
 *         KozmosLocationPin(
 *             modifier = Modifier.kozmosLocationPinAt { map.screenPoint(result.coordinate) },
 *             label = result.name,
 *             number = result.number
 *         )
 *     }
 * }
 * ```
 *
 * Under a parent that does not bound it, the pin keeps its own size and is
 * placed so that its anchor lands on [position] relative to where the parent
 * puts it.
 */
fun Modifier.kozmosLocationPinAt(position: Density.() -> IntOffset): Modifier = layout { measurable, constraints ->
    val placeable = measurable.measure(constraints.copy(minWidth = 0, minHeight = 0))
    val anchorX = placeable[KozmosLocationPinAnchorX].takeUnless { it == AlignmentLine.Unspecified } ?: (placeable.width / 2)
    val anchorY = placeable[KozmosLocationPinAnchorY].takeUnless { it == AlignmentLine.Unspecified } ?: placeable.height
    val width = if (constraints.hasBoundedWidth) constraints.maxWidth else placeable.width
    val height = if (constraints.hasBoundedHeight) constraints.maxHeight else placeable.height
    layout(width, height) {
        val point = position()
        // Absolute, not relative: a map's point is from its top left in
        // either direction.
        placeable.place(point.x - anchorX, point.y - anchorY)
    }
}

/**
 * The SDK's map result marker (decision 71, rulings 79–81), for prototypes
 * and boards. In production every one of these markers comes from the map
 * style's sprite sheet, and a featured tile with its logo from a featured
 * sprite Pointr's back end generates; Kozmos draws the same markers here.
 *
 * Three markers, one at a time:
 * - **Result** (neither [place] nor [featured]): a pill 32dp tall, at least
 *   32 wide and 8 wider than [number] on each side, with a 2dp border, and a
 *   12 by 7 pointer whose tip, 6 below the pill, is the anchor. At rest the
 *   pill is background/0 with the border, pointer and number in theme 600;
 *   [selected] fills it with theme 600 and turns the number foreground/1000.
 *   It does not grow. Without a number, an 8dp dot stands in the middle.
 * - **Featured** ([featured]): a tile 44dp, 52 when [selected], radius 16,
 *   background/0 inside a 3dp foreground/0 rim, with the place's logo,
 *   [markerContent], fitted inside the rim; and a 6dp foreground/0 dot whose
 *   top is 4 below the tile. The dot's centre is the anchor. No number and no
 *   accent colour.
 * - **Place** ([place]): a place on its own, its details open: a teardrop on
 *   a circle of 40dp in emotional success 800, a 20dp background/0 disc in
 *   its centre, and a 6dp dot of the same green whose top is 6 below the
 *   circle; the dot's centre is the anchor. It wins over [featured] and
 *   [number], and [selected] changes nothing.
 *
 * The body (the pill and its pointer, the tile, the teardrop) casts the md
 * shadow, `KozmosShadows.semanticsElevationFloating`; the dots cast none.
 * Colours follow the theme through `KozmosThemeTokens`.
 *
 * Place the marker with [kozmosLocationPinAt], or read
 * [KozmosLocationPinAnchorX] and [KozmosLocationPinAnchorY] off it. Only
 * results on the level in view get a marker: the level switcher counts the
 * rest (`showResultCounts`).
 *
 * It is a button when it can be pressed ([onClick] or [onOpen]), otherwise
 * an image. Its target is at least 48dp each way, centred on the body; it
 * never moves the anchor.
 *
 * @param label The accessible name. A Result adds the number it shows
 *   ("Gate 12, 3"); a featured tile adds [featuredLabel].
 * @param number The result's number, as its card's number tab shows it.
 *   Drawn on a Result only.
 * @param selected Fills a Result and grows a featured tile; TalkBack hears
 *   the selection. A place always reads as selected.
 * @param featured A featured place: the logo tile.
 * @param place A place on its own, its details open: the green pin.
 * @param enabled False draws the whole marker at 50% and takes no taps.
 * @param externalLabel Words drawn beside the marker, at [labelPlacement];
 *   not read by TalkBack, which hears [label].
 * @param onClick The marker's tap: select the result.
 * @param onOpen Open the place's details: a second tap within the double-tap
 *   time (decision 71). The first tap is [onClick], at once; the second calls
 *   this once and is not passed on as a second [onClick]; a quick third does
 *   nothing. TalkBack's double tap is one activation, so the marker offers
 *   opening as a custom action named [openLabel].
 * @param openLabel Names the open action TalkBack offers when [onOpen] is set.
 * @param featuredLabel Said after [label] on a featured tile: "Featured" until
 *   the product passes its own words.
 * @param markerContent The featured tile's logo, normally an image: fitted
 *   inside the rim (give an `Image` `Modifier.fillMaxSize()` and its default
 *   `ContentScale.Fit` to scale it up as well as down), clipped to the inner
 *   radius 13, never read by TalkBack. Ignored on the other markers. Without
 *   it the tile is empty.
 */
@Composable
fun KozmosLocationPin(
    modifier: Modifier = Modifier,
    label: String? = null,
    number: Int? = null,
    selected: Boolean = false,
    featured: Boolean = false,
    place: Boolean = false,
    enabled: Boolean = true,
    externalLabel: String? = null,
    labelPlacement: KozmosLocationPinLabelPlacement = KozmosLocationPinLabelPlacement.Bottom,
    onClick: (() -> Unit)? = null,
    onOpen: (() -> Unit)? = null,
    openLabel: String = "Open details",
    featuredLabel: String = "Featured",
    markerContent: (@Composable () -> Unit)? = null
) {
    val kind = when {
        place -> MarkerKind.Place
        featured -> MarkerKind.Featured
        else -> MarkerKind.Result
    }
    val density = LocalDensity.current

    // The number, measured here: the pill grows with it. 14 semibold, in
    // tabular figures where the font has them, at a fixed size, as the map
    // style's sprite draws it, so the pill keeps the SDK's geometry at any
    // font scale; TalkBack says the number.
    val shownNumber = if (kind == MarkerKind.Result) number else null
    val measurer = rememberTextMeasurer()
    val numberLayout = shownNumber?.let {
        measurer.measure(
            text = it.toString(),
            style = TextStyle(
                fontSize = with(density) { 14.dp.toSp() },
                fontWeight = FontWeight.SemiBold,
                fontFeatureSettings = "tnum"
            ),
            maxLines = 1,
            softWrap = false
        )
    }
    val geometry = when (kind) {
        MarkerKind.Result -> {
            val numberWidth = numberLayout?.let { with(density) { it.size.width.toDp() } }
            MarkerGeometry.result(pillWidth = numberWidth?.let { max(PILL_HEIGHT, it + PILL_PADDING * 2) } ?: PILL_HEIGHT)
        }
        MarkerKind.Featured -> MarkerGeometry.featured(if (selected) TILE_SELECTED else TILE)
        MarkerKind.Place -> MarkerGeometry.place()
    }

    // What TalkBack hears: the label, the number a Result shows, the
    // product's word for Featured on a featured tile.
    val description = listOfNotNull(
        label,
        shownNumber?.toString(),
        if (kind == MarkerKind.Featured) featuredLabel else null
    ).joinToString(", ")
    val readsSelected = selected || kind == MarkerKind.Place
    val pressable = onClick != null || onOpen != null
    val tapGate = remember { KozmosResultTapGate() }
    val doubleTapTimeout = LocalViewConfiguration.current.doubleTapTimeoutMillis
    val interaction = remember { MutableInteractionSource() }

    val target = Modifier
        .then(
            if (pressable) {
                Modifier.clickable(
                    interactionSource = interaction,
                    // A marker on a map draws no ripple: the SDK's does not.
                    indication = null,
                    enabled = enabled,
                    role = Role.Button,
                    onClick = {
                        // A semantics action invoked directly stays inert when disabled.
                        if (!enabled) return@clickable
                        // With onOpen, a second quick tap opens and a third
                        // does nothing; the first is the tap, at once.
                        if (onOpen != null) {
                            when (tapGate.tap(TAP_KEY, doubleTapTimeout)) {
                                KozmosResultTapGate.Tap.Open -> return@clickable onOpen()
                                KozmosResultTapGate.Tap.Ignore -> return@clickable
                                KozmosResultTapGate.Tap.Select -> Unit
                            }
                        }
                        onClick?.invoke()
                    }
                )
            } else {
                Modifier
            }
        )
        .semantics {
            if (description.isNotEmpty()) contentDescription = description
            if (!pressable) role = Role.Image
            this.selected = readsSelected
            // TalkBack's double tap is the one activation, the tap: opening
            // is offered as an action of its own.
            if (onOpen != null && enabled) {
                customActions = listOf(CustomAccessibilityAction(openLabel) { onOpen(); true })
            }
        }

    val marker: @Composable () -> Unit = {
        // The drawing and the target are centred across the box, so the
        // marker is the same in either direction.
        Box(Modifier.size(geometry.boxWidth, geometry.boxHeight)) {
            Box(
                Modifier
                    .align(Alignment.TopCenter)
                    .absoluteOffset(y = geometry.drawTop)
                    .size(geometry.drawWidth, geometry.drawHeight)
            ) {
                when (kind) {
                    MarkerKind.Result -> ResultMarker(geometry.drawWidth, selected, numberLayout)
                    MarkerKind.Featured -> FeaturedMarker(geometry.drawWidth, markerContent)
                    MarkerKind.Place -> PlaceMarker()
                }
            }
            // The target, over the drawing: at least 48 each way, centred on
            // the body, drawing nothing.
            Box(
                Modifier
                    .align(Alignment.TopCenter)
                    .absoluteOffset(y = geometry.targetTop)
                    .size(geometry.targetWidth, geometry.targetHeight)
                    .then(target)
            )
        }
    }

    Layout(
        content = {
            marker()
            if (externalLabel != null) {
                Text(
                    text = externalLabel,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = KozmosThemeTokens.primitivesColorsForeground100,
                    maxLines = 1,
                    // TalkBack hears the marker's label instead.
                    modifier = Modifier.clearAndSetSemantics { }
                )
            }
        },
        // Dimmed as a whole, once.
        modifier = modifier.alpha(if (enabled) 1f else 0.5f)
    ) { measurables, constraints ->
        // A marker keeps its size wherever it is put, as the sprite does:
        // squeezed, it overflows rather than squashing its geometry.
        val box = measurables[0].measure(Constraints())
        val text = measurables.getOrNull(1)?.measure(Constraints())
        // The drawing in the marker's box, and its anchor, in pixels.
        val drawLeft = geometry.drawLeft.toPx()
        val drawTop = geometry.drawTop.toPx()
        val drawRight = drawLeft + geometry.drawWidth.toPx()
        val drawBottom = drawTop + geometry.drawHeight.toPx()
        val anchorX = (drawLeft + drawRight) / 2f
        val anchorY = drawTop + geometry.anchorY.toPx()
        val bodyMiddle = drawTop + geometry.bodyHeight.toPx() / 2f
        val gap = KozmosDimensions.primitivesLayoutSpacing50.toPx()
        // The label beside the drawing, in left-to-right terms: Left is the
        // start side.
        val labelAt = text?.let {
            when (labelPlacement) {
                KozmosLocationPinLabelPlacement.Top -> Offset(anchorX - it.width / 2f, drawTop - gap - it.height)
                KozmosLocationPinLabelPlacement.Bottom -> Offset(anchorX - it.width / 2f, drawBottom + gap)
                KozmosLocationPinLabelPlacement.Left -> Offset(drawLeft - gap - it.width, bodyMiddle - it.height / 2f)
                KozmosLocationPinLabelPlacement.Right -> Offset(drawRight + gap, bodyMiddle - it.height / 2f)
            }
        }
        val left = minOf(0f, labelAt?.x ?: 0f)
        val top = minOf(0f, labelAt?.y ?: 0f)
        val right = maxOf(box.width.toFloat(), (labelAt?.x ?: 0f) + (text?.width ?: 0))
        val bottom = maxOf(box.height.toFloat(), (labelAt?.y ?: 0f) + (text?.height ?: 0))
        val width = (right - left).roundToInt()
        val height = (bottom - top).roundToInt()
        val rtl = layoutDirection == LayoutDirection.Rtl
        fun x(at: Float, w: Int): Int = if (rtl) (width - (at - left) - w).roundToInt() else (at - left).roundToInt()
        val boxX = x(0f, box.width)
        val boxY = (-top).roundToInt()
        layout(
            width,
            height,
            mapOf(
                KozmosLocationPinAnchorX to boxX + anchorX.roundToInt(),
                KozmosLocationPinAnchorY to boxY + anchorY.roundToInt()
            )
        ) {
            box.place(boxX, boxY)
            if (text != null && labelAt != null) text.place(x(labelAt.x, text.width), (labelAt.y - top).roundToInt())
        }
    }
}

private enum class MarkerKind { Result, Featured, Place }

private const val TAP_KEY = "location-pin"

private val PILL_HEIGHT = 32.dp
private val PILL_PADDING = 8.dp
private val PILL_BORDER = 2.dp
private val POINTER_WIDTH = 12.dp

/** The pointer's top edge, 1 inside the pill's bottom border, and its tip, 6 below the pill. */
private val POINTER_TOP = 31.dp
private val POINTER_TIP = 38.dp
private val RESULT_DOT = 8.dp
private val TILE = 44.dp
private val TILE_SELECTED = 52.dp
private val TILE_RADIUS = 16.dp
private val TILE_RIM = 3.dp
private val ANCHOR_DOT = 6.dp

/** The featured dot's top is 4 below the tile. */
private val TILE_DOT_GAP = 4.dp
private val PLACE_CIRCLE = 40.dp
private val PLACE_DISC = 20.dp

/** The place dot's top is 6 below the circle. */
private val PLACE_DOT_GAP = 6.dp
private val MIN_TARGET = 48.dp

/**
 * A marker's drawing (body and dot), its body, its anchor, and its target,
 * all in the marker's box: the drawing and the target, each centred on the
 * body across, with the box round both.
 */
private class MarkerGeometry(
    val drawWidth: Dp,
    val drawHeight: Dp,
    /** The body's height from the drawing's top: the pill and pointer, the tile, the teardrop. */
    val bodyHeight: Dp,
    /** The anchor's height from the drawing's top; across, it is the middle. */
    val anchorY: Dp
) {
    val targetWidth = max(MIN_TARGET, drawWidth)
    val targetHeight = max(MIN_TARGET, bodyHeight)
    private val targetTopInDrawing = (bodyHeight - targetHeight) / 2
    private val boxTop = min(0.dp, targetTopInDrawing)
    val boxWidth = max(drawWidth, targetWidth)
    val boxHeight = max(drawHeight, targetTopInDrawing + targetHeight) - boxTop
    val drawLeft = (boxWidth - drawWidth) / 2
    val drawTop = -boxTop
    val targetTop = targetTopInDrawing - boxTop

    companion object {
        fun result(pillWidth: Dp) = MarkerGeometry(pillWidth, POINTER_TIP, POINTER_TIP, POINTER_TIP)

        fun featured(tile: Dp) = MarkerGeometry(
            drawWidth = tile,
            drawHeight = tile + TILE_DOT_GAP + ANCHOR_DOT,
            bodyHeight = tile,
            anchorY = tile + TILE_DOT_GAP + ANCHOR_DOT / 2
        )

        fun place() = MarkerGeometry(
            drawWidth = PLACE_CIRCLE,
            drawHeight = PLACE_CIRCLE + PLACE_DOT_GAP + ANCHOR_DOT,
            bodyHeight = PLACE_CIRCLE / 2 * (1f + sqrt(2f)),
            anchorY = PLACE_CIRCLE + PLACE_DOT_GAP + ANCHOR_DOT / 2
        )
    }
}

/** The Result's body, the pill and its pointer, for its shadow. */
private object ResultBodyShape : Shape {
    override fun createOutline(size: Size, layoutDirection: LayoutDirection, density: Density): Outline = with(density) {
        val pill = RoundRect(0f, 0f, size.width, PILL_HEIGHT.toPx(), CornerRadius(PILL_HEIGHT.toPx() / 2))
        // Before Android 10 an outline that is not convex casts no shadow,
        // and the pill with its pointer is not: there the pill casts it alone.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return Outline.Rounded(pill)
        Outline.Generic(Path.combine(PathOperation.Union, Path().apply { addRoundRect(pill) }, pointerPath(size.width / 2)))
    }
}

private fun Density.pointerPath(middle: Float): Path = Path().apply {
    val half = POINTER_WIDTH.toPx() / 2
    moveTo(middle - half, POINTER_TOP.toPx())
    lineTo(middle + half, POINTER_TOP.toPx())
    lineTo(middle, POINTER_TIP.toPx())
    close()
}

/**
 * The place's teardrop: a circle of the box's width whose bottom comes to a
 * point, as the SVG's three quarter-arcs and square corner turned −45°; the
 * tip is the radius × √2 below the centre.
 */
private object TeardropShape : Shape {
    override fun createOutline(size: Size, layoutDirection: LayoutDirection, density: Density): Outline =
        Outline.Generic(teardropPath(size.width / 2))
}

private fun teardropPath(radius: Float): Path = Path().apply {
    val side = radius * sqrt(2f) / 2
    moveTo(radius, radius + radius * sqrt(2f))
    lineTo(radius - side, radius + side)
    arcTo(
        rect = androidx.compose.ui.geometry.Rect(0f, 0f, radius * 2, radius * 2),
        startAngleDegrees = 135f,
        sweepAngleDegrees = 270f,
        forceMoveTo = false
    )
    close()
}

@Composable
private fun ResultMarker(pillWidth: Dp, selected: Boolean, number: TextLayoutResult?) {
    val theme600 = KozmosThemeTokens.primitivesColorsTheme600
    val fill = if (selected) theme600 else KozmosThemeTokens.primitivesColorsBackground0
    val mark = if (selected) KozmosThemeTokens.primitivesColorsForeground1000 else theme600
    Canvas(
        Modifier
            .size(pillWidth, POINTER_TIP)
            .shadow(KozmosShadows.semanticsElevationFloating, ResultBodyShape, clip = false)
    ) {
        val pillHeight = PILL_HEIGHT.toPx()
        val border = PILL_BORDER.toPx()
        val middle = size.width / 2
        drawRoundRect(fill, size = Size(size.width, pillHeight), cornerRadius = CornerRadius(pillHeight / 2))
        // The border, 2 inside the pill's edge.
        drawRoundRect(
            theme600,
            topLeft = Offset(border / 2, border / 2),
            size = Size(size.width - border, pillHeight - border),
            cornerRadius = CornerRadius((pillHeight - border) / 2),
            style = Stroke(border)
        )
        drawPath(pointerPath(middle), theme600)
        if (number != null) {
            // Centred on the pill, its line box as SVG's central baseline.
            drawText(number, color = mark, topLeft = Offset(middle - number.size.width / 2f, pillHeight / 2 - number.size.height / 2f))
        } else {
            drawCircle(mark, radius = RESULT_DOT.toPx() / 2, center = Offset(middle, pillHeight / 2))
        }
    }
}

@Composable
private fun FeaturedMarker(tile: Dp, logo: (@Composable () -> Unit)?) {
    val rim = KozmosThemeTokens.primitivesColorsForeground0
    val shape = RoundedCornerShape(TILE_RADIUS)
    Box(Modifier.fillMaxSize()) {
        Box(
            Modifier
                .size(tile)
                .shadow(KozmosShadows.semanticsElevationFloating, shape, clip = false)
                .background(KozmosThemeTokens.primitivesColorsBackground0, shape)
        ) {
            if (logo != null) {
                Box(
                    Modifier
                        .padding(TILE_RIM)
                        .fillMaxSize()
                        .clip(RoundedCornerShape(TILE_RADIUS - TILE_RIM))
                        // The label names the marker; a logo is not read twice.
                        .clearAndSetSemantics { },
                    contentAlignment = Alignment.Center
                ) {
                    CompositionLocalProvider(LocalContentColor provides rim) { logo() }
                }
            }
            // The rim over the logo's edge.
            Canvas(Modifier.fillMaxSize()) {
                val width = TILE_RIM.toPx()
                drawRoundRect(
                    rim,
                    topLeft = Offset(width / 2, width / 2),
                    size = Size(size.width - width, size.height - width),
                    cornerRadius = CornerRadius(TILE_RADIUS.toPx() - width / 2),
                    style = Stroke(width)
                )
            }
        }
        AnchorDot(rim, top = tile + TILE_DOT_GAP)
    }
}

@Composable
private fun PlaceMarker() {
    val green = KozmosThemeTokens.primitivesColorsEmotionalSuccess800
    val disc = KozmosThemeTokens.primitivesColorsBackground0
    Box(Modifier.fillMaxSize()) {
        Canvas(
            Modifier
                .size(PLACE_CIRCLE, PLACE_CIRCLE / 2 * (1f + sqrt(2f)))
                .shadow(KozmosShadows.semanticsElevationFloating, TeardropShape, clip = false)
        ) {
            val radius = size.width / 2
            drawPath(teardropPath(radius), green)
            drawCircle(disc, radius = PLACE_DISC.toPx() / 2, center = Offset(radius, radius))
        }
        AnchorDot(green, top = PLACE_CIRCLE + PLACE_DOT_GAP)
    }
}

/** The dot under a tile or a place, centred across: the anchor. It casts no shadow. */
@Composable
private fun AnchorDot(color: Color, top: Dp) {
    Box(Modifier.fillMaxSize()) {
        Canvas(
            Modifier
                .align(Alignment.TopCenter)
                .absoluteOffset(y = top)
                .size(ANCHOR_DOT)
        ) { drawCircle(color) }
    }
}
