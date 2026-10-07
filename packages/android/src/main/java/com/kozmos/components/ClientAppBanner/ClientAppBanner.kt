package com.kozmos.components.clientappbanner

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.traversalIndex
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.compose.AsyncImagePainter
import kotlin.math.roundToInt
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

/**
 * What the words keep beside the icon before the action shares their line:
 * the web's 10rem, ten of the body text's 16sp. Counted in the body text's
 * size, so it grows with the font scale as the words do, and as 10rem grows
 * with the browser's text: larger text puts the action under the words
 * sooner. Not 160.sp: Android scales large sizes less than small ones, and
 * 160sp barely grows at twice the font size, where 16sp nearly doubles.
 */
internal val ClientAppBannerWordsEm = 16.sp
internal const val ClientAppBannerMinimumWordsEms = 10

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
 * ten of the body text's 16sp beside the icon, the web's 10rem — the action goes under the icon and
 * the words and spans them both, so the words keep the width beside the icon.
 * The icon stays 48, and dismiss Compose's 48 target at the top end, 4 from
 * the edges, at every font scale.
 *
 * TalkBack reads it as one group: the promotion, the name and the
 * description, then the action, then dismiss. The icon says nothing over the
 * name. It is not a pane: a pane's title is announced as it appears, and the
 * banner announces nothing. It moves no focus and never removes itself:
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
            // One group TalkBack reads together, before what follows it. No
            // paneTitle: a node that gains one sends "pane appeared" with it,
            // and TalkBack would announce the banner as it shows.
            .semantics { isTraversalGroup = true },
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer),
        color = KozmosSurfaceDefaults.tint(style),
        contentColor = KozmosThemeTokens.primitivesColorsForeground100,
        border = KozmosSurfaceDefaults.border(style),
        shadowElevation = KozmosShadows.semanticsElevationFloating
    ) {
        // What the banner holds is drawn on its surface: its muted text reads it.
        CompositionLocalProvider(LocalKozmosSurfaceStyle provides style) {
            Box(Modifier.fillMaxWidth()) {
                ClientAppBannerBody(
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
                    icon = { ClientAppBannerIcon(appIconUrl, clientAppBannerInitial(appName)) },
                    words = { ClientAppBannerWords(promotionText, appName, description) },
                    action = {
                        // Read after the words, wherever it is placed.
                        KozmosButton(onClick = onAction, modifier = Modifier.semantics { traversalIndex = 1f }) {
                            Text(actionLabel)
                        }
                    }
                )
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

/** The app's icon once it has loaded; until then, or without one, its initial on the muted fill. */
@Composable
private fun ClientAppBannerIcon(url: String?, initial: String) {
    var loaded by remember(url) { mutableStateOf(false) }
    ClientAppBannerIconFace(initial = initial, loaded = loaded) {
        if (!url.isNullOrEmpty()) {
            AsyncImage(
                model = url,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                onState = { state -> loaded = state is AsyncImagePainter.State.Success },
                modifier = Modifier.matchParentSize()
            )
        }
    }
}

/**
 * What the icon draws: 48, the Control corner, the subtle edge, and in it the
 * image, cropped to the square. Until it has [loaded], the initial on the
 * muted fill stands in for it; once it has, nothing is drawn under it, so a
 * transparent icon shows the banner's surface, as on the web, where the
 * fallback goes once the image loads. Nothing of it is read: it is
 * decoration beside the app's name.
 */
@Composable
internal fun ClientAppBannerIconFace(initial: String, loaded: Boolean, image: @Composable BoxScope.() -> Unit) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    Box(
        modifier = Modifier
            .size(KozmosDimensions.primitivesLayoutSizing600)
            .clip(shape)
            .then(if (loaded) Modifier else Modifier.background(KozmosThemeTokens.primitivesColorsBackground100, shape))
            .border(1.dp, KozmosThemeTokens.semanticsBorderSubtle, shape)
            .clearAndSetSemantics {},
        contentAlignment = Alignment.Center
    ) {
        if (!loaded) {
            Text(
                initial,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = KozmosThemeTokens.primitivesColorsForeground100
            )
        }
        image()
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
 * The icon, the words and the action: side by side while the words keep
 * [ClientAppBannerMinimumWordsEms] of [ClientAppBannerWordsEm] beside the icon, the action at its own
 * width, the icon and the words centred on the line as one and the action on
 * its own; past that, the icon and the words on the first line and the action
 * under them both, as wide as the line, as the web wraps it. Placed relative
 * to the layout direction, so right to left mirrors it.
 */
@Composable
private fun ClientAppBannerBody(
    modifier: Modifier,
    icon: @Composable () -> Unit,
    words: @Composable () -> Unit,
    action: @Composable () -> Unit
) {
    Layout(contents = listOf(icon, words, action), modifier = modifier) { (iconMeasurables, wordsMeasurables, actionMeasurables), constraints ->
        val wordsMeasurable = wordsMeasurables.single()
        val actionMeasurable = actionMeasurables.single()
        val gap = KozmosDimensions.primitivesLayoutSpacing150.roundToPx()
        val iconPlaceable = iconMeasurables.single().measure(Constraints())
        // Where the words start: after the icon and the 12 beside it.
        val lead = iconPlaceable.width + gap
        val actionWidth = actionMeasurable.maxIntrinsicWidth(Constraints.Infinity)
        val width = if (constraints.hasBoundedWidth) constraints.maxWidth
        else lead + wordsMeasurable.maxIntrinsicWidth(Constraints.Infinity) + gap + actionWidth
        val minimumWords = (ClientAppBannerWordsEm.toPx() * ClientAppBannerMinimumWordsEms).roundToInt()
        val stacked = width < lead + minimumWords + gap + actionWidth
        if (stacked) {
            val wordsPlaceable = wordsMeasurable.measure(Constraints.fixedWidth((width - lead).coerceAtLeast(0)))
            val actionPlaceable = actionMeasurable.measure(Constraints.fixedWidth(width))
            val top = maxOf(iconPlaceable.height, wordsPlaceable.height)
            layout(width, top + gap + actionPlaceable.height) {
                iconPlaceable.placeRelative(0, 0)
                wordsPlaceable.placeRelative(lead, 0)
                actionPlaceable.placeRelative(0, top + gap)
            }
        } else {
            val actionPlaceable = actionMeasurable.measure(Constraints(maxWidth = actionWidth))
            val wordsPlaceable = wordsMeasurable.measure(
                Constraints.fixedWidth((width - lead - gap - actionPlaceable.width).coerceAtLeast(0))
            )
            val head = maxOf(iconPlaceable.height, wordsPlaceable.height)
            val height = maxOf(head, actionPlaceable.height)
            layout(width, height) {
                iconPlaceable.placeRelative(0, (height - head) / 2)
                wordsPlaceable.placeRelative(lead, (height - head) / 2)
                actionPlaceable.placeRelative(width - actionPlaceable.width, (height - actionPlaceable.height) / 2)
            }
        }
    }
}
