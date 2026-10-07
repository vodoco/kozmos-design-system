package com.kozmos.components.poidetailpanel

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.CollectionInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.collectionInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.kozmos.components.adaptivemapshell.LocalKozmosPanelSurface
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.components.icon.KozmosIconSize
import com.kozmos.components.icon.KozmosPointrIcons
import com.kozmos.components.icon.knownIconVector
import com.kozmos.components.surface.kozmosMutedForeground
import com.kozmos.contracts.KozmosPOIDetailAttributeGroup
import com.kozmos.contracts.KozmosPOIDetailDescription
import com.kozmos.contracts.KozmosPOIDetailSummary
import com.kozmos.contracts.KozmosPOIDetailSummaryKind
import com.kozmos.contracts.KozmosPOIDetailTone
import com.kozmos.contracts.KozmosPOIDetailsPresentation
import com.kozmos.contracts.KozmosPOIOpeningHoursPresentation
import com.kozmos.contracts.KozmosPOIServicePresentation
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import java.net.URI

/*
 * The details card's optional content (KozmosPOIDetailsPresentation): its
 * summary row, its sections of chips, its opening hours, its description and
 * its tags. iOS's POIDetailContent.swift and the web's POIDetailContent.tsx
 * draw the same, in the same order.
 */

/**
 * A remote icon's address, or null where the card must not load it: only
 * HTTPS with a host and no credentials, as iOS's `POIDetailIcon.remoteURL`
 * allows. The web also takes a root-relative path, which means nothing to an
 * app. A rejected address leaves the label, which never depended on it.
 */
internal fun poiDetailIconUrl(raw: String?): String? {
    if (raw.isNullOrBlank()) return null
    val uri = runCatching { URI(raw) }.getOrNull() ?: return null
    val https = uri.scheme.equals("https", ignoreCase = true)
    return if (https && !uri.host.isNullOrEmpty() && uri.rawUserInfo == null) raw else null
}

/**
 * The glyph a summary fact's kind draws: the Pointr artwork the web's
 * `summaryIcons` draws (POIDetailContent.tsx), Star01 for a rating, the
 * accessibility mark, Feather for dietary and ClockPlus for the crowd. A
 * price and a property draw none. None is mirrored: a right-to-left layout
 * turns no wheelchair round.
 */
internal fun summaryIcon(kind: KozmosPOIDetailSummaryKind): ImageVector? = when (kind) {
    KozmosPOIDetailSummaryKind.Rating -> KozmosPointrIcons.Star01
    KozmosPOIDetailSummaryKind.Accessibility -> KozmosPointrIcons.Accessibility
    KozmosPOIDetailSummaryKind.Dietary -> KozmosPointrIcons.Feather
    KozmosPOIDetailSummaryKind.Crowd -> KozmosPointrIcons.ClockPlus
    KozmosPOIDetailSummaryKind.Price, KozmosPOIDetailSummaryKind.Property -> null
}

/**
 * A fact's colour by its tone, as text on the card's white or the sheet's
 * grey in either theme: the emotion's text role, which reads at 4.5:1 on
 * every neutral surface, and the theme's 600 for brand — the roles the web's
 * summary names (`text-success-text`, `text-warning-text`,
 * `text-destructive-text`, `text-primary`), and iOS's
 * `POIDetailSummary.color(_:)` gives. A fill colour is one step too light:
 * the alert fill read at 1.6:1 on the sheet, and the theme's 500 at 3.7:1 on
 * black.
 */
@Composable
private fun toneColor(tone: KozmosPOIDetailTone?): Color = when (tone) {
    KozmosPOIDetailTone.Success -> KozmosThemeTokens.semanticsEmotionSuccessText
    KozmosPOIDetailTone.Warning -> KozmosThemeTokens.semanticsEmotionAlertText
    KozmosPOIDetailTone.Danger -> KozmosThemeTokens.semanticsEmotionDangerText
    KozmosPOIDetailTone.Brand -> KozmosThemeTokens.primitivesColorsTheme600
    KozmosPOIDetailTone.Neutral, null -> KozmosThemeTokens.primitivesColorsForeground100
}

/**
 * A decorative icon beside a label: a safe remote asset if there is one,
 * else the glyph [fallback] gives, else nothing. Nothing is invented for a
 * text-only value, and an asset that fails to load leaves no gap. TalkBack
 * never hears it: the label says what it means.
 */
@Composable
private fun POIDetailIcon(url: String?, monochrome: Boolean, size: Dp, tint: Color, fallback: ImageVector?) {
    val safe = poiDetailIconUrl(url)
    var failed by remember(safe) { mutableStateOf(false) }
    if (safe != null && !failed) {
        AsyncImage(
            model = safe,
            contentDescription = null,
            colorFilter = if (monochrome) ColorFilter.tint(tint) else null,
            onError = { failed = true },
            modifier = Modifier.size(size)
        )
    } else if (fallback != null) {
        Icon(imageVector = fallback, contentDescription = null, tint = tint, modifier = Modifier.size(size))
    }
}

/**
 * The summary row: at most three facts, in equal columns that share the
 * tallest one's height, never scrolling and never wrapping onto a second
 * row, as iOS's `POISummaryLayout` and the web's grid lay them out. Each fact
 * is one stop for TalkBack, its label, value and detail in that order; the
 * label is not drawn, and a price's "$" marks are never read.
 *
 * It paints the card's fill on its own, and none in the map shell's panel
 * (decision 43), as the web does.
 */
@Composable
internal fun POIDetailSummaryRow(items: List<KozmosPOIDetailSummary>, modifier: Modifier = Modifier) {
    if (items.isEmpty()) return
    val border = KozmosThemeTokens.semanticsBorderSubtle
    val fill = if (LocalKozmosPanelSurface.current == null) {
        Modifier.background(KozmosThemeTokens.primitivesColorsBackground0)
    } else {
        Modifier
    }
    Column(modifier = modifier.then(fill)) {
        Divider(color = border)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = KozmosDimensions.primitivesLayoutSizing800)
                .height(IntrinsicSize.Min)
        ) {
            items.forEachIndexed { index, item ->
                if (index > 0) {
                    Box(
                        Modifier
                            .fillMaxHeight()
                            .width(1.dp)
                            .background(border)
                    )
                }
                SummaryFact(item, Modifier.weight(1f).fillMaxHeight())
            }
        }
        Divider(color = border)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SummaryFact(item: KozmosPOIDetailSummary, modifier: Modifier) {
    val muted = kozmosMutedForeground()
    val color = toneColor(item.tone)
    val spoken = listOfNotNull(item.label, item.value, item.detail).filter { it.isNotEmpty() }.joinToString(", ")
    Box(
        // The whole column is the one stop, its padding included.
        modifier = modifier
            .clearAndSetSemantics { contentDescription = spoken }
            .padding(
                horizontal = KozmosDimensions.primitivesLayoutSpacing100,
                vertical = KozmosDimensions.primitivesLayoutSpacing150
            ),
        contentAlignment = Alignment.Center
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75),
            verticalAlignment = Alignment.CenterVertically
        ) {
            POIDetailIcon(
                url = item.iconUrl,
                monochrome = item.iconMonochrome,
                size = KozmosIconSize.Md.dp,
                tint = color,
                fallback = summaryIcon(item.kind)
            )
            // The value and its detail on one line where they fit, the detail
            // under the value where they do not, as iOS's ViewThatFits and
            // the web's wrapping row choose.
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75),
                verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing25)
            ) {
                val price = item.priceLevel
                if (price != null && price in 1..4) {
                    Text(
                        text = buildAnnotatedString {
                            withStyle(SpanStyle(color = KozmosThemeTokens.primitivesColorsForeground100)) { append("$".repeat(price)) }
                            withStyle(SpanStyle(color = muted)) { append("$".repeat(4 - price)) }
                        },
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.SemiBold
                    )
                } else {
                    Text(text = item.value, style = MaterialTheme.typography.bodyMedium, color = color)
                }
                item.detail?.let { detail ->
                    Text(
                        text = detail,
                        style = MaterialTheme.typography.bodySmall,
                        color = muted,
                        modifier = Modifier.align(Alignment.CenterVertically)
                    )
                }
            }
        }
    }
}

/**
 * A section's heading, as iOS and the web draw one: small, regular and
 * muted, and a heading to TalkBack. The muted colour turns full ink on glass
 * (decision 48).
 */
@Composable
private fun SectionHeading(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.bodyMedium,
        color = kozmosMutedForeground(),
        modifier = Modifier.semantics { heading() }
    )
}

/**
 * A section TalkBack reads as one group: named by [label], walked as one
 * stretch, its heading first.
 */
@Composable
private fun Section(label: String, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .semantics {
                contentDescription = label
                isTraversalGroup = true
            },
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
    ) {
        content()
    }
}

/** A heading and its chips: the POI's services, or one of [KozmosPOIDetailsPresentation.groups]. */
@Composable
internal fun POIDetailSection(heading: String, items: List<KozmosPOIServicePresentation>) {
    Section(label = heading) {
        SectionHeading(heading)
        POIDetailChips(items)
    }
}

/**
 * Information chips: a list that wraps, never a row of buttons. Each chip is
 * one stop for TalkBack, read by its label, with the list's size said on the
 * way in, as the web's `<ul>` is. An icon the registry does not know draws
 * nothing rather than a stand-in, as on the web.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun POIDetailChips(items: List<KozmosPOIServicePresentation>, modifier: Modifier = Modifier) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val ink = KozmosThemeTokens.primitivesColorsForeground100
    FlowRow(
        modifier = modifier
            .fillMaxWidth()
            .semantics { collectionInfo = CollectionInfo(rowCount = items.size, columnCount = 1) },
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
    ) {
        items.forEach { item ->
            Row(
                modifier = Modifier
                    .heightIn(min = KozmosDimensions.primitivesLayoutSizing400)
                    .border(1.dp, KozmosThemeTokens.semanticsBorderSubtle, shape)
                    .padding(
                        horizontal = KozmosDimensions.primitivesLayoutSpacing150,
                        vertical = KozmosDimensions.primitivesLayoutSpacing75
                    )
                    .semantics(mergeDescendants = true) {},
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50),
                verticalAlignment = Alignment.CenterVertically
            ) {
                POIDetailIcon(
                    url = item.iconUrl,
                    monochrome = item.iconMonochrome,
                    size = KozmosIconSize.Sm.dp,
                    tint = ink,
                    fallback = item.iconName?.let(::knownIconVector)
                )
                Text(text = item.label, style = MaterialTheme.typography.bodyMedium, color = ink)
            }
        }
    }
}

/**
 * What [KozmosPOIDetailsPresentation] adds under the POI's services, in
 * iOS's and the web's order: its groups, its opening hours, its description
 * and its tags. Each is a child of the card's body, so the body's spacing
 * falls between them. A different place ([poiId]) starts with its hours and
 * its description closed.
 */
@Composable
internal fun POIDetailSections(
    details: KozmosPOIDetailsPresentation,
    poiId: String,
    readMoreLabel: String,
    readLessLabel: String,
    tagsLabel: String
) {
    details.groups.filter { it.items.isNotEmpty() }.forEach { group: KozmosPOIDetailAttributeGroup ->
        POIDetailSection(heading = group.heading, items = group.items)
    }
    details.openingHours?.let { hours -> OpeningHours(hours, poiId) }
    details.description?.let { description -> Description(description, poiId, readMoreLabel, readLessLabel) }
    if (details.tags.isNotEmpty()) {
        // No heading of its own: the list is named by tagsLabel, as iOS's
        // container and the web's list are.
        POIDetailChips(
            items = details.tags,
            modifier = Modifier.semantics {
                contentDescription = tagsLabel
                isTraversalGroup = true
            }
        )
    }
}

/**
 * The opening hours, as the web draws them: the label as the section's
 * heading, then the summary as a disclosure that opens onto the rows and the
 * note. TalkBack hears the summary as a button, collapsed or expanded. With
 * no rows there is nothing to open, and the summary and the note are one line.
 */
@Composable
private fun OpeningHours(hours: KozmosPOIOpeningHoursPresentation, poiId: String) {
    val ink = KozmosThemeTokens.primitivesColorsForeground100
    val body = MaterialTheme.typography.bodyMedium
    Section(label = hours.label) {
        SectionHeading(hours.label)
        if (hours.rows.isEmpty()) {
            Text(
                text = listOfNotNull(hours.summary, hours.note).joinToString(" — "),
                style = body,
                color = ink
            )
        } else {
            HoursDisclosure(hours, poiId)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun HoursDisclosure(hours: KozmosPOIOpeningHoursPresentation, poiId: String) {
    val ink = KozmosThemeTokens.primitivesColorsForeground100
    val body = MaterialTheme.typography.bodyMedium
    var expanded by remember(poiId) { mutableStateOf(false) }
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .border(1.dp, KozmosThemeTokens.semanticsBorderSubtle, shape)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = KozmosDimensions.primitivesLayoutSizing600)
                .clickable(role = Role.Button) { expanded = !expanded }
                .semantics {
                    if (expanded) {
                        collapse { expanded = false; true }
                    } else {
                        expand { expanded = true; true }
                    }
                }
                .padding(KozmosDimensions.primitivesLayoutSpacing150),
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = hours.summary, style = body, color = ink, modifier = Modifier.weight(1f))
            Icon(
                imageVector = Icons.Default.KeyboardArrowDown,
                contentDescription = null,
                tint = ink,
                modifier = Modifier
                    .size(KozmosIconSize.Md.dp)
                    .rotate(if (expanded) 180f else 0f)
            )
        }
        if (expanded) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(
                        start = KozmosDimensions.primitivesLayoutSpacing150,
                        end = KozmosDimensions.primitivesLayoutSpacing150,
                        bottom = KozmosDimensions.primitivesLayoutSpacing150
                    ),
                verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
            ) {
                hours.rows.forEach { row ->
                    // The day and its hours on one line, apart, where they
                    // fit, and the hours under the day where they do not;
                    // one stop for TalkBack.
                    FlowRow(
                        modifier = Modifier
                            .fillMaxWidth()
                            .semantics(mergeDescendants = true) {},
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = row.day, style = body, color = ink)
                        Text(text = row.hours, style = body, color = ink)
                    }
                }
                hours.note?.let { note ->
                    Text(text = note, style = body, color = kozmosMutedForeground())
                }
            }
        }
    }
}

/**
 * The description's preview, and Read more where there is more: a button
 * TalkBack hears as collapsed, then, saying Read less, as expanded, as the
 * web's `aria-expanded` says. With no full text, or the same text, nothing
 * opens.
 */
@Composable
private fun Description(
    description: KozmosPOIDetailDescription,
    poiId: String,
    readMoreLabel: String,
    readLessLabel: String
) {
    if (description.preview.isEmpty()) return
    val full = description.full
    val hasMore = !full.isNullOrEmpty() && full != description.preview
    var expanded by remember(poiId) { mutableStateOf(false) }
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
    ) {
        Text(
            text = if (expanded && hasMore) full.orEmpty() else description.preview,
            style = MaterialTheme.typography.bodyMedium,
            color = KozmosThemeTokens.primitivesColorsForeground100
        )
        if (hasMore) {
            KozmosButton(
                onClick = { expanded = !expanded },
                modifier = Modifier.semantics {
                    if (expanded) {
                        collapse { expanded = false; true }
                    } else {
                        expand { expanded = true; true }
                    }
                },
                variant = KozmosButtonVariant.Link
            ) {
                Text(if (expanded) readLessLabel else readMoreLabel)
            }
        }
    }
}
