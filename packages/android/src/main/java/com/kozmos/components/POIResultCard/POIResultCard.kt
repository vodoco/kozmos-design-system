package com.kozmos.components.poiresultcard

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
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
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
 * Actions without a handler are disabled. Pressing an action never selects the row.
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
    /**
     * Draw the result's number, `result.resultIndex`, in its tab: the number
     * its pin shows on the map. Off unless the product turns it on, for a list
     * whose pins are numbered, as quick access's are. The card draws the number
     * it is given and never renumbers. A featured result keeps its Featured tab
     * and shows no number, as its pin shows its logo; a number takes the place
     * of a badge. The number leads what TalkBack says ("2, Burger King"); a
     * [selectionLabel] replaces all of it.
     */
    numbered: Boolean = false,
    onAction: ((KozmosPOIResultAction, String) -> Unit)? = null
) {
    val trackEvent = LocalKozmosAnalytics.current
    val available = result.isAvailable
    val tab = kozmosPOIResultTab(result, numbered, featuredLabel)
    val numberText = (tab as? KozmosPOIResultTab.Number)?.number
    // The tab and the name's clearance grow with the reader's font size.
    val tabHeight = with(LocalDensity.current) { 16.sp.toDp() }

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
        // The number leads the name, "2, Burger King": the tab that draws it
        // is left out of what TalkBack reads, so it is heard once.
        numberText,
        poi.name,
        poi.categoryLabel,
        poi.locationLabel,
        poi.availabilityLabel,
        travelTimeText,
        if (available) null else result.unavailableReason
    ).joinToString(", ")

    Surface(
        onClick = {
            // Disabled semantics actions must remain inert when invoked directly.
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
            color = kozmosPOIResultCardEdge(selected = result.selected, featured = tab is KozmosPOIResultTab.Featured)
        )
    ) {
        Box {
            Column(modifier = Modifier.fillMaxWidth()) {
                // 80 tall: the prototype's row.
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .defaultMinSize(minHeight = KozmosDimensions.primitivesLayoutSizing1000)
                        .padding(
                            start = KozmosDimensions.primitivesLayoutSpacing200,
                            end = KozmosDimensions.primitivesLayoutSpacing200,
                            top = if (tab != null) tabHeight + KozmosDimensions.primitivesLayoutSpacing100 else KozmosDimensions.primitivesLayoutSpacing150,
                            bottom = KozmosDimensions.primitivesLayoutSpacing150
                        ),
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
            if (tab != null) {
                KozmosPOIResultTabView(tab = tab, selected = result.selected, modifier = Modifier.align(Alignment.TopStart))
            }
        }
    }
}

/**
 * The card's one tab. What it says decides how it looks: Featured is the
 * CMS's word and the map acts on it too (its pin draws the logo), so it wins;
 * then the number, which pairs the result with its pin; then the badge, which
 * only says why the result is in the list.
 */
internal sealed class KozmosPOIResultTab {
    abstract val words: String

    data class Featured(override val words: String) : KozmosPOIResultTab()
    data class Number(val number: String) : KozmosPOIResultTab() {
        override val words: String get() = number
    }
    data class Badge(override val words: String) : KozmosPOIResultTab()
}

internal fun kozmosPOIResultTab(
    result: KozmosPOIResultPresentation,
    numbered: Boolean,
    featuredLabel: String
): KozmosPOIResultTab? = when {
    result.featured -> KozmosPOIResultTab.Featured(featuredLabel)
    numbered -> KozmosPOIResultTab.Number(result.resultIndex.toString())
    result.badge != null -> KozmosPOIResultTab.Badge(result.badge.label)
    else -> null
}

/** A tab's fill, words and edge. */
internal data class KozmosPOIResultTabPaint(val fill: Color, val ink: Color, val edge: Color?)

/**
 * The card's edge. Selected, the theme colour, whatever else the card is: the
 * web says selection with a ring beside the edge, and a native card has only
 * its edge to say it with. Otherwise a featured card takes its tab's amber
 * (Olcay, 2026-09-29), and every other card the container edge: a number and a
 * badge never recolour it.
 */
@Composable
internal fun kozmosPOIResultCardEdge(selected: Boolean, featured: Boolean): Color = when {
    selected -> KozmosThemeTokens.primitivesColorsTheme500
    featured -> KozmosThemeTokens.semanticsEmotionAlertFill
    else -> KozmosThemeTokens.semanticsBorderSubtle
}

/**
 * GAP-054. Featured is the SDK's bright amber under dark words, the alert fill
 * pair, for its words and its star (Olcay, 2026-09-29). A number is quiet at
 * rest, the card's own fill outlined in the container edge with muted words,
 * and filled with the primary colour when the result is selected, as the
 * selected card's edge is. A badge is quiet: the muted fill and muted words,
 * with no star. Each pair reads at 4.5:1 or more in both themes, as on the web.
 */
@Composable
internal fun kozmosPOIResultTabPaint(tab: KozmosPOIResultTab, selected: Boolean): KozmosPOIResultTabPaint =
    when (tab) {
        is KozmosPOIResultTab.Featured -> KozmosPOIResultTabPaint(
            fill = KozmosThemeTokens.semanticsEmotionAlertFill,
            ink = KozmosThemeTokens.semanticsEmotionAlertOnfill,
            edge = null
        )
        is KozmosPOIResultTab.Number -> if (selected) {
            KozmosPOIResultTabPaint(
                fill = KozmosThemeTokens.primitivesColorsTheme600,
                ink = KozmosThemeTokens.primitivesColorsForeground1000,
                edge = null
            )
        } else {
            KozmosPOIResultTabPaint(
                fill = KozmosThemeTokens.primitivesColorsBackground0,
                ink = KozmosThemeTokens.primitivesColorsForeground400,
                edge = KozmosThemeTokens.semanticsBorderSubtle
            )
        }
        is KozmosPOIResultTab.Badge -> KozmosPOIResultTabPaint(
            fill = KozmosThemeTokens.primitivesColorsBackground100,
            ink = KozmosThemeTokens.primitivesColorsForeground400,
            edge = null
        )
    }

/**
 * The one tab, inside the card's top-start corner. The parent supplies its
 * outer curve and top/start outline; only the inner bottom-end corner rounds.
 * Featured and a badge are read as
 * their words, as they always were; a number is left out of what TalkBack
 * reads, because it leads the result's own description.
 */
@Composable
private fun KozmosPOIResultTabView(tab: KozmosPOIResultTab, selected: Boolean, modifier: Modifier = Modifier) {
    val paint = kozmosPOIResultTabPaint(tab, selected)
    val innerRadius = KozmosDimensions.primitivesLayoutSpacing100 - 1.dp
    val shape = RoundedCornerShape(bottomEnd = innerRadius)
    val tabHeight = with(LocalDensity.current) { 16.sp.toDp() }
    Row(
        modifier = modifier
            .then(if (tab is KozmosPOIResultTab.Number) Modifier.clearAndSetSemantics { } else Modifier)
            .clip(shape)
            .background(paint.fill)
            .drawWithContent {
                drawContent()
                // A quiet number needs only the bottom/end outline. Drawing a
                // whole rounded border would duplicate the card's own edge.
                paint.edge?.let { edge ->
                    val stroke = 1.dp.toPx()
                    val half = stroke / 2
                    val radius = (innerRadius.toPx() - half).coerceAtLeast(0f)
                    val end = size.width - half
                    val bottom = size.height - half
                    val path = Path().apply {
                        moveTo(end, 0f)
                        lineTo(end, bottom - radius)
                        arcTo(Rect(end - 2 * radius, bottom - 2 * radius, end, bottom), 0f, 90f, false)
                        lineTo(0f, bottom)
                    }
                    val rightToLeft = layoutDirection == LayoutDirection.Rtl
                    withTransform({ if (rightToLeft) scale(-1f, 1f) }) {
                        drawPath(path, edge, style = Stroke(stroke))
                    }
                }
            }
            .heightIn(min = tabHeight)
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing75),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
    ) {
        if (tab is KozmosPOIResultTab.Featured) {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                tint = paint.ink,
                modifier = Modifier.size(10.dp)
            )
        }
        Text(
            text = tab.words,
            style = MaterialTheme.typography.labelSmall.copy(
                platformStyle = PlatformTextStyle(includeFontPadding = false),
                lineHeightStyle = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.None)
            ),
            fontSize = 11.sp,
            lineHeight = 14.sp,
            fontWeight = FontWeight.Normal,
            color = paint.ink,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
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
