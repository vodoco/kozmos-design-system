package com.kozmos.components.tabs

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.indication
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosShadows
import com.kozmos.tokens.KozmosThemeTokens

/**
 * How far a tab's segment sits inside the list's track, on every side: the
 * track's 4dp padding, React's `p-1`. The segment's corner is the track's
 * less this, so the two curves stay the same distance apart all the way
 * round (decision 65).
 */
private val TabsInset = KozmosDimensions.primitivesLayoutSpacing50

/** The segment's least height: 36, in a 44dp track. React's list is 40; Figma's is 44, as here. */
private val TabsSegmentMinHeight = 36.dp

@Composable
fun KozmosTabs(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(modifier = modifier.fillMaxWidth()) {
        content()
    }
}

/**
 * The tabs' track: background/100 with the control radius, React's
 * `TabsList` (`bg-muted p-1 rounded-control`). Each trigger draws its own
 * segment 4dp inside it, so the track pads only its ends here.
 */
@Composable
fun KozmosTabsList(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(
                KozmosThemeTokens.primitivesColorsBackground100,
                RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
            )
            .padding(horizontal = TabsInset),
        verticalAlignment = Alignment.CenterVertically
    ) {
        content()
    }
}

/**
 * One tab. Selected, it is React's raised segment (decision 65): a
 * background/0 segment 4dp inside the track, its corner concentric with the
 * track's, lifted by the raised elevation, with foreground/0 words. The
 * other tabs' words are foreground/400 on the track. Nothing on tabs is the
 * theme's colour.
 *
 * The whole 44dp height of the track is the tab's target, the segment's 4dp
 * inset included. React draws no press on a tab and rings it for keyboard
 * focus; Kozmos names no tab token for either, so here the platform's ripple
 * is the press and the focus indication, drawn in the segment's shape rather
 * than across the track.
 */
@Composable
fun RowScope.KozmosTabsTrigger(
    value: String,
    title: String,
    selectedValue: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    val isSelected = value == selectedValue
    val segment = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl - TabsInset)
    val interactionSource = remember { MutableInteractionSource() }

    Box(
        modifier = modifier
            .weight(1f)
            .clickable(interactionSource = interactionSource, indication = null) {
                trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "Tabs", eventName = "tab_switched", properties = mapOf("value" to value.toString())))
                onValueChange(value)
            }
            .padding(vertical = TabsInset)
            .then(
                if (isSelected) {
                    Modifier
                        .shadow(KozmosShadows.semanticsElevationRaised, segment)
                        .background(KozmosThemeTokens.primitivesColorsBackground0, segment)
                } else {
                    Modifier
                }
            )
            .clip(segment)
            .indication(interactionSource, LocalIndication.current)
            .heightIn(min = TabsSegmentMinHeight)
            .padding(
                horizontal = KozmosDimensions.primitivesLayoutSpacing150,
                vertical = KozmosDimensions.primitivesLayoutSpacing75
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = title,
            color = if (isSelected) KozmosThemeTokens.primitivesColorsForeground0 else KozmosThemeTokens.primitivesColorsForeground400,
            style = MaterialTheme.typography.labelLarge,
            textAlign = TextAlign.Center,
            // One line, as React's `whitespace-nowrap`.
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun KozmosTabsContent(
    value: String,
    selectedValue: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    if (value == selectedValue) {
        Box(modifier = modifier.padding(top = KozmosDimensions.primitivesLayoutSpacing100)) {
            content()
        }
    }
}
