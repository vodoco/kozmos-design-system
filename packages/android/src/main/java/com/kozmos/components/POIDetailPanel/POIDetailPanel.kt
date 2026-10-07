package com.kozmos.components.poidetailpanel

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import com.kozmos.components.icon.KozmosIcon
import com.kozmos.components.icon.KozmosIconSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.SubcomposeAsyncImage
import com.kozmos.components.adaptivemapshell.LocalKozmosPanelClearanceTop
import com.kozmos.components.adaptivemapshell.LocalKozmosPanelInsetTop
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonEmotion
import com.kozmos.components.button.KozmosButtonSize
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.components.poimediagallery.KozmosPOIMediaGallery
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.LocalKozmosSurfaceStyle
import com.kozmos.components.surface.kozmosMutedForeground
import com.kozmos.contracts.KozmosPOIAccessRestrictions
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIAvailability
import com.kozmos.contracts.KozmosPOIDetailsPresentation
import com.kozmos.contracts.KozmosPOILogoPresentation
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOISupplementaryAction
import com.kozmos.contracts.KozmosTravelEstimatePresentation
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import kotlin.math.ceil
import kotlin.math.sqrt

/** Controlled state for a single POI action button. */
data class KozmosPOIActionState(
    val disabled: Boolean = false,
    val loading: Boolean = false,
    val pressed: Boolean = false,
    val message: String? = null,
    val messageTone: MessageTone = MessageTone.Status
) {
    enum class MessageTone {
        Status,
        Error
    }
}

enum class KozmosPOIDetailPanelPresentation {
    Inline,
    Sheet,
    Panel
}

/**
 * Full POI detail surface with media, actions, restrictions, and services.
 *
 * Mirrors the React `POIDetailPanel`. Only the actions listed by
 * [KozmosPOIPresentation.actions] are rendered, and every label is supplied
 * already localized.
 *
 * Favourite and bookmark are icon toggles in the header, before the close
 * button, as on iOS and the web. All three are drawn alike, 44dp squares 6dp
 * apart, outlined in the neutral emotion; a pressed toggle is filled with the
 * theme, and TalkBack hears it as selected. Each toggle is named by its
 * [actionLabels] entry. The other actions are labelled buttons in one strip
 * under the header that scrolls sideways, as on iOS and the web: it never
 * wraps, whatever the number of actions or the length of their words.
 *
 * A supplied logo shows its artwork once loaded, and the name's initial while
 * it loads or if it fails to, as on iOS; with no logo the header draws none,
 * as on iOS and the web, and the name starts at its edge.
 *
 * In its sheet presentation, which paints no surface of its own, the card is
 * the top of the map shell's panel: its header tops its top padding up to what
 * the panel already leaves above it ([LocalKozmosPanelInsetTop]) rather than
 * adding to it, so its close button sits as far from the panel's top as from
 * its side (GAP-083), 16 and 16 under a handle. Where its buttons would then
 * meet the handle's target — three of them on a card under 338dp wide — it
 * keeps the handle's clearance ([LocalKozmosPanelClearanceTop]) too, 20 and
 * 16 (decision 51, [sheetHeaderTop]). The panel and inline presentations draw
 * their own bordered card and keep their padding inside it.
 *
 * The web component's `titleLevel` prop has no counterpart here: Compose
 * semantics expose `heading()` as a boolean with no rank, so TalkBack cannot
 * distinguish an h2 from an h3. SwiftUI does support ranks and mirrors the prop
 * as `KozmosPOIDetailPanel.TitleLevel`.
 *
 * [details] adds what the web's `details` and SwiftUI's `details:` add, in
 * their order: the travel estimate on Go; the supplementary actions, book and
 * call, after the POI's own in the strip, and their messages after its own;
 * the summary row under the strip, at most three facts; then, after the
 * services, the attribute groups, the opening hours, the description with
 * Read more, and the tags. Every heading is a heading to TalkBack, each
 * section is read as one group, Read more and the opening hours say whether
 * they are expanded, and a different place starts with both closed. A
 * supplementary action reaches [onSupplementaryAction] with its action and
 * the POI's ID; with no callback it is drawn disabled, as on iOS and the web.
 * Its state in [supplementaryActionStates] works as [actionStates] does: a
 * disabled or loading action cannot be pressed, a loading one says
 * [loadingLabel], and a pressed one is filled and selected. The new
 * parameters follow the released ones, so a call written against 0.5.0
 * compiles and binds as it did.
 */
@Composable
fun KozmosPOIDetailPanel(
    poi: KozmosPOIPresentation,
    actionLabels: Map<KozmosPOIAction, String>,
    onAction: (KozmosPOIAction, String) -> Unit,
    modifier: Modifier = Modifier,
    actionStates: Map<KozmosPOIAction, KozmosPOIActionState> = emptyMap(),
    onClose: (() -> Unit)? = null,
    closeLabel: String = "Close details",
    mediaLabel: String? = null,
    mediaPositionLabel: (Int, Int) -> String = { current, total -> "Image $current of $total" },
    accessRestrictionsHeading: String = "Access restrictions",
    servicesHeading: String = "Service options",
    presentation: KozmosPOIDetailPanelPresentation = KozmosPOIDetailPanelPresentation.Inline,
    details: KozmosPOIDetailsPresentation = KozmosPOIDetailsPresentation(),
    supplementaryActionStates: Map<KozmosPOISupplementaryAction, KozmosPOIActionState> = emptyMap(),
    onSupplementaryAction: ((KozmosPOISupplementaryAction, String) -> Unit)? = null,
    readMoreLabel: String = "Read more",
    readLessLabel: String = "Read less",
    tagsLabel: String = "Tags",
    loadingLabel: String = "Loading"
) {
    val radius = KozmosDimensions.semanticsRadiusPanel
    // An inset block's surface: the muted grey on the panel's own white, and
    // white on a sheet, whose surface is that grey.
    val insetSurface = if (presentation == KozmosPOIDetailPanelPresentation.Sheet) KozmosThemeTokens.primitivesColorsBackground0 else KozmosThemeTokens.primitivesColorsBackground100
    val shape = if (presentation == KozmosPOIDetailPanelPresentation.Sheet) {
        RoundedCornerShape(topStart = radius, topEnd = radius)
    } else {
        RoundedCornerShape(radius)
    }

    // What the shell's panel leaves above the card, and the clearance it asks
    // for below that (GAP-083): read here, for the header's top padding,
    // which also needs the card's width (sheetHeaderTop).
    val panelInsetTop = LocalKozmosPanelInsetTop.current
    val panelClearanceTop = LocalKozmosPanelClearanceTop.current

    // The surface the card's text sits on: in the sheet presentation the one
    // under the card, the panel's, and in the others the card's own, a
    // solid one (decision 48).
    val textSurface = if (presentation == KozmosPOIDetailPanelPresentation.Sheet) LocalKozmosSurfaceStyle.current else KozmosSurfaceStyle.Solid

    val showsAccessRestrictions = poi.accessRestrictions != null &&
        poi.accessRestrictions != KozmosPOIAccessRestrictions.None &&
        poi.accessRestrictionsLabel != null

    // Favourite and bookmark are the header's toggles; the row under it
    // keeps the rest, each in the order the POI lists them.
    val headerToggles = poi.actions.filter { it in HeaderToggleActions }
    val rowActions = poi.actions.filterNot { it in HeaderToggleActions }
    val supplementaryActions = details.supplementaryActions

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .semantics { contentDescription = poi.name },
        shape = shape,
        // In a sheet the panel paints no surface of its own: it sits on the
        // sheet's, as the browse panel does, with no border and no shadow.
        color = if (presentation == KozmosPOIDetailPanelPresentation.Sheet) Color.Transparent else KozmosThemeTokens.primitivesColorsBackground0,
        border = if (presentation == KozmosPOIDetailPanelPresentation.Sheet) {
            null
        } else {
            BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle)
        },
        shadowElevation = when (presentation) {
            KozmosPOIDetailPanelPresentation.Panel -> 16.dp
            KozmosPOIDetailPanelPresentation.Sheet -> 0.dp
            else -> 8.dp
        }
    ) {
        // What the card holds is on the panel's surface in the sheet
        // presentation, and on the card's own in the others: its muted text
        // takes the foreground colour only on glass (decision 48).
        CompositionLocalProvider(LocalKozmosSurfaceStyle provides textSurface) {
        // The body scrolls under a pinned header, which requires a bounded
        // height. When the caller nests the panel somewhere unbounded (another
        // scroll container, wrapContentSize) Compose would throw, so fall back
        // to growing naturally — the same way the web panel behaves.
        BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
        val bodyScrolls = constraints.hasBoundedHeight
        val bodyScrollState = rememberScrollState()
        // The panel and inline presentations draw their own bordered card,
        // and the space the panel leaves lies outside the border: they keep
        // their 16 inside it, or the header meets the card's own top edge.
        val headerTop = if (presentation == KozmosPOIDetailPanelPresentation.Sheet) {
            sheetHeaderTop(
                inset = panelInsetTop,
                clearance = panelClearanceTop,
                cardWidth = maxWidth,
                buttons = headerToggles.size + if (onClose != null) 1 else 0
            )
        } else {
            KozmosDimensions.primitivesLayoutSpacing200
        }

        Column(modifier = Modifier.fillMaxWidth()) {
            Header(
                poi = poi,
                toggles = headerToggles,
                actionLabels = actionLabels,
                actionStates = actionStates,
                onAction = onAction,
                onClose = onClose,
                closeLabel = closeLabel,
                surface = insetSurface,
                top = headerTop
            )

            Divider(color = KozmosThemeTokens.semanticsBorderSubtle)

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .then(
                        if (bodyScrolls) {
                            Modifier
                                .weight(1f, fill = false)
                                .verticalScroll(bodyScrollState)
                        } else {
                            Modifier
                        }
                    )
                    .padding(KozmosDimensions.primitivesLayoutSpacing200),
                verticalArrangement = Arrangement.spacedBy(
                    KozmosDimensions.primitivesLayoutSpacing200
                )
            ) {
                poi.description?.let { description ->
                    Text(
                        text = description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = kozmosMutedForeground()
                    )
                }

                if (rowActions.isNotEmpty() || supplementaryActions.isNotEmpty()) {
                    // One strip that scrolls sideways, as on iOS and the web,
                    // however many actions and however long their words: a
                    // FlowRow wrapped them onto a second row and grew the
                    // card. It runs the card's whole width, under the body's
                    // padding, and scrolls its buttons in from that padding,
                    // as iOS's and the web's do. Each button keeps its own
                    // width and its 44dp.
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .bleedHorizontally(KozmosDimensions.primitivesLayoutSpacing200)
                            // A new place's strip starts at its first action,
                            // as iOS's and the web's do.
                            .horizontalScroll(remember(poi.id) { ScrollState(0) })
                            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing200),
                        horizontalArrangement = Arrangement.spacedBy(
                            KozmosDimensions.primitivesLayoutSpacing100
                        ),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        rowActions.forEach { action ->
                            val navigate = action == KozmosPOIAction.Navigate
                            StripButton(
                                label = actionLabels[action] ?: action.value,
                                onClick = { onAction(action, poi.id) },
                                state = actionStates[action],
                                loadingLabel = loadingLabel,
                                primary = navigate,
                                estimate = if (navigate) details.travelEstimate else null
                            )
                        }
                        // After the POI's own, as on iOS and the web; with no
                        // callback there is nothing to do, so they are drawn
                        // disabled rather than pretend to book.
                        supplementaryActions.forEach { item ->
                            StripButton(
                                label = item.label,
                                onClick = { onSupplementaryAction?.invoke(item.action, poi.id) },
                                state = supplementaryActionStates[item.action],
                                loadingLabel = loadingLabel,
                                available = onSupplementaryAction != null
                            )
                        }
                    }
                }

                // The POI's own actions' messages, then the supplementary
                // ones', as on iOS and the web.
                poi.actions.forEach { action ->
                    actionStates[action]?.let { ActionMessage(state = it, surface = insetSurface) }
                }
                supplementaryActions.forEach { item ->
                    supplementaryActionStates[item.action]?.let { ActionMessage(state = it, surface = insetSurface) }
                }

                // Under the strip, the card's whole width, as iOS's and the
                // web's are: it reaches into the body's padding to the card's
                // edges.
                POIDetailSummaryRow(
                    items = details.visibleSummary,
                    modifier = Modifier
                        .fillMaxWidth()
                        .bleedHorizontally(KozmosDimensions.primitivesLayoutSpacing200)
                )

                if (showsAccessRestrictions) {
                    val accessRestrictionsLabel = poi.accessRestrictionsLabel.orEmpty()
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .semantics {
                                contentDescription =
                                    "$accessRestrictionsHeading, $accessRestrictionsLabel"
                            },
                        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
                        color = if (presentation == KozmosPOIDetailPanelPresentation.Sheet) insetSurface else insetSurface.copy(alpha = 0.4f),
                        border = BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle)
                    ) {
                        Text(
                            text = accessRestrictionsLabel,
                            style = MaterialTheme.typography.bodyMedium,
                            color = KozmosThemeTokens.primitivesColorsForeground100,
                            modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing150)
                        )
                    }
                }

                KozmosPOIMediaGallery(
                    media = poi.media,
                    label = mediaLabel ?: "${poi.name} photos",
                    positionLabel = mediaPositionLabel
                )

                val services = poi.services
                if (!services.isNullOrEmpty()) {
                    POIDetailSection(heading = servicesHeading, items = services)
                }

                POIDetailSections(
                    details = details,
                    poiId = poi.id,
                    readMoreLabel = readMoreLabel,
                    readLessLabel = readLessLabel,
                    tagsLabel = tagsLabel
                )
            }
        }
        }
        }
    }
}

/**
 * Lays the content out [amount] wider on each side than it is given, reaching
 * into its parent's padding, and reports the width it was given, so nothing
 * around it moves. The action strip runs under the body's padding this way,
 * to the card's edges, which clip it.
 */
private fun Modifier.bleedHorizontally(amount: Dp): Modifier = layout { measurable, constraints ->
    val bleed = amount.roundToPx()
    val placeable = measurable.measure(
        if (constraints.hasBoundedWidth) {
            constraints.copy(minWidth = constraints.minWidth + 2 * bleed, maxWidth = constraints.maxWidth + 2 * bleed)
        } else {
            constraints
        }
    )
    val width = if (constraints.hasBoundedWidth) placeable.width - 2 * bleed else placeable.width
    layout(width, placeable.height) {
        placeable.place(if (constraints.hasBoundedWidth) -bleed else 0, 0)
    }
}

/** The actions the header draws as icon toggles, beside close, as iOS and the web do. */
private val HeaderToggleActions = setOf(KozmosPOIAction.Favourite, KozmosPOIAction.Bookmark)

/** The header's buttons ([HeaderButton]): [KozmosButtonSize.Icon]'s 44dp squares, 6dp apart. */
private val HeaderButtonSize = 44.dp
private val HeaderButtonSpacing = KozmosDimensions.primitivesLayoutSpacing75

/**
 * The sheet presentation's header top padding, in a card [cardWidth] wide
 * whose header holds [buttons] buttons (GAP-083, decision 51).
 *
 * The card paints no surface of its own, so the space the shell's panel
 * leaves above it ([inset]) is the card's own top: the header tops its 16 up
 * to it rather than adding 16, and under a handle sits flush under the
 * handle's row — the close button as far from the sheet's top as from its
 * side, 16 and 16. It sat 32 and 16 (GAP-083), then 20 and 16.
 *
 * Unless its buttons would then meet the handle's target. The handle's row
 * is an undersized target, and WCAG 2.5.8 keeps a 24dp circle on its centre
 * clear of every other target: the shell's [clearance] is how far below the
 * row that circle reaches, so its radius is half the row and the clearance.
 * Flush, the buttons' top edge is half the row under the centre, and the
 * button nearest the middle must start √(12² − 8²) ≈ 8.9 past it, rounded up
 * to 9 as the web rounds it. Where it would not — three buttons, favourite,
 * save and close, on a card under 338 wide; two under 238; close alone under
 * 138 — the header keeps the clearance: 20 and 16, as every other part at
 * the panel's top does (decision 14). With no handle the clearance is 0, and
 * the header keeps its 16 under whatever is above it.
 */
internal fun sheetHeaderTop(inset: Dp, clearance: Dp, cardWidth: Dp, buttons: Int): Dp {
    val padding = KozmosDimensions.primitivesLayoutSpacing200
    val flush = maxOf(0.dp, padding - inset)
    if (clearance <= 0.dp || buttons == 0) return flush
    val radius = inset / 2 + clearance
    val depth = inset / 2 + flush
    if (depth >= radius) return flush
    val reach = ceil(sqrt(radius.value * radius.value - depth.value * depth.value)).dp
    val run = HeaderButtonSize * buttons + HeaderButtonSpacing * (buttons - 1)
    // From the card's middle, under the handle's centre, to the nearest
    // button's edge: the buttons stand at the header's end, 16 in.
    return if (cardWidth / 2 - padding - run >= reach) flush else maxOf(clearance, padding - inset)
}

// The outline glyphs, as the web's Heart and Bookmark and iOS's "heart" and
// "bookmark" are: a pressed toggle shows its state by its fill, not its glyph.
private fun actionIcon(action: KozmosPOIAction): ImageVector = when (action) {
    KozmosPOIAction.Favourite -> Icons.Default.FavoriteBorder
    KozmosPOIAction.Bookmark -> Icons.Default.BookmarkBorder
    else -> error("Only icon-only toggle actions belong in the header")
}

@Composable
private fun Header(
    poi: KozmosPOIPresentation,
    toggles: List<KozmosPOIAction>,
    actionLabels: Map<KozmosPOIAction, String>,
    actionStates: Map<KozmosPOIAction, KozmosPOIActionState>,
    onAction: (KozmosPOIAction, String) -> Unit,
    onClose: (() -> Unit)?,
    closeLabel: String,
    surface: Color = KozmosThemeTokens.primitivesColorsBackground100,
    top: Dp = KozmosDimensions.primitivesLayoutSpacing200
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(
                start = KozmosDimensions.primitivesLayoutSpacing200,
                top = top,
                end = KozmosDimensions.primitivesLayoutSpacing200,
                bottom = KozmosDimensions.primitivesLayoutSpacing200
            ),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
    ) {
        // The name and the header's buttons share one row whatever the name's
        // length: a long name wraps beside them, three lines at most, and
        // never pushes them under it.
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
        ) {
            // No logo, no box: the name starts at the header's edge, as on
            // iOS and the web.
            poi.logo?.let { logo ->
                POILogo(logo = logo, initial = poi.logoFallbackInitial, surface = surface)
            }

            Text(
                text = poi.name,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
                color = KozmosThemeTokens.primitivesColorsForeground100,
                // Three lines at most, beside the buttons, as on iOS and the web.
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier
                    .weight(1f)
                    .semantics { heading() }
            )

            if (toggles.isNotEmpty() || onClose != null) {
                // 6 apart, the web's 0.375rem and iOS's HStack spacing:
                // the toggles in the POI's order, then close.
                Row(horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)) {
                    toggles.forEach { action ->
                        val state = actionStates[action]
                        HeaderButton(
                            icon = actionIcon(action),
                            label = actionLabels[action] ?: action.value,
                            onClick = { onAction(action, poi.id) },
                            pressed = state?.pressed ?: false,
                            enabled = !(state?.disabled ?: false),
                            loading = state?.loading ?: false
                        )
                    }
                    if (onClose != null) {
                        HeaderButton(icon = Icons.Default.Close, label = closeLabel, onClick = onClose)
                    }
                }
            }
        }

        // Where it is, and whether it is open, under the name and the
        // buttons at the header's whole width, as on iOS and the web: beside
        // three buttons a location would be cut to a few letters.
        Column(verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(
                    KozmosDimensions.primitivesLayoutSpacing50
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Place,
                    contentDescription = null,
                    tint = kozmosMutedForeground(),
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = poi.locationLabel,
                    style = MaterialTheme.typography.bodyMedium,
                    color = kozmosMutedForeground(),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            poi.availabilityLabel?.let { availabilityLabel ->
                Text(
                    text = availabilityLabel,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = if (poi.availability == KozmosPOIAvailability.Open) {
                        KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonBackgroundIdle
                    } else {
                        kozmosMutedForeground()
                    },
                    modifier = Modifier.semantics {
                        contentDescription = "Availability: $availabilityLabel"
                    }
                )
            }
        }
    }
}

/**
 * One of the header's buttons, drawn as the web's `IconButton` and iOS's
 * quick buttons draw it: a 44dp square with the control radius, outlined in
 * the neutral emotion with a 20dp glyph. A toggle ([pressed] not null) takes
 * the themed fill while pressed, and TalkBack hears it as selected. The name
 * is the button's own, so a loader in the icon's place leaves it named.
 */
@Composable
private fun HeaderButton(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    pressed: Boolean? = null,
    enabled: Boolean = true,
    loading: Boolean = false
) {
    val filled = pressed == true
    KozmosButton(
        onClick = onClick,
        modifier = Modifier.semantics {
            contentDescription = label
            if (pressed != null) selected = pressed
        },
        variant = if (filled) KozmosButtonVariant.Default else KozmosButtonVariant.Outline,
        emotion = if (filled) KozmosButtonEmotion.Themed else KozmosButtonEmotion.Neutral,
        size = KozmosButtonSize.Icon,
        enabled = enabled,
        isLoading = loading
    ) {
        if (!loading) {
            Icon(imageVector = icon, contentDescription = null, modifier = Modifier.size(20.dp))
        }
    }
}

/**
 * One button in the strip under the header: the POI's own actions and the
 * supplementary ones alike, in the states iOS's `POIDetailActionButton` has.
 * Go ([primary]) is filled, with the navigation pointer, and carries the
 * travel [estimate] under its label, the exact minutes and the distance;
 * TalkBack hears the estimate as the button's state, as VoiceOver hears it
 * as its value. A disabled or loading button cannot be pressed, and a
 * loading one says [loadingLabel] instead; a pressed one is filled and
 * selected. Every button keeps Android's 48dp target ([KozmosButton]).
 */
@Composable
private fun StripButton(
    label: String,
    onClick: () -> Unit,
    state: KozmosPOIActionState?,
    loadingLabel: String,
    primary: Boolean = false,
    estimate: KozmosTravelEstimatePresentation? = null,
    available: Boolean = true
) {
    val pressed = state?.pressed == true
    val loading = state?.loading == true
    val estimateParts = estimate
        ?.let { listOfNotNull(it.durationLabel, it.distanceLabel).filter { part -> part.isNotEmpty() } }
        ?.takeIf { it.isNotEmpty() }
    KozmosButton(
        onClick = onClick,
        modifier = Modifier
            // Two lines want 56, as on iOS and the web.
            .then(if (estimateParts != null) Modifier.heightIn(min = KozmosDimensions.primitivesLayoutSizing700) else Modifier)
            .semantics {
                if (pressed) selected = true
                if (loading) {
                    stateDescription = loadingLabel
                } else if (estimateParts != null) {
                    stateDescription = estimateParts.joinToString(", ")
                }
            },
        variant = if (primary || pressed) KozmosButtonVariant.Default else KozmosButtonVariant.Outline,
        enabled = available && !(state?.disabled ?: false),
        isLoading = loading
    ) {
        if (primary) {
            KozmosIcon("navigation-pointer-01", size = KozmosIconSize.Lg)
        }
        if (estimateParts == null) {
            Text(label)
        } else {
            Column {
                Text(label)
                Text(
                    text = estimateParts.joinToString(" · "),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Normal,
                    // Said as the button's state, without the dot.
                    modifier = Modifier.clearAndSetSemantics {}
                )
            }
        }
    }
}

/**
 * An action's message, under the strip on the inset surface, said politely
 * when it changes: a status in ink, an error in the danger colour.
 */
@Composable
private fun ActionMessage(state: KozmosPOIActionState, surface: Color) {
    val message = state.message ?: return
    Text(
        text = message,
        style = MaterialTheme.typography.bodyMedium,
        color = if (state.messageTone == KozmosPOIActionState.MessageTone.Error) {
            KozmosThemeTokens.primitivesColorsEmotionalDanger600
        } else {
            KozmosThemeTokens.primitivesColorsForeground100
        },
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .background(surface)
            .padding(
                horizontal = KozmosDimensions.primitivesLayoutSpacing150,
                vertical = KozmosDimensions.primitivesLayoutSpacing100
            )
            .semantics { liveRegion = LiveRegionMode.Polite }
    )
}

/**
 * A supplied logo, drawn as iOS draws it: its artwork once loaded, and the
 * name's [initial] on the inset [surface] while it loads or if it cannot
 * (the phases of iOS's AsyncImage). TalkBack hears one image, named by the
 * logo's alt text, whichever is showing. With no logo the header draws
 * none, so this is only called with one.
 */
@Composable
private fun POILogo(logo: KozmosPOILogoPresentation, initial: String, surface: Color) {
    SubcomposeAsyncImage(
        model = logo.src,
        contentDescription = null,
        contentScale = ContentScale.Fit,
        modifier = Modifier
            .size(48.dp)
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .clearAndSetSemantics {
                contentDescription = logo.alt
                role = Role.Image
            },
        loading = { LogoInitial(initial = initial, surface = surface) },
        error = { LogoInitial(initial = initial, surface = surface) }
    )
}

@Composable
private fun LogoInitial(initial: String, surface: Color) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(surface),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = initial,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold,
            color = KozmosThemeTokens.primitivesColorsForeground500
        )
    }
}
