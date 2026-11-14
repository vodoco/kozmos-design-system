package com.kozmos.components.tabs

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.background
import androidx.compose.foundation.indication
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kozmos.components.icon.KozmosIconSize
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

/** A tab's icon (GAP-152): 20dp, 4dp over its label, as React's and SwiftUI's. */
private val TabsIconSize = KozmosIconSize.Md.dp
private val TabsIconGap = KozmosDimensions.primitivesLayoutSpacing50

/**
 * True inside a [KozmosTabsList]: its tabs fill the list's height, which is
 * its tallest tab's (decision 3). A trigger in some other row keeps its own.
 */
private val LocalTabsFillTrack = staticCompositionLocalOf { false }

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
 *
 * TalkBack reads it as React's `tablist`: a selectable group, so TalkBack
 * is given the tabs as one collection, and each tab's place in it.
 *
 * Every tab is as tall as the tallest (decision 3): the list is its tallest
 * tab's height, and each tab fills it. When one tab has an icon, a tab of
 * words alone takes the same stacked height, its words centred down it, so
 * the raised segment fills the track whichever tab is selected. With no
 * icons every tab is the same 44dp as before.
 */
@Composable
fun KozmosTabsList(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .selectableGroup()
            .background(
                KozmosThemeTokens.primitivesColorsBackground100,
                RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
            )
            .padding(horizontal = TabsInset)
            .height(IntrinsicSize.Min),
        verticalAlignment = Alignment.CenterVertically
    ) {
        CompositionLocalProvider(LocalTabsFillTrack provides true) {
            content()
        }
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
 *
 * TalkBack reads it as React's `tab` with `aria-selected`: a tab, selected
 * or not selected.
 *
 * [icon], when given, is drawn 20dp over the title, 4dp above it and centred
 * with it (GAP-152); the segment keeps its padding, and the track grows to
 * hold it; in a [KozmosTabsList] the list's other tabs grow with it. It
 * takes the title's colour through [LocalContentColor] and is
 * decorative: TalkBack reads the tab by its title alone.
 */
@Composable
fun RowScope.KozmosTabsTrigger(
    value: String,
    title: String,
    selectedValue: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    icon: (@Composable () -> Unit)? = null
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    val isSelected = value == selectedValue
    val segment = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl - TabsInset)
    val interactionSource = remember { MutableInteractionSource() }

    Box(
        modifier = modifier
            .weight(1f)
            .then(if (LocalTabsFillTrack.current) Modifier.fillMaxHeight() else Modifier)
            .selectable(
                selected = isSelected,
                interactionSource = interactionSource,
                indication = null,
                role = Role.Tab
            ) {
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
        val ink = if (isSelected) KozmosThemeTokens.primitivesColorsForeground0 else KozmosThemeTokens.primitivesColorsForeground400
        if (icon == null) {
            TabTitle(title, ink)
        } else {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(TabsIconGap)
            ) {
                // Decorative, so a described icon cannot add to the title.
                // The fixed size also answers the list's intrinsic-height
                // query, so an icon built from a SubcomposeLayout (an async
                // image, BoxWithConstraints) is never asked and cannot throw.
                Box(
                    modifier = Modifier.size(TabsIconSize).clearAndSetSemantics {},
                    contentAlignment = Alignment.Center
                ) {
                    CompositionLocalProvider(LocalContentColor provides ink) { icon() }
                }
                TabTitle(title, ink)
            }
        }
    }
}

@Composable
private fun TabTitle(title: String, color: Color) {
    Text(
        text = title,
        color = color,
        style = MaterialTheme.typography.labelLarge,
        textAlign = TextAlign.Center,
        // One line, as React's `whitespace-nowrap`.
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
    )
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
