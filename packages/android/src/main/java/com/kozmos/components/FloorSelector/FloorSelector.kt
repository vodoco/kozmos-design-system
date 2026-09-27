package com.kozmos.components.floorselector

import androidx.compose.foundation.background
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
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
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
    CompactStepper("compact-stepper")
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
 * own label. The defaults are the words these buttons always said — React's
 * read "Previous floor" and "Next floor".
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
    nextFloorLabel: String = "Floor down"
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
        nextFloorLabel = nextFloorLabel
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
 * [resultCountLabel] is how a count is said, for a visitor who cannot see the
 * marker, joined to the level's own label: "Level 2, 3 results". A function
 * because a count needs a plural rule, and the design system has no locale to
 * pick one with — the product does. The default is English, singular for one,
 * where React's reads "1 results".
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
    }
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
