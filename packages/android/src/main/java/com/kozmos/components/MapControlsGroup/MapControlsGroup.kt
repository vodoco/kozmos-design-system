package com.kozmos.components.mapcontrolsgroup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Accessible
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.outlined.NearMe
import androidx.compose.material.icons.outlined.NearMeDisabled
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButton
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonLabelPlacement
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonPresentation
import com.kozmos.contracts.KozmosUserLocationState
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosShadows
import com.kozmos.tokens.KozmosThemeTokens

/**
 * The stacked zoom, compass and locate controls that sit over a map.
 *
 * [zoomInLabel], [zoomOutLabel] and [compassResetLabel] are what each control
 * is called, for a visitor who cannot see it. Hard-coded English until row 67:
 * a German or Japanese device announced "Zoom in" whatever else the product
 * had translated. The defaults stay English because a design system has no
 * locale of its own — the product has one, and now has somewhere to put it.
 *
 * [locationState] is the mode the location control shows (row 77): a mark for
 * each, selected only while the map follows the visitor, and the system's arc
 * while it is locating. Pair it with a localized [locationStateLabel] — the
 * mark alone tells TalkBack nothing. [locationIcons] replaces the mark for any
 * mode it names; the others keep the group's own.
 *
 * Every control wears the SDK's surface (decision 40): the map controls' 48
 * square, no edge, the Control corner. The SDK reads heading "On", as it reads
 * following; its mark tells them apart on screen, and TalkBack hears
 * [locationHeadingDescription] after the words, for the product to translate.
 * With no position ([KozmosUserLocationState.Unavailable],
 * [KozmosUserLocationState.PermissionDenied]) the control draws
 * [locationStateLabel] alone, on one line — the SDK's "No Location" — and its
 * name still starts what TalkBack hears.
 *
 * [locationRevealOnChange] lets the location control widen to say its new mode
 * whenever it changes, then collapse — [KozmosMapControlButton]'s
 * `revealOnChange`. With [locationLabelPlacement] stacked this is how the SDK's
 * control reads: icon-only over the map, "Focus / On" for a moment. Both are
 * off by default, so a product that relies on a fixed presentation sees
 * nothing move.
 *
 * While a route is shown, a step-free toggle takes the location control's
 * place: passing [onStepFreeChange] draws it, and the location control is not
 * drawn. It is called with the setting the visitor asked for (Olcay,
 * 2026-09-27). It follows the location control's presentation, reveal and
 * label placement, so the corner reads the same either way. Set [stepFree]
 * once the route it describes is the one on the map — a control that says
 * "On" over a route with stairs is worse than one that is a moment late.
 */
@Composable
fun KozmosMapControlsGroup(
    modifier: Modifier = Modifier,
    compassBearing: Float = 0f,
    onZoomIn: () -> Unit = {},
    onZoomOut: () -> Unit = {},
    onCompassReset: (() -> Unit)? = null,
    onMyLocation: (() -> Unit)? = null,
    locationPresentation: KozmosMapControlButtonPresentation =
        KozmosMapControlButtonPresentation.IconOnly,
    locationLabel: String = "Locate me",
    locationStateLabel: String? = null,
    locationHeadingDescription: String = "map turns with you",
    zoomInLabel: String = "Zoom in",
    zoomOutLabel: String = "Zoom out",
    compassResetLabel: String = "Reset bearing",
    locationState: KozmosUserLocationState = KozmosUserLocationState.Off,
    locationIcons: Map<KozmosUserLocationState, ImageVector> = emptyMap(),
    locationRevealOnChange: Boolean = false,
    locationLabelPlacement: KozmosMapControlButtonLabelPlacement =
        KozmosMapControlButtonLabelPlacement.Inline,
    onStepFreeChange: ((Boolean) -> Unit)? = null,
    stepFree: Boolean = false,
    stepFreeLabel: String = "Step-free",
    stepFreeOnLabel: String = "On",
    stepFreeOffLabel: String = "Off",
    stepFreeIcon: ImageVector? = null
) {
    val trackEvent = LocalKozmosAnalytics.current

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
    ) {
        // Zoom: one surface, its two controls its segments — the map controls'
        // surface, corner and elevation (decision 40), and no edge round it.
        Surface(
            shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
            color = KozmosThemeTokens.primitivesColorsBackground0,
            shadowElevation = KozmosShadows.semanticsElevationMapControl
        ) {
            Column {
                MapControlIconButton(
                    icon = Icons.Default.Add,
                    contentDescription = zoomInLabel,
                    onClick = {
                        trackEvent(KozmosAnalyticsEvent(component = "MapControlsGroup", eventName = "zoom_in"))
                        onZoomIn()
                    }
                )
                // As wide as a control, not the width on offer: a Divider
                // fills it, and in the shell's corner it is offered the whole
                // map. SwiftUI's rule is drawn to the control's width for the
                // same reason.
                Divider(
                    modifier = Modifier.width(KozmosDimensions.primitivesLayoutSizing600),
                    color = KozmosThemeTokens.semanticsBorderSubtle
                )
                MapControlIconButton(
                    icon = Icons.Default.Remove,
                    contentDescription = zoomOutLabel,
                    onClick = {
                        trackEvent(KozmosAnalyticsEvent(component = "MapControlsGroup", eventName = "zoom_out"))
                        onZoomOut()
                    }
                )
            }
        }

        onCompassReset?.let { reset ->
            Surface(
                modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing600),
                shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
                color = KozmosThemeTokens.primitivesColorsBackground0,
                shadowElevation = KozmosShadows.semanticsElevationMapControl
            ) {
                MapControlIconButton(
                    modifier = Modifier.rotate(compassBearing),
                    icon = Icons.Default.Explore,
                    contentDescription = compassResetLabel,
                    onClick = {
                        trackEvent(KozmosAnalyticsEvent(component = "MapControlsGroup", eventName = "compass_reset"))
                        reset()
                    }
                )
            }
        }

        // Both compose the shared MapControlButton so the labelled
        // presentation and its accessible name stay consistent with standalone
        // map controls.
        if (onStepFreeChange != null) {
            KozmosMapControlButton(
                label = stepFreeLabel,
                onClick = {
                    trackEvent(
                        KozmosAnalyticsEvent(
                            component = "MapControlsGroup",
                            eventName = "step_free_toggled",
                            properties = mapOf("stepFree" to (!stepFree).toString())
                        )
                    )
                    onStepFreeChange(!stepFree)
                },
                icon = { Icon(imageVector = stepFreeMark(stepFreeIcon), contentDescription = null) },
                stateLabel = if (stepFree) stepFreeOnLabel else stepFreeOffLabel,
                presentation = locationPresentation,
                labelPlacement = locationLabelPlacement,
                pressed = stepFree,
                revealOnChange = locationRevealOnChange
            )
        } else {
            onMyLocation?.let { locate ->
                KozmosMapControlButton(
                    label = locationLabel,
                    onClick = {
                        trackEvent(
                            KozmosAnalyticsEvent(
                                component = "MapControlsGroup",
                                eventName = "my_location_triggered"
                            )
                        )
                        locate()
                    },
                    icon = {
                        Icon(
                            imageVector = locationMark(locationState, locationIcons),
                            contentDescription = null
                        )
                    },
                    stateLabel = locationStateLabel,
                    // Heading reads "On", as following does and as the SDK's
                    // control does (decision 40); its mark tells them apart on
                    // screen, and this after the words tells TalkBack.
                    stateDescription = if (locationState == KozmosUserLocationState.Heading) {
                        locationHeadingDescription
                    } else {
                        null
                    },
                    // With no position the SDK reads "No Location" alone.
                    showLabel = locationState != KozmosUserLocationState.Unavailable &&
                        locationState != KozmosUserLocationState.PermissionDenied,
                    presentation = locationPresentation,
                    labelPlacement = locationLabelPlacement,
                    // Selected whatever the state until row 77, so a map that
                    // was not following at all drew a control that said it was.
                    pressed = locationState == KozmosUserLocationState.Following ||
                        locationState == KozmosUserLocationState.Heading,
                    revealOnChange = locationRevealOnChange,
                    isLoading = locationState == KozmosUserLocationState.Locating
                )
            }
        }
    }
}

/**
 * The location control's mark for each mode, in Material's own glyphs — native
 * draws the platform's icons, as KozmosIcon does, not Pointr's artwork. Each is
 * the nearest material-icons-extended has to the Location Tracking Buttons
 * revamp (Figma `ce7phRJR1sCkH6zT8EMH8I`, `1:237`):
 *
 * | Mode                          | Mark                            | The revamp's                        |
 * | ----------------------------- | ------------------------------- | ----------------------------------- |
 * | Off, Stale, Locating          | `Icons.Outlined.NearMe`         | outline pointer                     |
 * | Following                     | `Icons.Filled.NearMe`           | solid pointer and its cone          |
 * | Heading                       | `Icons.Filled.Navigation`       | upright pointer and the turning arc |
 * | PermissionDenied, Unavailable | `Icons.Outlined.NearMeDisabled` | pointer struck through              |
 *
 * Stale keeps the outline because a last-known fix is not following anything;
 * Locating keeps it under the button's spinner. [icons] replaces any mode's
 * mark.
 */
internal fun locationMark(
    state: KozmosUserLocationState,
    icons: Map<KozmosUserLocationState, ImageVector>
): ImageVector = icons[state] ?: when (state) {
    KozmosUserLocationState.Following -> Icons.Filled.NearMe
    KozmosUserLocationState.Heading -> Icons.Filled.Navigation
    KozmosUserLocationState.PermissionDenied,
    KozmosUserLocationState.Unavailable -> Icons.Outlined.NearMeDisabled
    KozmosUserLocationState.Off,
    KozmosUserLocationState.Locating,
    KozmosUserLocationState.Stale -> Icons.Outlined.NearMe
}

/** The wheelchair KozmosRouteOptionCard draws for a step-free route, unless [icon] replaces it. */
internal fun stepFreeMark(icon: ImageVector?): ImageVector =
    icon ?: Icons.AutoMirrored.Filled.Accessible

@Composable
private fun MapControlIconButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    IconButton(
        onClick = onClick,
        modifier = modifier
            .size(KozmosDimensions.primitivesLayoutSizing600)
            .semantics { this.contentDescription = contentDescription }
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = KozmosThemeTokens.primitivesColorsForeground100
        )
    }
}
