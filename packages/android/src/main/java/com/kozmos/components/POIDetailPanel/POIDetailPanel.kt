package com.kozmos.components.poidetailpanel

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.kozmos.components.adaptivemapshell.LocalKozmosPanelClearanceTop
import com.kozmos.components.adaptivemapshell.LocalKozmosPanelInsetTop
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.poimediagallery.KozmosPOIMediaGallery
import com.kozmos.contracts.KozmosPOIAccessRestrictions
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIAvailability
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIServicePresentation
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

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
 * In its sheet presentation, which paints no surface of its own, the card is
 * the top of the map shell's panel: its header tops its top padding up to what
 * the panel already leaves above it ([LocalKozmosPanelInsetTop],
 * [LocalKozmosPanelClearanceTop]) rather than adding to it, so its close
 * button sits as far from the panel's top as from its side (GAP-083). The
 * panel and inline presentations draw their own bordered card and keep their
 * padding inside it.
 *
 * The web component's `titleLevel` prop has no counterpart here: Compose
 * semantics expose `heading()` as a boolean with no rank, so TalkBack cannot
 * distinguish an h2 from an h3. SwiftUI does support ranks and mirrors the prop
 * as `KozmosPOIDetailPanel.TitleLevel`.
 */
@OptIn(ExperimentalLayoutApi::class)
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
    presentation: KozmosPOIDetailPanelPresentation = KozmosPOIDetailPanelPresentation.Inline
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

    // The header's top padding. In the sheet presentation the card paints no
    // surface of its own, so the space the shell's panel leaves above it is
    // the card's own top: the header tops it up to 16 rather than adding 16
    // to it, and keeps the clearance the panel asks for under a handle — the
    // close button sat 32 from the sheet's top and 16 from its side
    // (GAP-083). The panel and inline presentations draw their own bordered
    // card, and that space lies outside the border: they keep their 16
    // inside it, or the header meets the card's own top edge.
    val headerPadding = KozmosDimensions.primitivesLayoutSpacing200
    val headerTop = if (presentation == KozmosPOIDetailPanelPresentation.Sheet) {
        maxOf(LocalKozmosPanelClearanceTop.current, headerPadding - LocalKozmosPanelInsetTop.current)
    } else {
        headerPadding
    }

    val showsAccessRestrictions = poi.accessRestrictions != null &&
        poi.accessRestrictions != KozmosPOIAccessRestrictions.None &&
        poi.accessRestrictionsLabel != null

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
        // The body scrolls under a pinned header, which requires a bounded
        // height. When the caller nests the panel somewhere unbounded (another
        // scroll container, wrapContentSize) Compose would throw, so fall back
        // to growing naturally — the same way the web panel behaves.
        BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
        val bodyScrolls = constraints.hasBoundedHeight
        val bodyScrollState = rememberScrollState()

        Column(modifier = Modifier.fillMaxWidth()) {
            Header(poi = poi, onClose = onClose, closeLabel = closeLabel, surface = insetSurface, top = headerTop)

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
                        color = KozmosThemeTokens.primitivesColorsForeground500
                    )
                }

                if (poi.actions.isNotEmpty()) {
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(
                            KozmosDimensions.primitivesLayoutSpacing100
                        ),
                        verticalArrangement = Arrangement.spacedBy(
                            KozmosDimensions.primitivesLayoutSpacing100
                        )
                    ) {
                        poi.actions.forEach { action ->
                            val state = actionStates[action]
                            val isToggle = action == KozmosPOIAction.Favourite ||
                                action == KozmosPOIAction.Bookmark

                            KozmosButton(
                                onClick = { onAction(action, poi.id) },
                                modifier = Modifier.semantics {
                                    if (isToggle) selected = state?.pressed ?: false
                                },
                                variant = if (action == KozmosPOIAction.Navigate) {
                                    KozmosButtonVariant.Default
                                } else {
                                    KozmosButtonVariant.Outline
                                },
                                enabled = !(state?.disabled ?: false),
                                isLoading = state?.loading ?: false
                            ) {
                                Icon(
                                    imageVector = actionIcon(action),
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(actionLabels[action] ?: action.value)
                            }
                        }
                    }
                }

                poi.actions.forEach { action ->
                    val state = actionStates[action]
                    val message = state?.message
                    if (message != null) {
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
                                .background(insetSurface)
                                .padding(
                                    horizontal = KozmosDimensions.primitivesLayoutSpacing150,
                                    vertical = KozmosDimensions.primitivesLayoutSpacing100
                                )
                                .semantics { liveRegion = LiveRegionMode.Polite }
                        )
                    }
                }

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
                    Services(heading = servicesHeading, services = services)
                }
            }
        }
        }
    }
}

private fun actionIcon(action: KozmosPOIAction): ImageVector = when (action) {
    KozmosPOIAction.Navigate -> Icons.Default.Navigation
    KozmosPOIAction.Favourite -> Icons.Default.FavoriteBorder
    KozmosPOIAction.Bookmark -> Icons.Default.Bookmark
    KozmosPOIAction.Share -> Icons.Default.Share
    KozmosPOIAction.Order -> Icons.Default.ShoppingCart
}

@Composable
private fun Header(
    poi: KozmosPOIPresentation,
    onClose: (() -> Unit)?,
    closeLabel: String,
    surface: Color = KozmosThemeTokens.primitivesColorsBackground100,
    top: Dp = KozmosDimensions.primitivesLayoutSpacing200
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(
                start = KozmosDimensions.primitivesLayoutSpacing200,
                top = top,
                end = KozmosDimensions.primitivesLayoutSpacing200,
                bottom = KozmosDimensions.primitivesLayoutSpacing200
            ),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
    ) {
        POILogo(poi = poi, surface = surface)

        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
        ) {
            Text(
                text = poi.name,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
                color = KozmosThemeTokens.primitivesColorsForeground100,
                // Three lines at most, beside the buttons, as on iOS and the web.
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.semantics { heading() }
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(
                    KozmosDimensions.primitivesLayoutSpacing50
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Place,
                    contentDescription = null,
                    tint = KozmosThemeTokens.primitivesColorsForeground500,
                    modifier = Modifier.size(16.dp)
                )
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
                    color = if (poi.availability == KozmosPOIAvailability.Open) {
                        KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonBackgroundIdle
                    } else {
                        KozmosThemeTokens.primitivesColorsForeground500
                    },
                    modifier = Modifier.semantics {
                        contentDescription = "Availability: $availabilityLabel"
                    }
                )
            }
        }

        if (onClose != null) {
            KozmosIconButton(
                icon = Icons.Default.Close,
                onClick = onClose,
                contentDescription = closeLabel
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Services(
    heading: String,
    services: List<KozmosPOIServicePresentation>
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .semantics { contentDescription = heading },
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
    ) {
        Text(
            text = heading,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = KozmosThemeTokens.primitivesColorsForeground100,
            modifier = Modifier.semantics { heading() }
        )

        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(
                KozmosDimensions.primitivesLayoutSpacing100
            ),
            verticalArrangement = Arrangement.spacedBy(
                KozmosDimensions.primitivesLayoutSpacing100
            )
        ) {
            services.forEach { service ->
                Surface(
                    shape = RoundedCornerShape(percent = 50),
                    color = KozmosThemeTokens.primitivesColorsBackground0,
                    border = BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle)
                ) {
                    Text(
                        text = service.label,
                        style = MaterialTheme.typography.bodyMedium,
                        color = KozmosThemeTokens.primitivesColorsForeground100,
                        modifier = Modifier.padding(
                            horizontal = KozmosDimensions.primitivesLayoutSpacing150,
                            vertical = KozmosDimensions.primitivesLayoutSpacing100
                        )
                    )
                }
            }
        }
    }
}

@Composable
private fun POILogo(poi: KozmosPOIPresentation, surface: Color = KozmosThemeTokens.primitivesColorsBackground100) {
    val logo = poi.logo
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)

    if (logo != null) {
        AsyncImage(
            model = logo.src,
            contentDescription = logo.alt,
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .size(48.dp)
                .clip(shape)
        )
    } else {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(shape)
                .background(surface),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = poi.logoFallbackInitial,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold,
                color = KozmosThemeTokens.primitivesColorsForeground500
            )
        }
    }
}
