package com.kozmos.components.toast

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.SnackbarData
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * `toast()`'s tones, as React's (GAP-167): Notice's (Info, Warning,
 * Critical) with Success, and Neutral, the default, which draws no icon. A
 * toast keeps its surface, the background, whatever its tone: the tone is an
 * icon at the start, in the tone's text colour, which holds 3:1 on the
 * background in both themes. It says nothing to TalkBack: `live` does that,
 * which `toast()` sets from the tone.
 */
enum class KozmosToastTone { Neutral, Success, Info, Warning, Critical }

data class KozmosToastContent(
    val title: String,
    val description: String? = null,
    val actionText: String? = null,
    val showCloseButton: Boolean = true,
    /**
     * The close button's spoken name, as React's ToastClose `aria-label`.
     * English by default; a product that translates passes its own.
     */
    val closeLabel: String = "Dismiss notification",
    /** Its tone: an icon at the start, or none for [KozmosToastTone.Neutral], the default. */
    val tone: KozmosToastTone = KozmosToastTone.Neutral
)

@Composable
fun KozmosToast(
    hostState: SnackbarHostState,
    modifier: Modifier = Modifier,
    /**
     * The spoken name of each snackbar's close button. English by default; a
     * product that translates passes its own.
     */
    closeLabel: String = "Dismiss notification"
) {
    SnackbarHost(
        hostState = hostState,
        modifier = modifier
    ) { data ->
        KozmosSnackbarToast(data, closeLabel)
    }
}

@Composable
fun KozmosToast(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    actionText: String? = null,
    showCloseButton: Boolean = true,
    onAction: (() -> Unit)? = null,
    onDismiss: (() -> Unit)? = null,
    /**
     * The close button's spoken name. English by default; a product that
     * translates passes its own. Last, so a call by position still compiles.
     */
    closeLabel: String = "Dismiss notification",
    /** Its tone, as `toast()`'s: an icon at the start, or none for Neutral, the default. */
    tone: KozmosToastTone = KozmosToastTone.Neutral
) {
    KozmosToast(
        content = KozmosToastContent(
            title = title,
            description = description,
            actionText = actionText,
            showCloseButton = showCloseButton,
            closeLabel = closeLabel,
            tone = tone
        ),
        modifier = modifier,
        onAction = onAction,
        onDismiss = onDismiss
    )
}

@Composable
fun KozmosToast(
    content: KozmosToastContent,
    modifier: Modifier = Modifier,
    onAction: (() -> Unit)? = null,
    onDismiss: (() -> Unit)? = null
) {
    // Laid out in place, the toast announces itself: an assertive live
    // region, as React's default (foreground) Radix toast. TalkBack said
    // nothing when it appeared until 2026-10-21.
    KozmosToastSurface(content, modifier.semantics { liveRegion = LiveRegionMode.Assertive }, onAction, onDismiss)
}

/** Each tone's icon, the web's glyph for it, and the tone's text colour. */
@Composable
private fun toneIcon(tone: KozmosToastTone): Pair<ImageVector, Color>? = when (tone) {
    KozmosToastTone.Neutral -> null
    KozmosToastTone.Success -> Icons.Default.Check to KozmosThemeTokens.semanticsEmotionSuccessText
    KozmosToastTone.Info -> Icons.Outlined.Info to KozmosThemeTokens.semanticsEmotionInformativeText
    KozmosToastTone.Warning -> Icons.Outlined.WarningAmber to KozmosThemeTokens.semanticsEmotionAlertText
    KozmosToastTone.Critical -> Icons.Outlined.ErrorOutline to KozmosThemeTokens.semanticsEmotionDangerText
}

/**
 * The toast as it is drawn. Through a host, Material's `SnackbarHost`
 * already makes each toast a live region, and `KozmosToaster` makes each of
 * its own one, so the surface adds none there.
 */
@Composable
internal fun KozmosToastSurface(
    content: KozmosToastContent,
    modifier: Modifier,
    onAction: (() -> Unit)?,
    onDismiss: (() -> Unit)?
) {
    Surface(
        modifier = modifier.widthIn(min = 320.dp, max = 420.dp),
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
        color = KozmosThemeTokens.primitivesColorsBackground0,
        shadowElevation = 8.dp,
        border = BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle)
    ) {
        Row(
            modifier = Modifier.padding(
                start = KozmosDimensions.primitivesLayoutSpacing300,
                top = KozmosDimensions.primitivesLayoutSpacing200,
                end = if (content.showCloseButton) {
                    KozmosDimensions.primitivesLayoutSpacing100
                } else {
                    KozmosDimensions.primitivesLayoutSpacing300
                },
                bottom = KozmosDimensions.primitivesLayoutSpacing200
            ),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // In the start padding's place, 16 from the words, as React's;
            // decoration, so TalkBack hears only the words.
            toneIcon(content.tone)?.let { (glyph, ink) ->
                Icon(
                    imageVector = glyph,
                    contentDescription = null,
                    tint = ink,
                    modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing200)
                )
                Spacer(modifier = Modifier.size(KozmosDimensions.primitivesLayoutSpacing200))
            }
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(end = KozmosDimensions.primitivesLayoutSpacing200)
            ) {
                Text(
                    text = content.title,
                    style = MaterialTheme.typography.titleSmall,
                    color = KozmosThemeTokens.primitivesColorsForeground100
                )

                content.description?.let { description ->
                    Spacer(modifier = Modifier.size(KozmosDimensions.primitivesLayoutSpacing50))
                    Text(
                        text = description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = KozmosThemeTokens.primitivesColorsForeground400
                    )
                }
            }

            if (content.actionText != null && onAction != null) {
                TextButton(
                    modifier = Modifier.defaultMinSize(minHeight = 44.dp),
                    onClick = onAction,
                    colors = ButtonDefaults.textButtonColors(
                        // Theme-coloured text on a surface: theme/600 (decision 59).
                        contentColor = KozmosThemeTokens.primitivesColorsTheme600
                    )
                ) {
                    Text(content.actionText)
                }
            }

            if (content.showCloseButton && onDismiss != null) {
                IconButton(
                    modifier = Modifier.size(44.dp),
                    onClick = onDismiss
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = content.closeLabel,
                        tint = KozmosThemeTokens.primitivesColorsForeground500
                    )
                }
            }
        }
    }
}

@Composable
private fun KozmosSnackbarToast(data: SnackbarData, closeLabel: String) {
    val visuals = data.visuals
    KozmosToastSurface(
        modifier = Modifier,
        content = KozmosToastContent(
            title = visuals.message,
            actionText = visuals.actionLabel,
            showCloseButton = visuals.withDismissAction,
            closeLabel = closeLabel
        ),
        onAction = if (visuals.actionLabel == null) null else data::performAction,
        onDismiss = if (visuals.withDismissAction) data::dismiss else null
    )
}
