package com.kozmos.components.floorselector

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButton
import com.kozmos.contracts.KozmosFloorPresentation
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import com.kozmos.tokens.KozmosShadows
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

/** Layout of the floor selector, mirroring the React `FloorSelector.variant`. */
enum class KozmosFloorSelectorVariant(val value: String) {
    VerticalList("vertical-list"),
    HorizontalList("horizontal-list"),
    CompactStepper("compact-stepper"),

    /**
     * The SDK's level switcher (row 79, decision 38), for a control parked in
     * a corner of a map, where a permanent column of every level costs more of
     * the map than it is worth: at rest one map control showing the current
     * level's short label; activated, it grows into a column of every level
     * over itself, the current one outlined in the theme's primary. A choice,
     * Back, Escape or a tap outside closes the column.
     */
    Collapsible("collapsible")
}

/**
 * Switches the active level of a venue.
 *
 * Mirrors the React `FloorSelector` API. [selectedFloor] is the canonical floor
 * ID, never a display label, and the component reports selection rather than
 * deriving it.
 *
 * [previousFloorLabel] and [nextFloorLabel] are what the compact stepper's two
 * buttons are called, for a visitor who cannot see them: the previous level in
 * list order is on the up chevron, the next on the down. Hard-coded English
 * until row 67. Only the stepper draws them; the lists name each level by its
 * own label. The defaults are the words these buttons always said, "Floor up"
 * and "Floor down", which React and SwiftUI say too.
 *
 * [userFloor] and [userFloorLabel] mark the level the visitor is on, as the
 * other overload's do; only the collapsible switcher draws them.
 *
 * This overload is for venues whose IDs are already the labels: each entry is
 * shown and said as-is. Pass [KozmosFloorPresentation]s for a short label on
 * the button, the full one for TalkBack, closed levels and result counts.
 */
@Composable
fun KozmosFloorSelector(
    floors: List<String>,
    selectedFloor: String,
    onFloorSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    variant: KozmosFloorSelectorVariant = KozmosFloorSelectorVariant.VerticalList,
    label: String = "Floor selector",
    previousFloorLabel: String = "Floor up",
    nextFloorLabel: String = "Floor down",
    userFloor: String? = null,
    userFloorLabel: String = "your level"
) {
    val levels = remember(floors) {
        floors.map { KozmosFloorPresentation(id = it, label = it, shortLabel = it) }
    }
    KozmosFloorSelector(
        floors = levels,
        selectedFloor = selectedFloor,
        onFloorSelect = onFloorSelect,
        modifier = modifier,
        variant = variant,
        label = label,
        previousFloorLabel = previousFloorLabel,
        nextFloorLabel = nextFloorLabel,
        userFloor = userFloor,
        userFloorLabel = userFloorLabel
    )
}

/**
 * Switches the active level of a venue, as the product presents its levels.
 *
 * Each button shows the level's `shortLabel` while selection and analytics stay
 * keyed on its `id`, and TalkBack hears the full `label`, as React's and the
 * SwiftUI selector's do. A `disabled` level cannot be chosen, and the stepper
 * passes it. Until row 69 this selector took strings only, so a venue's floor
 * IDs had to double as what the buttons show and what TalkBack says, and there
 * was nowhere to put a count.
 *
 * A level's `resultCount` marks its button with a small count in the square's
 * trailing top corner, so a visitor can see the answer is upstairs without
 * changing level to find out (row 69, GAP-070). Only a count above zero is
 * marked: `null` is unknown, which is not the same as none, and a level with a
 * real zero reads as itself. Only the lists mark: the stepper shows one level
 * at a time, and a marker on the level already in view says nothing.
 *
 * [userFloor] is the level the visitor is on, by the same id as
 * [selectedFloor] (decision 38). The collapsible switcher marks it with a dot,
 * as the SDK's level switcher does: on the closed tile while the tile shows
 * that level, and on that level in the open column whichever level is shown.
 * `null` marks nothing. The product knows where the visitor is; the switcher
 * neither works it out nor chooses a level by it. [userFloorLabel] is how the
 * dot is said, joined to the level's own label: "Level 1, your level". Only
 * the collapsible draws the dot, as React's and SwiftUI's do.
 *
 * [resultCountLabel] is how a count is said, for a visitor who cannot see the
 * marker, joined to the level's own label: "Level 2, 3 results". A function
 * because a count needs a plural rule, and the design system has no locale to
 * pick one with — the product does. The default is English, singular for one,
 * as React's and SwiftUI's are.
 */
@JvmName("KozmosFloorSelectorOfLevels")
@Composable
fun KozmosFloorSelector(
    floors: List<KozmosFloorPresentation>,
    selectedFloor: String,
    onFloorSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    variant: KozmosFloorSelectorVariant = KozmosFloorSelectorVariant.VerticalList,
    label: String = "Floor selector",
    previousFloorLabel: String = "Floor up",
    nextFloorLabel: String = "Floor down",
    userFloor: String? = null,
    userFloorLabel: String = "your level",
    resultCountLabel: (Int) -> String = { count -> if (count == 1) "1 result" else "$count results" }
) {
    val trackEvent = LocalKozmosAnalytics.current
    val selectedIndex = floors.indexOfFirst { it.id == selectedFloor }.takeIf { it >= 0 } ?: 0
    val labelStyle = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold)
    // A level's square, and the result marker in it, grow by as much as the
    // label's text has, as the SwiftUI ones grow relative to the label's text
    // style: at a large font scale a fixed 40 let the label outgrow it. By the
    // label's factor rather than each size's own sp, because the system scales
    // large sizes less than small ones, and a marker scaled on its own grew to
    // cover the label. 1 at the default scale, where nothing changes.
    val growth = with(LocalDensity.current) {
        if (labelStyle.fontSize.isSp) labelStyle.fontSize.toDp().value / labelStyle.fontSize.value else 1f
    }
    val side = KozmosDimensions.primitivesLayoutSizing500 * growth

    fun select(floor: KozmosFloorPresentation) {
        trackEvent(
            KozmosAnalyticsEvent(
                component = "FloorSelector",
                eventName = "floor_selected",
                properties = mapOf("floor" to floor.id)
            )
        )
        onFloorSelect(floor.id)
    }

    if (variant == KozmosFloorSelectorVariant.Collapsible) {
        var expanded by remember { mutableStateOf(false) }
        KozmosFloorSwitcher(
            floors = floors,
            selectedFloor = selectedFloor,
            expanded = expanded,
            onExpandedChange = { open ->
                if (open && !expanded) {
                    trackEvent(
                        KozmosAnalyticsEvent(
                            component = "FloorSelector",
                            eventName = "floor_selector_expanded",
                            properties = mapOf("floor" to selectedFloor)
                        )
                    )
                }
                expanded = open
            },
            onChoose = { floor -> select(floor) },
            modifier = modifier,
            label = label,
            userFloor = userFloor,
            userFloorLabel = userFloorLabel,
            resultCountLabel = resultCountLabel
        )
        return
    }

    val floorButton: @Composable (KozmosFloorPresentation, Boolean) -> Unit = { floor, marksResults ->
        val isSelected = floor.id == selectedFloor
        val count = markedResultCount(floor, marksResults)
        // The marker lies over the square rather than in it, so the square's
        // round clip does not take its corner off; the two are one control's
        // size, so the marker is still inside the level's button.
        Box(modifier = if (floor.disabled) Modifier.alpha(0.4f) else Modifier) {
            Box(
                modifier = Modifier
                    .size(side)
                    .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusPanel))
                    .background(
                        if (isSelected) KozmosThemeTokens.primitivesColorsTheme500 else Color.Transparent
                    )
                    .clickable(enabled = !floor.disabled) { select(floor) }
                    .semantics {
                        // The button shows the short label; TalkBack gets the
                        // full one, and the result count with it where the
                        // button marks one.
                        contentDescription = spokenFloorLabel(floor, marksResults, resultCountLabel)
                        selected = isSelected
                    },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = floor.shortLabel,
                    color = if (isSelected) {
                        KozmosThemeTokens.primitivesColorsBackground0
                    } else {
                        KozmosThemeTokens.primitivesColorsForeground100
                    },
                    style = labelStyle
                )
            }
            if (count != null) {
                ResultMarker(count, growth, Modifier.align(Alignment.TopEnd))
            }
        }
    }

    // Steps through the floor list. `offset` is in list order, so -1 is the
    // entry above the current one; a closed level is passed over.
    val stepperButton: @Composable (Int, String) -> Unit = { offset, description ->
        val target = reachableFloorIndex(floors, selectedIndex, offset)
        Box(
            modifier = Modifier
                .size(side)
                .alpha(if (target != null) 1f else 0.4f)
                .clickable(enabled = target != null) { target?.let { select(floors[it]) } }
                .semantics { contentDescription = description },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (offset < 0) {
                    Icons.Default.KeyboardArrowUp
                } else {
                    Icons.Default.KeyboardArrowDown
                },
                contentDescription = null,
                tint = KozmosThemeTokens.primitivesColorsForeground500
            )
        }
    }

    val rootModifier = modifier
        .shadow(KozmosShadows.semanticsElevationFloating, RoundedCornerShape(KozmosDimensions.semanticsRadiusPanel))
        .background(
            KozmosThemeTokens.primitivesColorsBackground0,
            RoundedCornerShape(KozmosDimensions.semanticsRadiusPanel)
        )
        .padding(KozmosDimensions.primitivesLayoutSpacing50)
        .semantics { contentDescription = label }

    val spacing = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)

    when (variant) {
        KozmosFloorSelectorVariant.HorizontalList -> Row(
            modifier = rootModifier,
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = spacing
        ) {
            floors.forEach { floorButton(it, true) }
        }

        KozmosFloorSelectorVariant.VerticalList -> Column(
            modifier = rootModifier,
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = spacing
        ) {
            floors.forEach { floorButton(it, true) }
        }

        KozmosFloorSelectorVariant.CompactStepper -> Column(
            modifier = rootModifier,
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = spacing
        ) {
            stepperButton(-1, previousFloorLabel)
            // A selection the list does not hold is shown as it was given.
            floorButton(
                floors.firstOrNull { it.id == selectedFloor }
                    ?: KozmosFloorPresentation(id = selectedFloor, label = selectedFloor, shortLabel = selectedFloor),
                false
            )
            stepperButton(1, nextFloorLabel)
        }

        // Drawn above, by the switcher.
        KozmosFloorSelectorVariant.Collapsible -> Unit
    }
}

/**
 * How far the switcher's open column reaches past its tile, and how far its
 * levels sit inside its edge and apart: the tile's 16 corners inside the
 * column's 20, concentric.
 */
internal val SwitcherInset = KozmosDimensions.primitivesLayoutSpacing50

/**
 * The collapsible variant (row 79, decision 38): the SDK's level switcher, the
 * open state held by the caller.
 *
 * At rest it is one tile, drawn by [KozmosMapControlButton] so it is the map's
 * own control, not a lookalike, and follows the shared map-control surface
 * wherever that goes: the current level's short label, and the visitor's dot
 * while it shows their level. Activated, it grows into a column of every
 * level in the platform's [Popup] — its own window, so a parent cannot clip
 * it, and the platform's own Back and tap outside close it. The column lies
 * over the tile, its bottom level on the tile, and turns downwards from the
 * tile's top where the window has no room above.
 *
 * TalkBack hears the tile's state from the platform's expand and collapse
 * actions, in the visitor's own language, and the level it shows from a
 * polite live region, so a choice is announced as the tile's new name.
 */
@Composable
internal fun KozmosFloorSwitcher(
    floors: List<KozmosFloorPresentation>,
    selectedFloor: String,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    onChoose: (KozmosFloorPresentation) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "Floor selector",
    userFloor: String? = null,
    userFloorLabel: String = "your level",
    resultCountLabel: (Int) -> String = { count -> if (count == 1) "1 result" else "$count results" }
) {
    // A selection the list does not hold is shown as it was given, as the
    // stepper shows it.
    val shown = floors.firstOrNull { it.id == selectedFloor }
        ?: KozmosFloorPresentation(id = selectedFloor, label = selectedFloor, shortLabel = selectedFloor)
    val tileShowsUserFloor = userFloor != null && shown.id == userFloor
    val tileLabel = if (tileShowsUserFloor) "${shown.label}, $userFloorLabel" else shown.label
    val density = LocalDensity.current
    // The map control's own size, read off the tile: the column's levels take
    // it, so its bottom level lies exactly over the tile whatever size the
    // shared map-control surface gives it.
    var tileSize by remember { mutableStateOf(DpSize(44.dp, 44.dp)) }
    val tileFocus = remember { FocusRequester() }
    val inputModeManager = LocalInputModeManager.current
    var returnFocus by remember { mutableStateOf(false) }

    // Closes the column. From a keyboard, focus goes back to the tile, which
    // names the level now shown; a touch leaves focus where the visitor put it.
    fun close() {
        onExpandedChange(false)
        if (inputModeManager.inputMode == InputMode.Keyboard) returnFocus = true
    }

    LaunchedEffect(expanded, returnFocus) {
        if (!expanded && returnFocus) {
            tileFocus.requestFocus()
            returnFocus = false
        }
    }

    Box(modifier = modifier.semantics { contentDescription = label }) {
        KozmosMapControlButton(
            label = tileLabel,
            onClick = { if (expanded) close() else onExpandedChange(true) },
            modifier = Modifier
                .onSizeChanged { size -> tileSize = with(density) { DpSize(size.width.toDp(), size.height.toDp()) } }
                .focusRequester(tileFocus)
                .semantics {
                    if (expanded) {
                        collapse { close(); true }
                    } else {
                        expand { onExpandedChange(true); true }
                    }
                    liveRegion = LiveRegionMode.Polite
                },
            icon = {
                Text(
                    text = shown.shortLabel,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    maxLines = 1
                )
            }
        )
        // The tile marks the visitor's level only while it shows it, and no
        // result count: it is the level already in view.
        if (tileShowsUserFloor) {
            UserFloorDot(Modifier.align(Alignment.TopEnd))
        }
        if (expanded) {
            val inset = with(density) { SwitcherInset.roundToPx() }
            Popup(
                popupPositionProvider = remember(inset) { FloorSwitcherColumnPosition(inset) },
                onDismissRequest = { close() },
                properties = FloorSwitcherPopupProperties
            ) {
                KozmosFloorSwitcherColumn(
                    floors = floors,
                    selectedFloor = selectedFloor,
                    userFloor = userFloor,
                    userFloorLabel = userFloorLabel,
                    resultCountLabel = resultCountLabel,
                    levelSize = tileSize,
                    onChoose = { floor ->
                        onChoose(floor)
                        close()
                    },
                    onEscape = { close() }
                )
            }
        }
    }
}

/**
 * The switcher's open column: every level, top floor first, each the tile's
 * size and its short label, as the tile shows it. The map control's surface,
 * edge and shadow, opaque where the tile is nine tenths: the column lies over
 * the tile, and the tile's own label showing through read as part of it.
 *
 * The board's states: the current level outlined in the theme's primary, its
 * label in the primary; a closed level on the muted surface in the muted ink.
 * The visitor's dot at a level's top end corner and a result count at its
 * bottom end one, so neither covers the other.
 */
@Composable
internal fun KozmosFloorSwitcherColumn(
    floors: List<KozmosFloorPresentation>,
    selectedFloor: String,
    userFloor: String?,
    userFloorLabel: String,
    resultCountLabel: (Int) -> String,
    levelSize: DpSize,
    onChoose: (KozmosFloorPresentation) -> Unit,
    modifier: Modifier = Modifier,
    onEscape: () -> Unit = {}
) {
    val edge = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer)
    val levelShape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val labelStyle = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold)
    Column(
        modifier = modifier
            // The map control's own shadow, as KozmosMapControlButton casts it.
            .shadow(8.dp, edge)
            .background(KozmosThemeTokens.primitivesColorsBackground0, edge)
            .border(1.dp, KozmosThemeTokens.primitivesColorsForeground300, edge)
            .padding(SwitcherInset)
            // Escape from a keyboard, as Back: the popup hears only Back.
            .onPreviewKeyEvent { event ->
                if (event.key == Key.Escape) {
                    if (event.type == KeyEventType.KeyUp) onEscape()
                    true
                } else {
                    false
                }
            },
        verticalArrangement = Arrangement.spacedBy(SwitcherInset)
    ) {
        floors.forEach { floor ->
            val isCurrent = floor.id == selectedFloor
            val count = markedResultCount(floor, true)
            // The marks lie over the level rather than in it, so its round
            // clip does not take their corners off, as the lists' markers do.
            Box(modifier = Modifier.size(levelSize)) {
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .clip(levelShape)
                        .background(
                            if (floor.disabled) KozmosThemeTokens.primitivesColorsBackground100 else Color.Transparent
                        )
                        .then(
                            if (isCurrent) {
                                Modifier.border(1.dp, KozmosThemeTokens.primitivesColorsTheme600, levelShape)
                            } else {
                                Modifier
                            }
                        )
                        .clickable(enabled = !floor.disabled, role = Role.Button) { onChoose(floor) }
                        .semantics {
                            contentDescription = switcherSpokenLabel(floor, userFloor, userFloorLabel, resultCountLabel)
                            selected = isCurrent
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = floor.shortLabel,
                        color = when {
                            isCurrent -> KozmosThemeTokens.primitivesColorsTheme600
                            floor.disabled -> KozmosThemeTokens.primitivesColorsForeground400
                            else -> KozmosThemeTokens.primitivesColorsForeground100
                        },
                        style = labelStyle,
                        maxLines = 1
                    )
                }
                if (floor.id == userFloor) {
                    UserFloorDot(Modifier.align(Alignment.TopEnd))
                }
                if (count != null) {
                    ResultMarker(count, 1f, Modifier.align(Alignment.BottomEnd))
                }
            }
        }
    }
}

/**
 * Where the switcher's open column goes: over the tile, its bottom level on
 * the tile — the column reaching past the tile's end and bottom edges by the
 * inset, so its levels line up with it — and turned downwards from the tile's
 * top where the window has no room above. Mirrored right to left.
 */
internal class FloorSwitcherColumnPosition(private val inset: Int) : PopupPositionProvider {
    override fun calculatePosition(
        anchorBounds: IntRect,
        windowSize: IntSize,
        layoutDirection: LayoutDirection,
        popupContentSize: IntSize
    ): IntOffset {
        val x = if (layoutDirection == LayoutDirection.Ltr) {
            anchorBounds.right + inset - popupContentSize.width
        } else {
            anchorBounds.left - inset
        }
        val above = anchorBounds.bottom + inset - popupContentSize.height
        val y = if (above >= 0) above else anchorBounds.top - inset
        return IntOffset(x.coerceIn(0, maxOf(0, windowSize.width - popupContentSize.width)), y)
    }
}

/**
 * The platform's popup, focusable: its own Back — and Escape, which Android
 * falls back to Back for — and a tap outside close the column.
 */
internal val FloorSwitcherPopupProperties = PopupProperties(
    focusable = true,
    dismissOnBackPress = true,
    dismissOnClickOutside = true
)

/**
 * The visitor's level (decision 38): a dot in the theme's primary with a halo
 * of the surface, at the top end corner, as the SDK's level switcher marks it
 * — 10 across, 4 in, as React's and SwiftUI's are. Cleared from the
 * semantics: the level's own description says it.
 */
@Composable
private fun UserFloorDot(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .padding(KozmosDimensions.primitivesLayoutSpacing50)
            .clearAndSetSemantics {}
            .size(10.dp)
            .background(KozmosThemeTokens.primitivesColorsBackground0, CircleShape)
            .padding(2.dp)
            .background(KozmosThemeTokens.primitivesColorsTheme600, CircleShape)
    )
}

/**
 * What TalkBack hears for a level in the switcher's column: its label, the
 * visitor's level in the product's words, then its count — "Level 2, your
 * level, 3 results". Only the switcher draws the dot, so only it says it.
 */
internal fun switcherSpokenLabel(
    floor: KozmosFloorPresentation,
    userFloor: String?,
    userFloorLabel: String,
    resultCountLabel: (Int) -> String
): String {
    val parts = mutableListOf(floor.label)
    if (userFloor != null && floor.id == userFloor) parts += userFloorLabel
    markedResultCount(floor, true)?.let { parts += resultCountLabel(it) }
    return parts.joinToString(", ")
}

/**
 * The count, drawn once and said once: a pill in the theme's primary, flush
 * in the square's trailing top corner, which mirrors right to left. Inside the
 * button, not proud of it, as React's is since c36a970d; flush rather than
 * React's 2px in, because that inset is on a 44px button and on a 40 square it
 * lays the marker over the level's label. React's 16 with a 10 count, grown by
 * the label's [growth] so it keeps its share of the square. Cleared from the
 * semantics: the button's own description carries the count, and hearing "3"
 * after "Level 2, 3 results" is noise. A plain number, as the category tile's
 * counter is.
 */
@Composable
private fun ResultMarker(count: Int, growth: Float, modifier: Modifier = Modifier) {
    val side = KozmosDimensions.primitivesLayoutSizing200 * growth
    val textSize = with(LocalDensity.current) { (10.dp * growth).toSp() }
    Box(
        modifier = modifier
            .clearAndSetSemantics {}
            .heightIn(min = side)
            .widthIn(min = side)
            .background(KozmosThemeTokens.primitivesColorsTheme600, CircleShape)
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing50 * growth),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = count.toString(),
            color = KozmosThemeTokens.primitivesColorsForeground1000,
            fontSize = textSize,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1
        )
    }
}

/**
 * The count a level's button marks, or null for none (row 69, GAP-070): only
 * a count above zero, and only where the levels are listed.
 */
internal fun markedResultCount(floor: KozmosFloorPresentation, marksResults: Boolean): Int? =
    floor.resultCount?.takeIf { marksResults && it > 0 }

/** What TalkBack hears for a level: its label, and the count its button marks. */
internal fun spokenFloorLabel(
    floor: KozmosFloorPresentation,
    marksResults: Boolean,
    resultCountLabel: (Int) -> String
): String {
    val count = markedResultCount(floor, marksResults) ?: return floor.label
    return "${floor.label}, ${resultCountLabel(count)}"
}

/** The next level that can be chosen `step` entries on in list order, passing closed ones; null past either end. */
internal fun reachableFloorIndex(floors: List<KozmosFloorPresentation>, from: Int, step: Int): Int? {
    var candidate = from + step
    while (candidate in floors.indices) {
        if (!floors[candidate].disabled) return candidate
        candidate += step
    }
    return null
}
