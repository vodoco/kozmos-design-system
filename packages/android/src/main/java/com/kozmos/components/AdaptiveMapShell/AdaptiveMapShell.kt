package com.kozmos.components.adaptivemapshell

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.offset
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInWindow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import kotlin.math.roundToInt
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.layout.AlignmentLine
import androidx.compose.ui.layout.HorizontalAlignmentLine
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.layout
import androidx.compose.ui.layout.layoutId
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.Velocity
import androidx.compose.ui.unit.dp
import kotlin.math.roundToInt
import com.kozmos.contracts.KozmosMapCollisionInsets
import com.kozmos.contracts.KozmosMapReadiness
import com.kozmos.components.motion.KozmosTransitions
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.LocalKozmosSurfaceStyle
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

enum class KozmosMapPanelPlacement {
    Start,
    End
}

/**
 * The peek anchor's bottom edge, carried up to the sheet as an alignment
 * line: the sheet reads it while it measures its content, in the same frame,
 * as the iOS shell reads its anchor preference. Two anchors: the lower wins.
 */
internal val KozmosPanelPeekAnchorLine = HorizontalAlignmentLine(::maxOf)

/**
 * Marks the row the sheet's smallest detent rests on: `Collapsed` then
 * resolves to this row's bottom edge plus a margin, within a quarter and
 * three quarters of the shell — the prototype's place card peeks at its Go
 * row. Without an anchor `Collapsed` is a fifth of the shell.
 */
fun Modifier.kozmosPanelPeekAnchor(): Modifier = layout { measurable, constraints ->
    val placeable = measurable.measure(constraints)
    layout(placeable.width, placeable.height, mapOf(KozmosPanelPeekAnchorLine to placeable.height)) {
        placeable.place(0, 0)
    }
}

/** The detents a bottom sheet offers unless told otherwise; it rests at medium. */
val KozmosDefaultPanelDetents: List<KozmosMapPanelDetent> =
    listOf(KozmosMapPanelDetent.Collapsed, KozmosMapPanelDetent.Medium, KozmosMapPanelDetent.Large)

/**
 * What the shell's panel leaves empty above its content (GAP-083): the
 * handle's 16dp row, the 16dp gap below a `panelHeader`, or the shell's
 * 16dp top inset when neither is present (including beside the map).
 * A part with its own top padding and no surface of its own tops
 * it up to what it needs rather than adding to it, as `KozmosPOIDetailPanel`
 * does in its sheet presentation and `KozmosBrowseCategoriesPanel` and
 * `KozmosRoutePreviewPanel` do; a part that draws its own bordered surface
 * keeps its padding inside the border, since this space lies outside it. 0
 * outside a shell. It describes the panel's top: a product that puts such a
 * part under a row of its own provides 0 for this and
 * [LocalKozmosPanelClearanceTop] to it, or the part tops up to a space that
 * is not above it.
 */
val LocalKozmosPanelInsetTop = compositionLocalOf { 0.dp }

/**
 * How far the panel content's first control must still sit below
 * [LocalKozmosPanelInsetTop] (GAP-083): 4dp under a handle — half of what its
 * 16dp row falls short of 24 — so the handle's target keeps its WCAG 2.5.8
 * spacing; 0 everywhere else. It is also how far below the row the 24dp
 * circle on the handle's centre reaches, so a part that knows where its
 * controls sit across the panel may keep it only where they would meet that
 * circle: `KozmosPOIDetailPanel`'s header does (decision 51).
 */
val LocalKozmosPanelClearanceTop = compositionLocalOf { 0.dp }

/**
 * The surface of the shell's panel under what it hosts, a sheet's or a side
 * panel's, solid or glass; null outside a shell. The panel's surface is the
 * one surface (decision 43): a part that fills its own box standing alone,
 * as `KozmosRoutePreviewPanel` does, paints no fill on it, so a glass panel
 * shows through it and a solid one looks as it did, its fill being the
 * same background colour. A part that draws a bordered card of its own
 * keeps it. Provided to the panel's header and its content alike.
 */
val LocalKozmosPanelSurface = compositionLocalOf<KozmosSurfaceStyle?> { null }

/**
 * True when the map shell's credits slot has less room than the
 * attribution's full height: `KozmosMapAttribution` then leaves out its
 * brand, so the credits keep their full height and are never clipped into a
 * scroll region (GAP-135). Provided by the shell; never a product's.
 */
internal val LocalKozmosMapAttributionCompact = compositionLocalOf { false }

/** The handle's row: deliberately shallow, an affordance at the sheet's top edge. */
private val SheetHandleRowHeight = KozmosDimensions.primitivesLayoutSpacing200
private val PanelContentSpacing = KozmosDimensions.primitivesLayoutSpacing200

/**
 * WCAG 2.5.8: a target smaller than 24dp keeps a 24dp circle on its centre
 * clear of every other target. The handle's row is one.
 */
private val MinimumTargetSpacing = 24.dp

/** How far the first control under the handle's row keeps below it: half of what the row falls short of a 24dp target, 4. */
private val HandleClearance = (MinimumTargetSpacing - SheetHandleRowHeight) / 2

/**
 * Adaptive container that layers a map, its controls, and a detail panel.
 *
 * Mirrors the React `AdaptiveMapShell`. The shell owns layout and z-ordering
 * only. [collisionInsets] are surfaced back to the caller through
 * [onCollisionInsetsChange] so the map renderer can pad its camera — layout
 * alone cannot move SDK labels, routes, attribution, or marker collision boxes.
 *
 * The [panel]'s content is told what the panel leaves empty above it, and how
 * far its first control must keep below that — [LocalKozmosPanelInsetTop] and
 * [LocalKozmosPanelClearanceTop] — so a part with its own top padding and no
 * surface of its own, as `KozmosPOIDetailPanel` is in its sheet presentation
 * and `KozmosBrowseCategoriesPanel` and `KozmosRoutePreviewPanel` are, tops it
 * up rather than adding to it (GAP-083, decision 14).
 */
@Composable
fun KozmosAdaptiveMapShell(
    map: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    mapLabel: String = "Map",
    mapStatus: KozmosMapReadiness = KozmosMapReadiness.Ready,
    mapStatusContent: (@Composable () -> Unit)? = null,
    controls: (@Composable () -> Unit)? = null,
    topBar: (@Composable () -> Unit)? = null,
    panel: (@Composable () -> Unit)? = null,
    /**
     * Drawn under the sheet's handle and above [panel], and not scrolled with
     * it: a search field, the assistant button, or a chosen category stays put
     * while the results under it scroll (row 73). Every detent counts it — a
     * sheet fitted to its content includes it, an anchor in it
     * (`Modifier.kozmosPanelPeekAnchor()`) is honoured, and with no anchor a
     * collapsed sheet is tall enough to show all of it. A vertical drag on it
     * moves the sheet whatever the content has scrolled — nothing in it
     * scrolls vertically, so the sheet's own drag takes it — and a sideways
     * one stays with it, for a row of chips that scrolls. Under the handle it
     * starts 4dp below the handle's row, so its first control keeps the
     * handle's target clear (WCAG 2.5.8). In a side panel it is the panel's
     * first row.
     */
    panelHeader: (@Composable () -> Unit)? = null,
    panelLabel: String = "Map details",
    panelPlacement: KozmosMapPanelPlacement = KozmosMapPanelPlacement.End,
    collisionInsets: KozmosMapCollisionInsets = KozmosMapCollisionInsets.Zero,
    onCollisionInsetsChange: ((KozmosMapCollisionInsets) -> Unit)? = null,
    /** What the panel sits on: solid by default, glass where the product asks for it. */
    panelSurface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
    /**
     * Where a bottom sheet may rest: collapsed (a fifth of the shell, or the
     * content's peek anchor), medium (54 %), large (94 %), fitted to its
     * content, a fraction or a height. Dragged anywhere on the sheet, it
     * snaps to the nearest of these; a scrollable inside it scrolls only at
     * the largest. Unset, the sheet offers collapsed, medium and large and
     * rests at medium.
     */
    panelDetents: List<KozmosMapPanelDetent> = KozmosDefaultPanelDetents,
    /** The detent the sheet rests at: controlled, with [onPanelDetentChange]. */
    panelDetent: KozmosMapPanelDetent? = null,
    /** Independent logical corners, measured together and wrapped when needed. */
    controlsBottomStart: (@Composable () -> Unit)? = null,
    controlsBottomEnd: (@Composable () -> Unit)? = null,
    bottomControlsPadCamera: Boolean = false,
    attribution: (@Composable () -> Unit)? = null,
    /** Translatable name for the legacy controls container; children remain independently accessible. */
    controlsLabel: String = "Map controls",
    /** Translatable name shared by both registered bottom corners. */
    bottomControlsLabel: String = "Map corner controls",
    onPanelDetentChange: ((KozmosMapPanelDetent) -> Unit)? = null
) {
    val density = LocalDensity.current
    val direction = LocalLayoutDirection.current
    var topHeight by remember { mutableStateOf(0.dp) }
    var controlsHeight by remember { mutableStateOf(0.dp) }
    var panelHeight by remember { mutableStateOf(0.dp) }
    var sidePanelHeight by remember { mutableStateOf(0.dp) }
    // The corners' own height, whether or not they fit.
    var bottomControlsHeight by remember { mutableStateOf(0.dp) }
    var bottomStartWidth by remember { mutableStateOf(0.dp) }
    var bottomEndWidth by remember { mutableStateOf(0.dp) }
    // The attribution as drawn (without its brand when compact), and its full
    // height with the brand: what the panel's sizing reserves, so the brand
    // giving way never moves the panel. Measured as drawn while the brand
    // shows, and from an unplaced copy while it has given way, so it follows a
    // change of size or text either way (GAP-135).
    var attributionHeight by remember { mutableStateOf(0.dp) }
    var attributionFullHeight by remember { mutableStateOf(0.dp) }
    var attributionCompact by remember { mutableStateOf(false) }
    var shellOrigin by remember { mutableStateOf(IntOffset.Zero) }

    BoxWithConstraints(
        modifier = modifier
            .onGloballyPositioned { val p = it.positionInWindow(); shellOrigin = IntOffset(p.x.roundToInt(), p.y.roundToInt()) }
            .fillMaxWidth()
            .background(KozmosThemeTokens.primitivesColorsBackground100)
    ) {
        // Wide layouts float the panel beside the map; compact layouts dock it
        // to the bottom edge, matching the web breakpoint behaviour.
        val isRegularWidth = maxWidth >= 600.dp
        val availableHeight = maxHeight
        val availableWidth = maxWidth
        val gap = KozmosDimensions.primitivesLayoutSpacing200
        val safeTop = with(density) { WindowInsets.safeDrawing.getTop(this).toDp() }
        val safeBottom = with(density) { WindowInsets.safeDrawing.getBottom(this).toDp() }
        val safeLeft = with(density) { WindowInsets.safeDrawing.getLeft(this, direction).toDp() }
        val safeRight = with(density) { WindowInsets.safeDrawing.getRight(this, direction).toDp() }
        val sidePanel = if (panel != null && isRegularWidth) minOf(416.dp, availableWidth * 0.42f) + gap * 2 else 0.dp
        val bottomPanel = if (panel != null && !isRegularWidth) panelHeight else 0.dp
        val chromeWidth = (availableWidth - sidePanel - safeLeft - safeRight).coerceAtLeast(0.dp)
        val footerWidth = (availableWidth - safeLeft - safeRight).coerceAtLeast(0.dp)
        val topInset = if (topBar != null) topHeight + gap else 0.dp
        val band = (availableHeight - bottomPanel - safeTop - (if (bottomPanel > 0.dp) 0.dp else safeBottom) - topInset - gap * 2).coerceAtLeast(0.dp)
        // Very long or localized credits reserve at most half of the band
        // between the top bar and the bottom edge, so they never take the
        // panel's place. Drawn, the attribution is never clipped (GAP-135).
        val attributionCap = (availableHeight - safeTop - safeBottom - topInset - gap * 3).coerceAtLeast(0.dp) / 2
        val reservedFooterHeight = if (attribution != null) minOf(attributionFullHeight, attributionCap) else 0.dp
        val footerHeight = if (attribution != null) attributionHeight else 0.dp
        val attributionReserve = if (footerHeight > 0.dp) footerHeight + gap else 0.dp
        val bottomBand = (band - (if (controls != null) controlsHeight + gap else 0.dp)).coerceAtLeast(0.dp)
        val cornersFit = bottomControlsHeight > 0.dp && bottomControlsHeight <= bottomBand
        val cornerReserve = maxOf(if (bottomStartWidth > 0.dp) bottomStartWidth + gap else 0.dp,
            if (bottomEndWidth > 0.dp) bottomEndWidth + gap else 0.dp)
        // Corners that fit lift the attribution above them when they leave no
        // middle slot 128 wide.
        val liftOverCorners = if (cornersFit && footerWidth - gap * 2 - cornerReserve * 2 < 128.dp)
            bottomControlsHeight + gap else 0.dp
        val maximumPanelHeight = if (reservedFooterHeight > 0.dp)
            (availableHeight - topInset - safeTop - reservedFooterHeight - gap * 3).coerceAtLeast(0.dp) else availableHeight
        // With less room than its full height, lifted above the corners when
        // they fit, the brand gives way (decision 58); the credits keep their
        // height.
        val compactAttribution = attribution != null &&
            attributionFullHeight > minOf(attributionCap, (band - liftOverCorners).coerceAtLeast(0.dp))
        SideEffect { if (attributionCompact != compactAttribution) attributionCompact = compactAttribution }
        // Then the corners: credits still too tall to sit above them send them
        // away and return to the bottom row. The credits never clip.
        val cornersGiveWay = attributionCompact && liftOverCorners > 0.dp && footerHeight + liftOverCorners > band
        val cornersVisible = cornersFit && !cornersGiveWay
        val attributionCornerReserve = if (cornersVisible) cornerReserve else 0.dp
        val attributionAboveCorners = cornersVisible && liftOverCorners > 0.dp
        val attributionLift = if (attributionAboveCorners) liftOverCorners else 0.dp
        val chromeAlignment = if (panelPlacement == KozmosMapPanelPlacement.End) Alignment.BottomStart else Alignment.BottomEnd
        val panelRight = (panelPlacement == KozmosMapPanelPlacement.End) == (direction == LayoutDirection.Ltr)
        fun cleanInset(value: Double) = if (value.isFinite()) maxOf(0.0, value) else 0.0
        val cornerPadding = if ((controlsBottomStart != null || controlsBottomEnd != null) && bottomControlsPadCamera && cornersVisible) bottomPanel + minOf(bottomControlsHeight, bottomBand) + gap + (if (bottomPanel > 0.dp) 0.dp else safeBottom) else 0.dp
        val attributionPadding = if (footerHeight > 0.dp) bottomPanel + footerHeight + attributionLift + gap + (if (bottomPanel > 0.dp) 0.dp else safeBottom) else 0.dp
        val left = maxOf(cleanInset(collisionInsets.left), (safeLeft + if (!panelRight) sidePanel else 0.dp).value.toDouble()).coerceIn(0.0, availableWidth.value.toDouble())
        val top = maxOf(cleanInset(collisionInsets.top), (safeTop + topInset).value.toDouble()).coerceIn(0.0, availableHeight.value.toDouble())
        val resolvedInsets = KozmosMapCollisionInsets(
            top = top,
            left = left,
            right = maxOf(cleanInset(collisionInsets.right), (safeRight + if (panelRight) sidePanel else 0.dp).value.toDouble()).coerceIn(0.0, (availableWidth.value - left).coerceAtLeast(0.0)),
            bottom = maxOf(cleanInset(collisionInsets.bottom), maxOf(bottomPanel, safeBottom, cornerPadding, attributionPadding).value.toDouble()).coerceIn(0.0, (availableHeight.value - top).coerceAtLeast(0.0))
        )
        LaunchedEffect(resolvedInsets) { onCollisionInsetsChange?.invoke(resolvedInsets) }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .semantics { contentDescription = mapLabel }
        ) {
            map()
        }

        if (mapStatus != KozmosMapReadiness.Ready && mapStatusContent != null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(KozmosThemeTokens.primitivesColorsBackground0.copy(alpha = 0.8f))
                    .semantics { liveRegion = LiveRegionMode.Polite },
                contentAlignment = Alignment.Center
            ) {
                mapStatusContent()
            }
        }

        // The map runs to every edge; the chrome keeps the window's safe
        // insets — the status bar, a cutout, the navigation bar — so an
        // edge-to-edge activity (enableEdgeToEdge) shows the prototype's
        // screen and a padded one loses nothing.
        if (topBar != null) {
            Box(
                modifier = Modifier
                    .width(chromeWidth)
                    .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Top + WindowInsetsSides.Horizontal))
                    .padding(KozmosDimensions.primitivesLayoutSpacing200)
                    .align(if (panelPlacement == KozmosMapPanelPlacement.End) Alignment.TopStart else Alignment.TopEnd),
                contentAlignment = Alignment.TopCenter
            ) {
                Box(modifier = Modifier.widthIn(max = minOf(672.dp, chromeWidth)).onSizeChanged { topHeight = with(density) { it.height.toDp() } }) { topBar() }
            }
        }

        if (controls != null) {
            val controlsFit = attribution == null || controlsHeight <= (band - attributionReserve).coerceAtLeast(0.dp)
            Box(
                modifier = Modifier
                    .then(if (controlsFit) Modifier.semantics {
                        contentDescription = controlsLabel
                        isTraversalGroup = true
                    } else Modifier.clearAndSetSemantics {})
                    .layout { measurable, constraints ->
                        val placeable = measurable.measure(constraints)
                        layout(placeable.width, placeable.height) {
                            if (controlsFit) placeable.place(0, 0)
                        }
                    }
                    .padding(top = topInset)
                    .widthIn(max = chromeWidth)
                    .heightIn(max = (band - attributionReserve).coerceAtLeast(0.dp) + safeTop + gap * 2)
                    .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Top + WindowInsetsSides.Horizontal))
                    .padding(KozmosDimensions.primitivesLayoutSpacing200)
                    .align(
                        if (panelPlacement == KozmosMapPanelPlacement.End) {
                            Alignment.TopStart
                        } else {
                            Alignment.TopEnd
                        }
                    )
            ) {
                Box(Modifier
                    .then(if (attribution != null) Modifier.wrapContentHeight(unbounded = true) else Modifier)
                    .onSizeChanged { controlsHeight = with(density) { it.height.toDp() } }) { controls() }
            }
        }

        if (controlsBottomStart != null || controlsBottomEnd != null) {
            Box(
                Modifier
                    .align(Alignment.BottomCenter)
                    .padding(start = if (direction == LayoutDirection.Ltr) safeLeft else safeRight,
                             end = if (direction == LayoutDirection.Ltr) safeRight else safeLeft)
                    .width(footerWidth)
                    .offset(y = -(bottomPanel + gap + if (bottomPanel > 0.dp) 0.dp else safeBottom))
                    .padding(horizontal = gap)
            ) {
                val popupBounds = with(density) {
                    val x = shellOrigin.x + ((if (panelRight) 0.dp else sidePanel) + safeLeft + gap).roundToPx()
                    val y = shellOrigin.y + (availableHeight - bottomPanel - gap - (if (bottomPanel > 0.dp) 0.dp else safeBottom) - bottomBand).roundToPx()
                    IntRect(x, y, x + (chromeWidth - gap * 2).coerceAtLeast(0.dp).roundToPx(), y + bottomBand.roundToPx())
                }
                val belowPanelBounds = with(density) {
                    val x = shellOrigin.x + (safeLeft + gap).roundToPx()
                    val y = shellOrigin.y + (safeTop + gap * 2 + sidePanelHeight).roundToPx()
                    IntRect(x, y, x + (footerWidth - gap * 2).coerceAtLeast(0.dp).roundToPx(),
                        maxOf(y, shellOrigin.y + (availableHeight - safeBottom - gap).roundToPx()))
                }
                val popupFitsBelowPanel = with(density) { belowPanelBounds.height >= (bottomControlsHeight + gap * 10).roundToPx() }
                CompositionLocalProvider(LocalMapPopupRegion provides MapPopupRegion(popupBounds, bottomBand > 0.dp && !cornersGiveWay)) {
                BottomControlsLayout(
                    label = bottomControlsLabel,
                    start = controlsBottomStart?.let { content -> {
                        val region = LocalMapPopupRegion.current
                        CompositionLocalProvider(LocalMapPopupRegion provides region?.copy(bounds = if (panel != null && isRegularWidth && panelPlacement == KozmosMapPanelPlacement.Start && popupFitsBelowPanel) belowPanelBounds else popupBounds)) {
                            Box(Modifier.onSizeChanged { bottomStartWidth = with(density) { it.width.toDp() } }) { content() }
                        }
                    } },
                    end = controlsBottomEnd?.let { content -> {
                        val region = LocalMapPopupRegion.current
                        CompositionLocalProvider(LocalMapPopupRegion provides region?.copy(bounds = if (panel != null && isRegularWidth && panelPlacement == KozmosMapPanelPlacement.End && popupFitsBelowPanel) belowPanelBounds else popupBounds)) {
                            Box(Modifier.onSizeChanged { bottomEndWidth = with(density) { it.width.toDp() } }) { content() }
                        }
                    } },
                    // Given way to the credits, they are not placed.
                    availableHeight = if (cornersGiveWay) 0.dp else bottomBand,
                    modifier = Modifier.fillMaxWidth()
                        .then(if (bottomBand <= 0.dp || cornersGiveWay) Modifier.clearAndSetSemantics {} else Modifier),
                    onHeight = { bottomControlsHeight = with(density) { it.toDp() } }
                )
                }
            }
        }

        if (attribution != null) {
            Box(
                Modifier.align(Alignment.BottomCenter)
                    .padding(start = if (direction == LayoutDirection.Ltr) safeLeft else safeRight,
                             end = if (direction == LayoutDirection.Ltr) safeRight else safeLeft)
                    .width(footerWidth)
                    .offset(y = -(bottomPanel + gap + attributionLift + if (bottomPanel > 0.dp) 0.dp else safeBottom))
                    .padding(horizontal = gap)
                    .padding(horizontal = if (attributionAboveCorners) 0.dp else attributionCornerReserve),
                contentAlignment = Alignment.Center
            ) {
                Box(Modifier.fillMaxWidth().onSizeChanged {
                    val height = with(density) { it.height.toDp() }
                    attributionHeight = height
                    if (!attributionCompact) attributionFullHeight = height
                }, contentAlignment = Alignment.Center) {
                    CompositionLocalProvider(LocalKozmosMapAttributionCompact provides attributionCompact) { attribution() }
                }
                if (attributionCompact) {
                    // Given way, the brand is still measured: the whole
                    // attribution, at the width it would be drawn, never
                    // placed and without semantics, so the shell knows when it
                    // fits again.
                    Layout(
                        content = { CompositionLocalProvider(LocalKozmosMapAttributionCompact provides false) { attribution() } },
                        modifier = Modifier.fillMaxWidth().clearAndSetSemantics {}
                    ) { measurables, constraints ->
                        val loose = constraints.copy(minWidth = 0, minHeight = 0)
                        val whole = measurables.maxOfOrNull { it.measure(loose).height } ?: 0
                        if (whole > 0) attributionFullHeight = whole.toDp()
                        layout(0, 0) {}
                    }
                }
            }
        }
        if (panel != null) {
            val radius = KozmosDimensions.semanticsRadiusPanel

            if (isRegularWidth) {
                // 42% of the shell, capped at 416.dp — computed rather than
                // chained, because `widthIn` before `fillMaxWidth` would take
                // the fraction of the cap instead of capping the fraction.
                val panelWidth = minOf(416.dp, availableWidth * 0.42f)
                val sidePanelCap = (availableHeight - safeTop - safeBottom - gap * 2 -
                    maxOf(if (cornersVisible) bottomControlsHeight + gap else 0.dp,
                        if (footerHeight > 0.dp) footerHeight + attributionLift + gap else 0.dp)).coerceAtLeast(0.dp)

                Surface(
                    modifier = Modifier
                        .windowInsetsPadding(WindowInsets.safeDrawing)
                        .padding(KozmosDimensions.primitivesLayoutSpacing200)
                        .width(panelWidth)
                        .heightIn(max = sidePanelCap)
                        .onSizeChanged { sidePanelHeight = with(density) { it.height.toDp() } }
                        .align(
                            if (panelPlacement == KozmosMapPanelPlacement.End) {
                                Alignment.TopEnd
                            } else {
                                Alignment.TopStart
                            }
                        )
                        .semantics { contentDescription = panelLabel },
                    shape = RoundedCornerShape(radius),
                    color = KozmosSurfaceDefaults.tint(panelSurface),
                    border = KozmosSurfaceDefaults.border(panelSurface),
                    shadowElevation = 24.dp
                ) {
                    // Beside the map the header is the panel's first row, and
                    // the panel takes the rest at the size it always had.
                    // Both sit on the panel's surface (decisions 43 and 48).
                    CompositionLocalProvider(
                        LocalKozmosPanelSurface provides panelSurface,
                        LocalKozmosSurfaceStyle provides panelSurface
                    ) {
                        Column {
                            if (panelHeader != null) {
                                Box(modifier = Modifier.fillMaxWidth().padding(vertical = gap)) { panelHeader() }
                            }
                            Box(modifier = Modifier.fillMaxWidth().weight(1f, fill = false)
                                .padding(top = if (panelHeader == null) gap else 0.dp)) {
                                // The shell supplied top padding or the header's
                                // bottom gap. Hosted parts must not add it again.
                                CompositionLocalProvider(
                                    LocalKozmosPanelInsetTop provides gap,
                                    LocalKozmosPanelClearanceTop provides 0.dp,
                                    content = panel
                                )
                            }
                        }
                    }
                }
            } else {
                BottomSheet(
                    panel = panel,
                    panelHeader = panelHeader,
                    panelLabel = panelLabel,
                    panelSurface = panelSurface,
                    panelDetents = panelDetents,
                    panelDetent = panelDetent,
                    onPanelDetentChange = onPanelDetentChange,
                    shellHeight = availableHeight,
                    maximumHeight = maximumPanelHeight,
                    radius = radius,
                    modifier = Modifier.align(Alignment.BottomCenter).onSizeChanged { panelHeight = with(density) { it.height.toDp() } }
                )
            }
        }
    }
}

/** The 0.7 positional signature, including its trailing detent callback. */
@Composable
fun KozmosAdaptiveMapShell(
    map: @Composable () -> Unit,
    modifier: Modifier,
    mapLabel: String,
    mapStatus: KozmosMapReadiness,
    mapStatusContent: (@Composable () -> Unit)?,
    controls: (@Composable () -> Unit)?,
    topBar: (@Composable () -> Unit)?,
    panel: (@Composable () -> Unit)?,
    panelHeader: (@Composable () -> Unit)?,
    panelLabel: String,
    panelPlacement: KozmosMapPanelPlacement,
    collisionInsets: KozmosMapCollisionInsets,
    onCollisionInsetsChange: ((KozmosMapCollisionInsets) -> Unit)?,
    panelSurface: KozmosSurfaceStyle,
    panelDetents: List<KozmosMapPanelDetent>,
    panelDetent: KozmosMapPanelDetent?,
    controlsBottomStart: (@Composable () -> Unit)?,
    controlsBottomEnd: (@Composable () -> Unit)?,
    bottomControlsPadCamera: Boolean,
    attribution: (@Composable () -> Unit)?,
    onPanelDetentChange: ((KozmosMapPanelDetent) -> Unit)?
) = KozmosAdaptiveMapShell(
    map = map, modifier = modifier, mapLabel = mapLabel, mapStatus = mapStatus,
    mapStatusContent = mapStatusContent, controls = controls, topBar = topBar,
    panel = panel, panelHeader = panelHeader, panelLabel = panelLabel,
    panelPlacement = panelPlacement, collisionInsets = collisionInsets,
    onCollisionInsetsChange = onCollisionInsetsChange, panelSurface = panelSurface,
    panelDetents = panelDetents, panelDetent = panelDetent,
    controlsBottomStart = controlsBottomStart, controlsBottomEnd = controlsBottomEnd,
    bottomControlsPadCamera = bottomControlsPadCamera, attribution = attribution,
    controlsLabel = "Map controls", bottomControlsLabel = "Map corner controls",
    onPanelDetentChange = onPanelDetentChange
)

/**
 * The pre-corner positional signature. Keep it for source consumers; named
 * calls and trailing detent callbacks continue through the primary overload.
 */
@Composable
fun KozmosAdaptiveMapShell(
    map: @Composable () -> Unit,
    modifier: Modifier,
    mapLabel: String,
    mapStatus: KozmosMapReadiness,
    mapStatusContent: (@Composable () -> Unit)?,
    controls: (@Composable () -> Unit)?,
    topBar: (@Composable () -> Unit)?,
    panel: (@Composable () -> Unit)?,
    panelHeader: (@Composable () -> Unit)?,
    panelLabel: String,
    panelPlacement: KozmosMapPanelPlacement,
    collisionInsets: KozmosMapCollisionInsets,
    onCollisionInsetsChange: ((KozmosMapCollisionInsets) -> Unit)?,
    panelSurface: KozmosSurfaceStyle,
    panelDetents: List<KozmosMapPanelDetent>,
    panelDetent: KozmosMapPanelDetent?,
    onPanelDetentChange: ((KozmosMapPanelDetent) -> Unit)?
) = KozmosAdaptiveMapShell(
    map = map, modifier = modifier, mapLabel = mapLabel, mapStatus = mapStatus,
    mapStatusContent = mapStatusContent, controls = controls, topBar = topBar,
    panel = panel, panelHeader = panelHeader, panelLabel = panelLabel,
    panelPlacement = panelPlacement, collisionInsets = collisionInsets,
    onCollisionInsetsChange = onCollisionInsetsChange, panelSurface = panelSurface,
    panelDetents = panelDetents, panelDetent = panelDetent,
    controlsBottomStart = null, controlsBottomEnd = null,
    onPanelDetentChange = onPanelDetentChange
)

/**
 * The docked sheet: the Pointr prototype's three detents and its drag rule,
 * as scripts/measure-prototype-sheet.cjs drove and measured them, shared with
 * the iOS and web shells. The whole sheet drags; a scrollable inside it takes
 * part through nested scrolling, so it scrolls only at the largest detent
 * and a downward drag empties its scroll before the sheet moves; a release
 * snaps to the nearest detent, the fling's velocity counted.
 */
@Composable
private fun BottomSheet(
    panel: @Composable () -> Unit,
    panelHeader: (@Composable () -> Unit)?,
    panelLabel: String,
    panelSurface: KozmosSurfaceStyle,
    panelDetents: List<KozmosMapPanelDetent>,
    panelDetent: KozmosMapPanelDetent?,
    onPanelDetentChange: ((KozmosMapPanelDetent) -> Unit)?,
    shellHeight: Dp,
    maximumHeight: Dp,
    radius: Dp,
    modifier: Modifier = Modifier
) {
    val density = LocalDensity.current
    // What the last measure pass learned about the content: the peek anchor's
    // edge and the content's height. Written in layout, read for the gesture
    // maths; the height itself is decided in the same pass, so the first
    // frame is already right.
    var measures by remember { mutableStateOf(KozmosPanelMeasures()) }
    val offered = if (panelDetents.isEmpty()) listOf(KozmosMapPanelDetent.Medium) else panelDetents
    val ordered = orderPanelDetents(offered, shellHeight, measures)
    var uncontrolled by remember {
        mutableStateOf(if (ordered.contains(KozmosMapPanelDetent.Medium)) KozmosMapPanelDetent.Medium else ordered[ordered.size / 2])
    }
    val active = panelDetent ?: uncontrolled
    fun heights(with: KozmosPanelMeasures): Triple<Dp, Dp, Dp> {
        val sorted = orderPanelDetents(offered, shellHeight, with)
        val smallest = minOf(sorted.first().height(shellHeight, with), maximumHeight)
        val largest = minOf(sorted.last().height(shellHeight, with), maximumHeight)
        return Triple(smallest, largest, active.height(shellHeight, with).coerceIn(smallest, largest))
    }
    val (smallest, largest, settled) = heights(measures)
    val atLargest = settled >= largest - 0.5.dp
    // Dragging up is a negative offset and makes the sheet taller.
    var dragOffset by remember { mutableFloatStateOf(0f) }
    // Between detents on the standard motion, the prototype's own curve.
    val animatedSettled by animateDpAsState(
        targetValue = settled,
        animationSpec = KozmosTransitions.standard(),
        label = "kozmos-sheet-detent"
    )
    // The footer can cap several detents to the same rendered height. Keep
    // cycling/step semantics tied to the chosen detent, not that capped size.
    val index = ordered.indexOf(active).takeIf { it >= 0 }
        ?: ordered.indexOfFirst { it.height(shellHeight, measures).value.roundToInt() == active.height(shellHeight, measures).value.roundToInt() }.coerceAtLeast(0)
    fun setDetent(detent: KozmosMapPanelDetent) {
        if (panelDetent == null) uncontrolled = detent
        if (detent != active) onPanelDetentChange?.invoke(detent)
    }
    fun snap(velocity: Float) {
        // The fling's velocity, projected 120 ms on, so a fast short drag
        // still lands on the detent it was aiming for.
        val target = with(density) { (settled - dragOffset.toDp() - (velocity * 0.12f).toDp()) }
        dragOffset = 0f
        nearestPanelDetent(ordered, target, shellHeight, measures)?.let(::setDetent)
    }
    val connection = remember(atLargest, smallest, largest) {
        object : NestedScrollConnection {
            // A child scrolling up grows the sheet until it is at the largest
            // detent; only then does the child keep the delta.
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                if (source != NestedScrollSource.Drag || available.y >= 0f || atLargest) return Offset.Zero
                if (with(density) { (settled - dragOffset.toDp()) } >= largest) return Offset.Zero
                dragOffset += available.y
                return Offset(0f, available.y)
            }

            // A child that has scrolled back to its top hands what is left of
            // a downward drag to the sheet.
            override fun onPostScroll(consumed: Offset, available: Offset, source: NestedScrollSource): Offset {
                if (source != NestedScrollSource.Drag || available.y <= 0f) return Offset.Zero
                dragOffset += available.y
                return Offset(0f, available.y)
            }

            override suspend fun onPreFling(available: Velocity): Velocity {
                if (dragOffset == 0f) return Velocity.Zero
                snap(available.y)
                return available
            }
        }
    }

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .nestedScroll(connection)
            // The whole sheet drags, not only its handle: the prototype's rule.
            .draggable(
                orientation = Orientation.Vertical,
                state = rememberDraggableState { delta -> dragOffset += delta },
                onDragStopped = { velocity -> snap(velocity) }
            )
            .semantics { contentDescription = panelLabel },
        shape = RoundedCornerShape(topStart = radius, topEnd = radius),
        color = KozmosSurfaceDefaults.tint(panelSurface),
        border = KozmosSurfaceDefaults.border(panelSurface),
        shadowElevation = 24.dp
    ) {
        // By the detents on offer, as the iOS shell decides, not by their
        // measured heights: those count the handle, so a handle that came and
        // went with them measured again every frame — a sheet fitted to
        // content within 16 of the largest detent folded the two, lost its
        // handle, unfolded and drew it again.
        val showsHandle = offered.distinct().size > 1
        // What the sheet leaves above its content, for a part with its own
        // top padding to top up rather than add to (GAP-083): the handle's
        // row, and its target's clearance — unless a header sits there.
        val underHandle = showsHandle && panelHeader == null
        val insetTop = if (underHandle) SheetHandleRowHeight else PanelContentSpacing
        val clearanceTop = if (underHandle) HandleClearance else 0.dp
        Layout(
            content = {
                // What the sheet hosts sits on its surface (decisions 43 and
                // 48). Not a layout of its own: the parts below are still the
                // Layout's.
                CompositionLocalProvider(
                    LocalKozmosPanelSurface provides panelSurface,
                    LocalKozmosSurfaceStyle provides panelSurface
                ) {
                    if (showsHandle) {
                        SheetHandle(
                            description = active.description,
                            index = index,
                            count = ordered.size,
                            onCycle = { setDetent(ordered[(index + 1) % ordered.size]) },
                            onStep = { step -> setDetent(ordered[(index + step).coerceIn(0, ordered.size - 1)]) },
                            modifier = Modifier.layoutId(SheetPart.Handle)
                        )
                    }
                    if (panelHeader != null) {
                        // Outside whatever the panel scrolls: a vertical drag on
                        // it reaches the sheet's own drag, however far the list
                        // under it has scrolled.
                        Box(
                            modifier = Modifier
                                .layoutId(SheetPart.Header)
                                .fillMaxWidth()
                                .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Horizontal))
                                .padding(top = if (showsHandle) 0.dp else PanelContentSpacing,
                                    bottom = PanelContentSpacing)
                        ) { panelHeader() }
                    }
                    Box(
                        modifier = Modifier
                            .layoutId(SheetPart.Content)
                            .fillMaxWidth()
                            // The sheet's surface reaches the bottom edge; what it
                            // holds keeps above the navigation bar.
                            .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Bottom + WindowInsetsSides.Horizontal))
                            .padding(top = if (!showsHandle && panelHeader == null) PanelContentSpacing else 0.dp)
                    ) {
                        CompositionLocalProvider(
                            LocalKozmosPanelInsetTop provides insetTop,
                            LocalKozmosPanelClearanceTop provides clearanceTop,
                            content = panel
                        )
                    }
                }
            }
        ) { measurables, constraints ->
            // The content keeps its own size at every detent: measured as tall
            // as the largest detent allows and clipped to the sheet, so a peek
            // anchor row is never squashed by a collapsed sheet and a list
            // inside has a bounded height. The header keeps its own height as
            // well, and the content is measured in what it leaves.
            val handleHeight = SheetHandleRowHeight.roundToPx()
            val loose = constraints.copy(minWidth = 0, minHeight = 0)
            fun part(id: SheetPart) = measurables.firstOrNull { it.layoutId == id }
            val handle = part(SheetPart.Handle)?.measure(loose.copy(maxHeight = handleHeight))
            // Under the handle the header starts the handle's clearance below
            // its row (decision 14): its first control — the search field a
            // header usually starts with — sat flush under the row, 8 from
            // the handle's centre, inside the 24dp circle its target keeps
            // clear (WCAG 2.5.8). As the web's header has since #109.
            val headerClearance = if (handle != null && part(SheetPart.Header) != null) HandleClearance.roundToPx() else 0
            val largestNow = minOf(orderPanelDetents(offered, shellHeight, measures).last().height(shellHeight, measures), maximumHeight).roundToPx()
            val header = part(SheetPart.Header)?.measure(loose.copy(maxHeight = largestNow))
            val content = part(SheetPart.Content)!!.measure(
                loose.copy(maxHeight = (largestNow - (header?.height ?: 0) - headerClearance).coerceAtLeast(0))
            )
            val headerTop = (handle?.height ?: 0) + headerClearance
            val contentTop = headerTop + (header?.height ?: 0)
            // An anchor in the header outranks one in the content, as React's
            // `measurePeekBottom` has it. The header's own bottom edge is not
            // an anchor: it sets the least the collapsed detent may be
            // (`headerCollapsedHeight`); a header that draws nothing is none.
            val headerLine = header?.get(KozmosPanelPeekAnchorLine) ?: AlignmentLine.Unspecified
            val contentLine = content[KozmosPanelPeekAnchorLine]
            val headerGap = PanelContentSpacing.roundToPx()
            val headerPadding = headerGap + if (handle == null) headerGap else 0
            val fresh = KozmosPanelMeasures(
                contentHeight = (contentTop + content.height).toDp(),
                peekBottom = when {
                    headerLine != AlignmentLine.Unspecified -> (headerTop + headerLine).toDp()
                    contentLine != AlignmentLine.Unspecified -> (contentTop + contentLine).toDp()
                    else -> 0.dp
                },
                // Exclude shell padding: an empty header is still empty,
                // and the collapsed peek margin already supplies its gap.
                headerBottom = if (header != null && header.height > headerPadding)
                    (contentTop - headerGap).toDp() else 0.dp
            )
            if (fresh != measures) measures = fresh
            val (freshSmallest, freshLargest, freshSettled) = heights(fresh)
            // Between detents the animated height leads; otherwise the fresh
            // measurement decides at once, so the first frame is right.
            val resting = animatedSettled == settled
            val height = with(density) {
                ((if (resting) freshSettled else animatedSettled) - dragOffset.toDp()).coerceIn(freshSmallest, freshLargest)
            }
            layout(constraints.maxWidth, height.roundToPx().coerceIn(constraints.minHeight, constraints.maxHeight)) {
                handle?.place(0, 0)
                header?.place(0, headerTop)
                content.place(0, contentTop)
            }
        }
    }
}

/** The sheet's parts, in the order they stack. */
private enum class SheetPart { Handle, Header, Content }

/** The grab handle's row: 16 tall, a 40 x 4 capsule; a tap cycles the detents, accessibility adjusts them. */
@Composable
private fun SheetHandle(
    description: String,
    index: Int,
    count: Int,
    onCycle: () -> Unit,
    onStep: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(SheetHandleRowHeight)
            .clickable(onClick = onCycle)
            .semantics {
                contentDescription = "Panel height"
                stateDescription = description
                progressBarRangeInfo = ProgressBarRangeInfo(index.toFloat(), 0f..(count - 1).toFloat(), count - 1)
                setProgress { value -> onStep(value.roundToInt() - index); true }
            },
        contentAlignment = Alignment.TopCenter
    ) {
        Box(
            modifier = Modifier
                .padding(top = KozmosDimensions.primitivesLayoutSpacing75)
                .size(width = KozmosDimensions.primitivesLayoutSizing500, height = 4.dp)
                .background(KozmosThemeTokens.primitivesColorsBackground300, RoundedCornerShape(999.dp))
        )
    }
}
