package com.kozmos.components.locationpin

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.components.categorytile.KozmosCategoryTint
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions
import kotlin.math.PI

/** Colour role of a map marker, mirroring the React `LocationPin.variant` prop. */
enum class KozmosLocationPinVariant {
    Default,
    Primary,
    Secondary,
    Accent
}

/** Marker footprint, mirroring the React `LocationPin.size` prop. */
enum class KozmosLocationPinSize(val diameter: Dp) {
    Sm(24.dp),
    Md(32.dp),
    Lg(40.dp)
}

/** Where the marker's label sits relative to the marker. */
enum class KozmosLocationPinLabelPlacement {
    Top,
    Right,
    Bottom,
    Left
}

/**
 * A map marker for a point of interest.
 *
 * Mirrors the React `LocationPin` API. Selection, featured, off-floor, and
 * disabled are independent flags rather than one state axis, matching React,
 * so a pin can be both featured and selected. Placement on the map and
 * collision handling stay with the renderer.
 */
@Composable
fun KozmosLocationPin(
    modifier: Modifier = Modifier,
    variant: KozmosLocationPinVariant = KozmosLocationPinVariant.Primary,
    size: KozmosLocationPinSize = KozmosLocationPinSize.Md,
    label: String? = null,
    number: Int? = null,
    labelPlacement: KozmosLocationPinLabelPlacement = KozmosLocationPinLabelPlacement.Bottom,
    selected: Boolean = false,
    featured: Boolean = false,
    offFloor: Boolean = false,
    enabled: Boolean = true,
    /** A category's colours for the marker — its fill, with its ink for the
     *  number — over the variant's; a featured pin keeps the alert colour. */
    tint: KozmosCategoryTint? = null
) {
    // Filled, the primary pin is the theme fill, theme 500 in both themes,
    // with its number in the theme foreground, white in both (decision 59):
    // foreground/1000 turned the number black on it in the dark. The accent
    // pin's fill is theme variant 1's 500, #4135F1 in both themes (decision
    // 63), and its number the theme foreground too: foreground/1000 is black
    // in the dark, 3.00:1 on it, where white reads 6.99:1.
    val inkedInThemeForeground = !featured && tint == null &&
        (variant == KozmosLocationPinVariant.Primary || variant == KozmosLocationPinVariant.Accent)
    val markerColor: Color = when {
        featured -> KozmosThemeTokens.primitivesColorsEmotionalAlert500
        tint != null -> tint.fill.fill
        variant == KozmosLocationPinVariant.Default -> KozmosThemeTokens.primitivesColorsForeground100
        variant == KozmosLocationPinVariant.Primary -> KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
        variant == KozmosLocationPinVariant.Secondary -> KozmosThemeTokens.primitivesColorsForeground400
        else -> KozmosThemeTokens.primitivesColorsThemeVariant1500
    }

    // Selected pins grow as well as recolor, so selection is not colour-only.
    val diameter = if (selected) size.diameter + 8.dp else size.diameter
    val alpha = if (enabled) 1f else 0.5f

    // Decision 55 (Olcay, 2026-09-29): a numbered pin on this floor is quiet
    // at rest — the surface, a ring and the number in its colour — and filled
    // only when selected, as the result card's number tab is. A featured pin
    // (its logo on the map) and a pin with no number keep their fill. Quiet
    // and off the floor both draw the outlined marker; off the floor its ring
    // is dashed, so the two never read alike.
    val quiet = number != null && !selected && !featured && !offFloor
    val outlined = quiet || offFloor

    // The marker's colour as a ring and a number on the surface, where it
    // must read at 4.5:1 in both themes. The theme's 500 is one blue in both,
    // 3.74:1 on the dark surface, so the primary takes the theme's text role
    // (theme/600), and the accent its 700 (theme variant 1's 600 reads 4.21:1
    // in the dark). The others are inks already.
    val outlineColor: Color = when {
        featured -> KozmosThemeTokens.primitivesColorsEmotionalAlert500
        tint != null -> tint.fill.fill
        variant == KozmosLocationPinVariant.Default -> KozmosThemeTokens.primitivesColorsForeground100
        variant == KozmosLocationPinVariant.Primary -> KozmosThemeTokens.semanticsEmotionThemedText
        variant == KozmosLocationPinVariant.Secondary -> KozmosThemeTokens.primitivesColorsForeground400
        else -> KozmosThemeTokens.primitivesColorsThemeVariant1700
    }

    // The number: in the fill's ink when filled; in the ring's colour when
    // quiet, except a tint's (six of the eight fills fail 4.5:1 as text on the
    // surface), which takes the foreground, as it does off the floor. On the
    // featured amber it is the alert's onFill, the dark words decision 55
    // gives Featured, whatever the tint: foreground/1000 is white in the
    // light, 1.76:1 on #FAB735.
    val numberColor: Color = when {
        offFloor || (quiet && tint != null) -> KozmosThemeTokens.primitivesColorsForeground0
        quiet -> outlineColor
        featured -> KozmosThemeTokens.semanticsEmotionAlertOnfill
        inkedInThemeForeground -> KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
        else -> tint?.fill?.ink ?: KozmosThemeTokens.primitivesColorsForeground1000
    }

    val description = listOfNotNull(
        label,
        number?.toString(),
        if (featured) "Featured" else null,
        if (offFloor) "On another floor" else null
    ).joinToString(", ")

    // Captured so the semantics `selected` property is not shadowed by the
    // parameter of the same name.
    val isSelected = selected
    val rootModifier = modifier.semantics {
        if (description.isNotEmpty()) contentDescription = description
        this.selected = isSelected
    }

    // Read in composition: the draw block below runs outside it.
    val hollowFill = KozmosThemeTokens.primitivesColorsBackground0
    val pinRing = KozmosThemeTokens.primitivesColorsForeground1000
    val marker: @Composable () -> Unit = {
        Box(contentAlignment = Alignment.Center) {
            Canvas(modifier = Modifier.size(diameter)) {
                val radius = this.size.minDimension / 2f
                // Outlined — quiet at rest, or off the floor — the fill drops
                // out and the marker colour moves to the ring. Off the floor
                // the ring is dashed (eight long dashes, which read as a
                // dashed ring, not the cogwheel short ones made), so shape
                // carries the floor, never colour alone, and a quiet pin at
                // rest is never taken for one on another floor.
                val fill = if (outlined) hollowFill else markerColor
                val ring = if (outlined) outlineColor else pinRing
                val ringWidth = (if (outlined) 3f else 2f) * density
                val ringRadius = radius - ringWidth / 2f
                // Eight dashes that close evenly at every diameter; round caps
                // add half the width at each end of a dash.
                val segment = (2f * PI.toFloat() * ringRadius) / 8f
                val dashes = if (offFloor) {
                    PathEffect.dashPathEffect(
                        floatArrayOf(segment * 0.62f - ringWidth, segment * 0.38f + ringWidth)
                    )
                } else {
                    null
                }

                drawCircle(color = fill.copy(alpha = alpha), radius = radius)
                drawCircle(
                    color = ring.copy(alpha = alpha),
                    radius = ringRadius,
                    style = Stroke(
                        width = ringWidth,
                        cap = if (offFloor) StrokeCap.Round else StrokeCap.Butt,
                        pathEffect = dashes
                    )
                )
            }

            number?.let {
                Text(
                    text = it.toString(),
                    fontSize = (diameter.value * 0.44f).sp,
                    fontWeight = FontWeight.Bold,
                    // Off the floor the number sits on the white disc in the
                    // foreground; the ring keeps the colour (Olcay, 2026-09-21).
                    color = numberColor.copy(alpha = alpha)
                )
            }
        }
    }

    val labelContent: @Composable () -> Unit = {
        label?.let {
            Text(
                text = it,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = KozmosThemeTokens.primitivesColorsForeground100.copy(alpha = alpha),
                maxLines = 1
            )
        }
    }

    val spacing = KozmosDimensions.primitivesLayoutSpacing50

    when (labelPlacement) {
        KozmosLocationPinLabelPlacement.Top,
        KozmosLocationPinLabelPlacement.Bottom -> Column(
            modifier = rootModifier,
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(spacing)
        ) {
            if (labelPlacement == KozmosLocationPinLabelPlacement.Top) {
                labelContent()
                marker()
            } else {
                marker()
                labelContent()
            }
        }

        KozmosLocationPinLabelPlacement.Left,
        KozmosLocationPinLabelPlacement.Right -> Row(
            modifier = rootModifier,
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(spacing)
        ) {
            if (labelPlacement == KozmosLocationPinLabelPlacement.Left) {
                labelContent()
                marker()
            } else {
                marker()
                labelContent()
            }
        }
    }
}
