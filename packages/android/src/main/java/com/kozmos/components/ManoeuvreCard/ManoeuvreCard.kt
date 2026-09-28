package com.kozmos.components.manoeuvrecard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.icon
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.LocalKozmosSurfaceStyle
import com.kozmos.components.surface.kozmosMutedForeground
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

/** What TalkBack hears for the closed card: the instruction, then the detail. */
fun manoeuvreDescription(instruction: String, detail: String?): String =
    if (detail.isNullOrEmpty()) instruction else "$instruction, $detail"

/**
 * The current manoeuvre, floating over the map during navigation: its arrow,
 * the instruction, how far and how long, and a grab bar that opens the full
 * itinerary in its place. The card owns the toggle and what TalkBack hears
 * of it; the itinerary it opens into is the caller's — `KozmosItinerary`, in
 * the products — so the card never decides what a route is made of. Open,
 * the card is as tall as the itinerary up to `maxItineraryHeight`, past
 * which the itinerary scrolls: a long route must not cover the map.
 */
@Composable
fun KozmosManoeuvreCard(
    type: DirectionType,
    instruction: String,
    expanded: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
    detail: String? = null,
    expandLabel: String = "Show itinerary",
    collapseLabel: String = "Hide itinerary",
    manoeuvreLabel: String = "Current manoeuvre",
    maxItineraryHeight: Dp = 320.dp,
    surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
    itinerary: @Composable () -> Unit
) {
    Surface(
        // Open, the card has no name of its own: the itinerary inside is the
        // named thing, and two nodes called the same would be read twice.
        modifier = modifier.then(if (expanded) Modifier else Modifier.semantics { contentDescription = manoeuvreLabel }),
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer),
        color = KozmosSurfaceDefaults.tint(surface),
        border = KozmosSurfaceDefaults.border(surface),
        shadowElevation = 8.dp
    ) {
        // What the card holds is drawn on its surface: its muted text, and
        // the itinerary's, reads it (decision 48).
        CompositionLocalProvider(LocalKozmosSurfaceStyle provides surface) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(
                    start = KozmosDimensions.primitivesLayoutSpacing200,
                    top = KozmosDimensions.primitivesLayoutSpacing200,
                    end = KozmosDimensions.primitivesLayoutSpacing200,
                    bottom = KozmosDimensions.primitivesLayoutSpacing50
                )
        ) {
            if (expanded) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = maxItineraryHeight)
                        .verticalScroll(rememberScrollState())
                ) {
                    itinerary()
                }
            } else {
                // The instruction row is the button: a tap anywhere on it opens
                // the itinerary, and TalkBack hears the manoeuvre with the action.
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(onClickLabel = expandLabel, role = Role.Button, onClick = onToggle)
                        .semantics(mergeDescendants = true) {
                            contentDescription = manoeuvreDescription(instruction, detail)
                            expand { onToggle(); true }
                        },
                    verticalAlignment = Alignment.Top
                ) {
                    Box(
                        modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing400),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = type.icon(),
                            contentDescription = null,
                            tint = KozmosThemeTokens.primitivesColorsTheme500,
                            modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing300)
                        )
                    }
                    Column(modifier = Modifier.weight(1f).padding(start = KozmosDimensions.primitivesLayoutSpacing150)) {
                        Text(
                            text = instruction,
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.SemiBold),
                            color = KozmosThemeTokens.primitivesColorsForeground100,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (!detail.isNullOrEmpty()) {
                            // Muted, and on glass the foreground colour
                            // (decision 48).
                            Text(
                                text = detail,
                                style = MaterialTheme.typography.bodyMedium,
                                color = kozmosMutedForeground()
                            )
                        }
                    }
                }
            }
            // The grab bar: the sign that the card opens, and the way to close
            // it. Closed, the instruction row already offers the way in.
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = KozmosDimensions.primitivesLayoutSpacing150)
                    // Closed, the bar has no semantics at all — the cleared
                    // node hides the click that follows it — so TalkBack
                    // never lands on a second way to do what the row does.
                    .then(
                        if (expanded) {
                            Modifier.semantics {
                                contentDescription = collapseLabel
                                collapse { onToggle(); true }
                            }
                        } else {
                            Modifier.clearAndSetSemantics { }
                        }
                    )
                    .clickable(onClick = onToggle, role = Role.Button)
                    .padding(vertical = KozmosDimensions.primitivesLayoutSpacing50),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .width(36.dp)
                        .height(5.dp)
                        .background(KozmosThemeTokens.primitivesColorsBackground300, CircleShape)
                )
            }
        }
        }
    }
}
