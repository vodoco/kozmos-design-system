package com.kozmos.components.clientappbanner

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.traversalIndex
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.iconbutton.KozmosIconButtonSize
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.LocalKozmosSurfaceStyle
import com.kozmos.components.surface.kozmosMutedForeground
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosShadows
import com.kozmos.tokens.KozmosThemeTokens

/** What the words keep before the action shares their line: the web's 10rem. */
internal val ClientAppBannerMinimumWordsWidth = 160.dp

/** Dismiss: Compose's 48 target, 4 from the top and end edges. */
private val DismissSize = KozmosDimensions.primitivesLayoutSizing600
private val DismissInset = KozmosDimensions.primitivesLayoutSpacing50

/** The app's first letter, whole even when it is two code units, in upper case. */
internal fun clientAppBannerInitial(appName: String): String {
    val trimmed = appName.trim()
    if (trimmed.isEmpty()) return ""
    val end = trimmed.offsetByCodePoints(0, 1)
    return trimmed.substring(0, end).uppercase()
}

/**
 * Express's Client App Banner (GAP-127). Mirrors React's `ClientAppBanner`.
 *
 * The customer's promotion, the app's icon, name and description, and one
 * action, with a way to dismiss it. Every word is set by the customer in
 * Pointr Cloud; Kozmos draws them. Made for the map shell's top bar, which
 * hosts what it is given with no surface of its own, so the banner draws its
 * own, as the manoeuvre card there does: the solid surface (the page's fill
 * and its subtle edge), the Container corner, and map chrome's floating
 * elevation. 16 inside; the 48 icon 12 from the words.
 *
 * Where the words and the action do not fit side by side — the words keep
 * 160dp, the web's 10rem — the action goes under the words, as wide as they
 * are. Dismiss is Compose's 48 target at the top end, 4 from the edges.
 *
 * TalkBack reads a pane named by the app, as one group: the promotion, the
 * name and the description, then the action, then dismiss. The icon says
 * nothing over the name. The banner moves no focus and never removes itself:
 * [onDismiss] asks the product to; null, there is no dismiss button.
 *
 * @param appIconUrl The app's icon. Without one, or until it loads, the app's
 *   initial stands in for it.
 * @param description What the app is for. Two lines at most are drawn;
 *   TalkBack reads all of it.
 * @param dismissLabel Names the dismiss button. Supply translated words.
 */
@Composable
fun KozmosClientAppBanner(
    appName: String,
    actionLabel: String,
    onAction: () -> Unit,
    modifier: Modifier = Modifier,
    promotionText: String? = null,
    description: String? = null,
    appIconUrl: String? = null,
    onDismiss: (() -> Unit)? = null,
    dismissLabel: String = "Dismiss"
) {
    val style = KozmosSurfaceStyle.Solid
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .semantics {
                paneTitle = appName
                isTraversalGroup = true
            },
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer),
        color = KozmosSurfaceDefaults.tint(style),
        contentColor = KozmosThemeTokens.primitivesColorsForeground100,
        border = KozmosSurfaceDefaults.border(style),
        shadowElevation = KozmosShadows.semanticsElevationFloating
    ) {
        // What the banner holds is drawn on its surface: its muted text reads it.
        CompositionLocalProvider(LocalKozmosSurfaceStyle provides style) {
            Box(Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(
                            start = KozmosDimensions.primitivesLayoutSpacing200,
                            top = KozmosDimensions.primitivesLayoutSpacing200,
                            bottom = KozmosDimensions.primitivesLayoutSpacing200,
                            // Dismiss's target, the 4 beside it and the 12
                            // before the words, so they end where they would
                            // beside it in the row.
                            end = if (onDismiss == null) KozmosDimensions.primitivesLayoutSpacing200
                            else DismissInset + DismissSize + KozmosDimensions.primitivesLayoutSpacing150
                        ),
                    horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150),
                    verticalAlignment = Alignment.Top
                ) {
                    ClientAppBannerIcon(appIconUrl, clientAppBannerInitial(appName))
                    ClientAppBannerBody(
                        modifier = Modifier.weight(1f),
                        words = { ClientAppBannerWords(promotionText, appName, description) },
                        action = {
                            // Read after the words, wherever it is placed.
                            KozmosButton(onClick = onAction, modifier = Modifier.semantics { traversalIndex = 1f }) {
                                Text(actionLabel)
                            }
                        }
                    )
                }
                if (onDismiss != null) {
                    KozmosIconButton(
                        icon = Icons.Outlined.Close,
                        onClick = onDismiss,
                        contentDescription = dismissLabel,
                        size = KozmosIconButtonSize.Lg,
                        // At the top end it is above the words; read by place
                        // it would come first. It is read last.
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(DismissInset)
                            .semantics { traversalIndex = 2f }
                    )
                }
            }
        }
    }
}

/** The app's icon, or its initial on the muted fill until there is one: 48, the Control corner, the subtle edge. */
@Composable
private fun ClientAppBannerIcon(url: String?, initial: String) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    Box(
        modifier = Modifier
            .size(KozmosDimensions.primitivesLayoutSizing600)
            .clip(shape)
            .background(KozmosThemeTokens.primitivesColorsBackground100, shape)
            .border(1.dp, KozmosThemeTokens.semanticsBorderSubtle, shape)
            // Decoration beside the app's name: nothing of it is read.
            .clearAndSetSemantics {},
        contentAlignment = Alignment.Center
    ) {
        Text(
            initial,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = KozmosThemeTokens.primitivesColorsForeground100
        )
        if (!url.isNullOrEmpty()) {
            AsyncImage(
                model = url,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.matchParentSize()
            )
        }
    }
}

@Composable
private fun ClientAppBannerWords(promotionText: String?, appName: String, description: String?) {
    Column(verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing25)) {
        if (!promotionText.isNullOrEmpty()) {
            Text(
                promotionText,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium,
                color = kozmosMutedForeground()
            )
        }
        Text(
            appName,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold,
            color = KozmosThemeTokens.primitivesColorsForeground100
        )
        if (!description.isNullOrEmpty()) {
            Text(
                description,
                style = MaterialTheme.typography.bodyMedium,
                color = kozmosMutedForeground(),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

/**
 * The words and the action: side by side while the words keep
 * [ClientAppBannerMinimumWordsWidth], the action at its own width; past that,
 * the action under the words, as wide as they are. Placed relative to the
 * layout direction, so right to left mirrors it.
 */
@Composable
private fun ClientAppBannerBody(
    modifier: Modifier,
    words: @Composable () -> Unit,
    action: @Composable () -> Unit
) {
    Layout(contents = listOf(words, action), modifier = modifier) { (wordsMeasurables, actionMeasurables), constraints ->
        val wordsMeasurable = wordsMeasurables.single()
        val actionMeasurable = actionMeasurables.single()
        val gap = KozmosDimensions.primitivesLayoutSpacing150.roundToPx()
        val actionWidth = actionMeasurable.maxIntrinsicWidth(Constraints.Infinity)
        val width = if (constraints.hasBoundedWidth) constraints.maxWidth
        else wordsMeasurable.maxIntrinsicWidth(Constraints.Infinity) + gap + actionWidth
        val stacked = width < ClientAppBannerMinimumWordsWidth.roundToPx() + gap + actionWidth
        if (stacked) {
            val wordsPlaceable = wordsMeasurable.measure(Constraints.fixedWidth(width))
            val actionPlaceable = actionMeasurable.measure(Constraints.fixedWidth(width))
            layout(width, wordsPlaceable.height + gap + actionPlaceable.height) {
                wordsPlaceable.placeRelative(0, 0)
                actionPlaceable.placeRelative(0, wordsPlaceable.height + gap)
            }
        } else {
            val actionPlaceable = actionMeasurable.measure(Constraints(maxWidth = actionWidth))
            val wordsPlaceable = wordsMeasurable.measure(Constraints.fixedWidth((width - gap - actionPlaceable.width).coerceAtLeast(0)))
            val height = maxOf(wordsPlaceable.height, actionPlaceable.height)
            layout(width, height) {
                wordsPlaceable.placeRelative(0, (height - wordsPlaceable.height) / 2)
                actionPlaceable.placeRelative(width - actionPlaceable.width, (height - actionPlaceable.height) / 2)
            }
        }
    }
}
