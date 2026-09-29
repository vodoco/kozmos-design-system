package com.kozmos.components.poiresultcard

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.kozmos.contracts.KozmosPOIAvailability
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultAction
import com.kozmos.contracts.KozmosPOIResultActionPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import com.kozmos.contracts.KozmosTravelTimeBand
import com.kozmos.contracts.KozmosTravelTimeTone
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/** Characters `encodeURIComponent` leaves untouched. */
private const val URI_COMPONENT_UNRESERVED =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!~*'()"

/**
 * Stable identifier for a POI result, shared with map markers so a pin and its
 * list row can be kept in sync from one selection ID.
 *
 * Produces the same value as the web `getPOIResultDomId`, so an identifier
 * generated on any platform matches the other two.
 */
fun kozmosPOIResultIdentifier(poiId: String): String = buildString {
    append("poi-result-")
    for (byte in poiId.toByteArray(Charsets.UTF_8)) {
        val char = byte.toInt().toChar()
        if (byte >= 0 && URI_COMPONENT_UNRESERVED.indexOf(char) >= 0) {
            append(char)
        } else {
            append('%')
            append(((byte.toInt() and 0xFF) + 0x100).toString(16).substring(1).uppercase())
        }
    }
}

/**
 * A POI search/list result row.
 *
 * Mirrors the React `POIResultCard`. Selection is reported upward only; the
 * card renders exactly the state described by [poi] and [result].
 *
 * The selected result shows the actions `result.actions` carries; one pressed
 * reaches [onAction] with the action and the POI's ID, and never selects.
 * Without [onAction] they are drawn disabled, never as enabled buttons that do
 * nothing.
 */
@Composable
fun KozmosPOIResultCard(
    poi: KozmosPOIPresentation,
    result: KozmosPOIResultPresentation,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    featuredLabel: String = "Featured",
    /** The floor the map shows: a result on it carries a dot before its floor. */
    currentFloorId: String? = null,
    selectionLabel: String? = null,
    actionsLabel: String = "Actions for this result",
    /**
     * The words for a walk shown as a band, when `result.travelEstimate.band`
     * is set (decision 50). English until the product gives its own, for one
     * band or all five.
     */
    travelTimeBandLabels: Map<KozmosTravelTimeBand, String> = emptyMap(),
    onAction: ((KozmosPOIResultAction, String) -> Unit)? = null
) {
    val trackEvent = LocalKozmosAnalytics.current
    val available = result.isAvailable

    // Shown only on the selected result: an action row on every card would be a
    // wall of buttons, and the tap that selects is the tap that asks.
    val visibleActions = if (result.selected && available) result.actions else emptyList()

    // The band's words when the product set a band (decision 50), the exact
    // minutes when it did not: the details card keeps those either way.
    val travelTimeText = result.travelEstimate?.let { estimate ->
        estimate.band?.let { band -> travelTimeBandLabels[band] ?: englishTravelTimeBandLabel(band) }
            ?: estimate.durationLabel
    }

    val accessibilityDescription = selectionLabel ?: listOfNotNull(
        poi.name,
        poi.categoryLabel,
        poi.locationLabel,
        poi.availabilityLabel,
        travelTimeText,
        if (available) null else result.unavailableReason
    ).joinToString(", ")

    Surface(
        onClick = {
            // An unavailable result is readable, never selected, as on the
            // web and iOS: their handlers return early too. Here because the
            // click Compose 1.6 puts in a disabled node's semantics still runs.
            if (!available) return@Surface
            trackEvent(
                KozmosAnalyticsEvent(
                    component = "POIResultCard",
                    eventName = "poi_result_selected",
                    properties = mapOf(
                        "poiId" to poi.id,
                        "resultIndex" to result.resultIndex.toString(),
                        "featured" to result.featured.toString()
                    )
                )
            )
            onSelect(poi.id)
        },
        modifier = modifier
            .fillMaxWidth()
            .semantics {
                contentDescription = accessibilityDescription
                selected = result.selected
            },
        enabled = available,
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
        color = KozmosThemeTokens.primitivesColorsBackground0,
        border = BorderStroke(
            width = if (result.selected) 2.dp else 1.dp,
            color = if (result.selected) {
                KozmosThemeTokens.primitivesColorsTheme500
            } else {
                KozmosThemeTokens.semanticsBorderSubtle
            }
        )
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            if (result.featured) {
                Row(
                    modifier = Modifier
                        .padding(
                            start = KozmosDimensions.primitivesLayoutSpacing200,
                            top = KozmosDimensions.primitivesLayoutSpacing100
                        )
                        .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
                        .background(KozmosThemeTokens.componentsPrimaryButtonsAlertButtonBackgroundIdle)
                        .padding(
                            horizontal = KozmosDimensions.primitivesLayoutSpacing100,
                            vertical = KozmosDimensions.primitivesLayoutSpacing50
                        ),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(
                        KozmosDimensions.primitivesLayoutSpacing50
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        tint = KozmosThemeTokens.componentsPrimaryButtonsAlertButtonForegroundContentIdle,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = featuredLabel,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = KozmosThemeTokens.componentsPrimaryButtonsAlertButtonForegroundContentIdle
                    )
                }
            } else if (result.badge != null) {
                // One tab, one treatment: the prototypes draw "Popular Choice"
                // in the same amber as "Featured", so the LABEL distinguishes
                // them and the styling does not. What differs is meaning --
                // featured is the CMS's word and the map marker acts on it too.
                Row(
                    modifier = Modifier
                        .padding(
                            start = KozmosDimensions.primitivesLayoutSpacing200,
                            top = KozmosDimensions.primitivesLayoutSpacing100
                        )
                        .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
                        .background(KozmosThemeTokens.componentsPrimaryButtonsAlertButtonBackgroundIdle)
                        .padding(
                            horizontal = KozmosDimensions.primitivesLayoutSpacing100,
                            vertical = KozmosDimensions.primitivesLayoutSpacing50
                        ),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(
                        KozmosDimensions.primitivesLayoutSpacing50
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        tint = KozmosThemeTokens.componentsPrimaryButtonsAlertButtonForegroundContentIdle,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = result.badge.label,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = KozmosThemeTokens.componentsPrimaryButtonsAlertButtonForegroundContentIdle
                    )
                }
            }

            // 80 tall: the prototype's row.
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .defaultMinSize(minHeight = KozmosDimensions.primitivesLayoutSizing1000)
                    .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing200, vertical = KozmosDimensions.primitivesLayoutSpacing150),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(
                    KozmosDimensions.primitivesLayoutSpacing150
                )
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(
                        KozmosDimensions.primitivesLayoutSpacing25
                    )
                ) {
                    Text(
                        text = poi.name,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Normal,
                        color = KozmosThemeTokens.primitivesColorsForeground100,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    poi.categoryLabel?.let { categoryLabel ->
                        Text(
                            text = categoryLabel,
                            style = MaterialTheme.typography.bodyMedium,
                            color = KozmosThemeTokens.primitivesColorsForeground500,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(
                            KozmosDimensions.primitivesLayoutSpacing50
                        )
                    ) {
                        // A dot before the floor when it is the one the map shows.
                        if (currentFloorId != null && result.floorId == currentFloorId) {
                            Box(
                                modifier = Modifier
                                    .size(KozmosDimensions.primitivesLayoutSpacing75)
                                    .clip(CircleShape)
                                    .background(KozmosThemeTokens.primitivesColorsTheme500)
                            )
                        }
                        Text(
                            text = poi.locationLabel,
                            style = MaterialTheme.typography.bodyMedium,
                            color = KozmosThemeTokens.primitivesColorsForeground500,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    poi.availabilityLabel?.let { availabilityLabel ->
                        Text(
                            text = availabilityLabel,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold,
                            // Three tones, not two. "Closing soon" is a reason
                            // to hurry, so it cannot look like open; the place
                            // is still open, so it is not closed either.
                            color = when (poi.availability) {
                                KozmosPOIAvailability.Open ->
                                    KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonBackgroundIdle
                                KozmosPOIAvailability.OpeningSoon,
                                KozmosPOIAvailability.ClosingSoon ->
                                    KozmosThemeTokens.componentsPrimaryButtonsAlertButtonBackgroundIdle
                                else -> KozmosThemeTokens.primitivesColorsForeground500
                            }
                        )
                    }
                }

                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(
                        KozmosDimensions.primitivesLayoutSpacing100
                    )
                ) {
                    POILogo(poi = poi)

                    travelTimeText?.let { text ->
                        Text(
                            text = text,
                            style = MaterialTheme.typography.bodyMedium,
                            // Nearby in the success emotion's Text role, which
                            // reads at 4.5:1 or more on the card in both
                            // themes; every other band, and the exact minutes,
                            // in the card's text colour. The word is Nearby,
                            // so the colour is never the only signal.
                            color = when (result.travelEstimate?.band?.tone) {
                                KozmosTravelTimeTone.Success -> KozmosThemeTokens.semanticsEmotionSuccessText
                                KozmosTravelTimeTone.Neutral, null -> KozmosThemeTokens.primitivesColorsForeground100
                            }
                        )
                    }
                }
            }

            if (visibleActions.isNotEmpty()) {
                Divider(color = KozmosThemeTokens.semanticsBorderSubtle)

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        // Its own node, read before the actions it names. Not
                        // merged, the name was added to the result's own:
                        // "Gate 12, Level 1, Actions for this result".
                        .semantics(mergeDescendants = true) { contentDescription = actionsLabel }
                        .padding(
                            horizontal = KozmosDimensions.primitivesLayoutSpacing200,
                            vertical = KozmosDimensions.primitivesLayoutSpacing100
                        ),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(
                        KozmosDimensions.primitivesLayoutSpacing100
                    )
                ) {
                    visibleActions.forEach { entry ->
                        // An action runs only when it is enabled and something
                        // handles it. Without onAction the card still draws
                        // what the product offers, but disabled — the rule
                        // POIDetailPanel's supplementary actions follow on the
                        // web and iOS — never an enabled button that does
                        // nothing. Checked in the handler too: the click
                        // Compose 1.6 puts in a disabled node's semantics
                        // still runs it.
                        val canRun = !entry.disabled && onAction != null
                        KozmosPOIResultActionButton(
                            entry = entry,
                            enabled = canRun,
                            onClick = {
                                if (canRun) {
                                    trackEvent(
                                        KozmosAnalyticsEvent(
                                            component = "POIResultCard",
                                            eventName = "poi_result_action",
                                            properties = mapOf(
                                                "poiId" to poi.id,
                                                "resultIndex" to result.resultIndex.toString(),
                                                "action" to entry.action.value
                                            )
                                        )
                                    )
                                    onAction?.invoke(entry.action, poi.id)
                                }
                            }
                        )
                    }
                }
            }

            if (!available && result.unavailableReason != null) {
                Divider(color = KozmosThemeTokens.semanticsBorderSubtle)

                Text(
                    text = result.unavailableReason,
                    style = MaterialTheme.typography.bodySmall,
                    color = KozmosThemeTokens.primitivesColorsForeground500,
                    modifier = Modifier.padding(
                        horizontal = KozmosDimensions.primitivesLayoutSpacing200,
                        vertical = KozmosDimensions.primitivesLayoutSpacing100
                    )
                )
            }
        }
    }
}

/**
 * [KozmosPOIResultCard] as 0.5.0 declared it: its parameters, in its order,
 * [onAction] last. A call that passes them by position still compiles, and so
 * does one that passes [onAction] as a trailing lambda: a parameter added
 * since, travelTimeBandLabels, sits before onAction so that the lambda stays
 * last, and this overload keeps the positional call. It draws the card the
 * full one does, with no words of its own for a walk shown as a band.
 */
@Composable
fun KozmosPOIResultCard(
    poi: KozmosPOIPresentation,
    result: KozmosPOIResultPresentation,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    featuredLabel: String = "Featured",
    currentFloorId: String? = null,
    selectionLabel: String? = null,
    actionsLabel: String = "Actions for this result",
    onAction: ((KozmosPOIResultAction, String) -> Unit)? = null
) {
    KozmosPOIResultCard(
        poi = poi,
        result = result,
        onSelect = onSelect,
        modifier = modifier,
        featuredLabel = featuredLabel,
        currentFloorId = currentFloorId,
        selectionLabel = selectionLabel,
        actionsLabel = actionsLabel,
        travelTimeBandLabels = emptyMap(),
        onAction = onAction
    )
}

/** The bands' words, and the only English the card holds for them. */
internal fun englishTravelTimeBandLabel(band: KozmosTravelTimeBand): String = when (band) {
    KozmosTravelTimeBand.Nearby -> "Nearby"
    KozmosTravelTimeBand.OneToTwoMinutes -> "1–2 min"
    KozmosTravelTimeBand.TwoToFiveMinutes -> "2–5 min"
    KozmosTravelTimeBand.FiveToTenMinutes -> "5–10 min"
    KozmosTravelTimeBand.MoreThanTenMinutes -> "More than 10 min"
}

/**
 * One action on a selected result.
 *
 * Its own composable so the card's body stays readable, and so the button's
 * own click target is unambiguous: the row above it is the select target, and
 * a nested clickable that shared its semantics would be unreachable to
 * TalkBack even while it drew on screen.
 */
@Composable
private fun KozmosPOIResultActionButton(
    entry: KozmosPOIResultActionPresentation,
    /** False for a disabled action, and for any action the card has no handler for. */
    enabled: Boolean,
    onClick: () -> Unit
) {
    val background = if (entry.primary) {
        KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
    } else {
        KozmosThemeTokens.primitivesColorsBackground0
    }
    val foreground = if (entry.primary) {
        KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
    } else {
        KozmosThemeTokens.primitivesColorsForeground0
    }

    Surface(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
        color = background,
        border = if (entry.primary) {
            null
        } else {
            BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle)
        }
    ) {
        Text(
            text = entry.label,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.SemiBold,
            color = foreground,
            modifier = Modifier.padding(
                horizontal = KozmosDimensions.primitivesLayoutSpacing200,
                vertical = KozmosDimensions.primitivesLayoutSpacing100
            )
        )
    }
}

@Composable
private fun POILogo(poi: KozmosPOIPresentation) {
    // The logo when there is one, 48 at radius Control; nothing otherwise.
    val logo = poi.logo ?: return
    AsyncImage(
        model = logo.src,
        contentDescription = logo.alt,
        contentScale = ContentScale.Fit,
        modifier = Modifier
            .size(KozmosDimensions.primitivesLayoutSizing600)
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
    )
}
