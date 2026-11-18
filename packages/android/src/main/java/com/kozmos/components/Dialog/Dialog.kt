package com.kozmos.components.dialog

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonSize
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/** How large a dialog is, as React's `DialogContent size`. */
enum class KozmosDialogSize {
    /** At most 512 wide, as tall as its content. */
    Default,

    /**
     * The window less 16 on each side (decision 202, GAP-259), for media
     * shown large: the header keeps its height and the body takes the rest.
     */
    Full
}

/**
 * Media above a dialog's title, an illustration or a photo (decision 195,
 * GAP-214), as React's `DialogHeader media`.
 *
 * @param label its name, read as an image; null, the media is decorative and
 *   TalkBack skips it.
 * @param bleed true reaches the dialog's edges and top corners, past its 24
 *   of padding, clipped by the dialog's corner; false keeps it inside. The
 *   close button stays in the dialog's top corner, on its own surface, over
 *   the media.
 */
data class KozmosDialogMedia(
    val label: String? = null,
    val bleed: Boolean = false,
    val content: @Composable () -> Unit
)

data class KozmosDialogContent(
    val title: String,
    val description: String? = null,
    val bodyText: String? = null,
    val primaryActionText: String? = null,
    val secondaryActionText: String? = null,
    val showCloseButton: Boolean = true
)

@Composable
fun KozmosDialog(
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    // Full fills the window less 16 each side (decision 202). Last, so a
    // call by position still compiles.
    size: KozmosDialogSize = KozmosDialogSize.Default,
    content: @Composable () -> Unit
) {
    if (size == KozmosDialogSize.Full) {
        Dialog(
            onDismissRequest = onDismissRequest,
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Surface(
                shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer),
                color = KozmosThemeTokens.semanticsSurface0,
                border = BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle),
                shadowElevation = 20.dp,
                modifier = Modifier
                    .padding(KozmosDimensions.primitivesLayoutSpacing200)
                    .then(modifier)
                    .fillMaxSize()
            ) {
                Box(modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing300)) {
                    content()
                }
            }
        }
        return
    }
    Dialog(onDismissRequest = onDismissRequest) {
        Surface(
            shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer),
            color = KozmosThemeTokens.semanticsSurface0,
            border = BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle),
            shadowElevation = 20.dp,
            modifier = modifier
        ) {
            Box(modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing300)) {
                content()
            }
        }
    }
}

@Composable
fun KozmosDialog(
    onDismissRequest: () -> Unit,
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    bodyText: String? = null,
    primaryActionText: String? = null,
    secondaryActionText: String? = null,
    showCloseButton: Boolean = true,
    onPrimaryAction: (() -> Unit)? = null,
    onSecondaryAction: (() -> Unit)? = null,
    size: KozmosDialogSize = KozmosDialogSize.Default,
    media: KozmosDialogMedia? = null
) {
    KozmosDialog(
        onDismissRequest = onDismissRequest,
        size = size,
        media = media,
        content = KozmosDialogContent(
            title = title,
            description = description,
            bodyText = bodyText,
            primaryActionText = primaryActionText,
            secondaryActionText = secondaryActionText,
            showCloseButton = showCloseButton
        ),
        modifier = modifier,
        onPrimaryAction = onPrimaryAction,
        onSecondaryAction = onSecondaryAction
    )
}

@Composable
fun KozmosDialog(
    onDismissRequest: () -> Unit,
    content: KozmosDialogContent,
    modifier: Modifier = Modifier,
    onPrimaryAction: (() -> Unit)? = null,
    onSecondaryAction: (() -> Unit)? = null,
    size: KozmosDialogSize = KozmosDialogSize.Default,
    media: KozmosDialogMedia? = null
) {
    Dialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        KozmosDialogPanel(
            onDismissRequest = onDismissRequest,
            content = content,
            modifier = modifier,
            onPrimaryAction = onPrimaryAction,
            onSecondaryAction = onSecondaryAction,
            size = size,
            media = media
        )
    }
}

/**
 * The dialog's surface, as the Dialog window holds it: drawn apart from the
 * window so its layout can be read on its own.
 */
@Composable
internal fun KozmosDialogPanel(
    onDismissRequest: () -> Unit,
    content: KozmosDialogContent,
    modifier: Modifier = Modifier,
    onPrimaryAction: (() -> Unit)? = null,
    onSecondaryAction: (() -> Unit)? = null,
    size: KozmosDialogSize = KozmosDialogSize.Default,
    media: KozmosDialogMedia? = null
) {
    val full = size == KozmosDialogSize.Full
    val padding = KozmosDimensions.primitivesLayoutSpacing300
    Surface(
        modifier = if (full) {
            // The window less 16 each side (decision 202).
            Modifier.padding(KozmosDimensions.primitivesLayoutSpacing200).then(modifier).fillMaxSize()
        } else {
            modifier.widthIn(min = 280.dp, max = 512.dp)
        },
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer),
        color = KozmosThemeTokens.semanticsSurface0,
        border = BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle),
        shadowElevation = 20.dp
    ) {
        Box(modifier = if (full) Modifier.fillMaxSize() else Modifier) {
            Column(
                modifier = (if (full) Modifier.fillMaxSize() else Modifier).padding(padding)
            ) {
                media?.let { KozmosDialogMediaBox(it, padding) }
                Row(verticalAlignment = Alignment.Top) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = content.title,
                            color = KozmosThemeTokens.primitivesColorsForeground100
                        )

                        content.description?.let { description ->
                            Spacer(modifier = Modifier.defaultMinSize(minHeight = KozmosDimensions.primitivesLayoutSpacing100))
                            Text(
                                text = description,
                                color = KozmosThemeTokens.primitivesColorsForeground400
                            )
                        }
                    }

                    if (content.showCloseButton && media == null) {
                        KozmosDialogCloseButton(onDismissRequest)
                    }
                }

                content.bodyText?.let { bodyText ->
                    Spacer(modifier = Modifier.defaultMinSize(minHeight = KozmosDimensions.primitivesLayoutSpacing300))
                    Text(
                        text = bodyText,
                        color = KozmosThemeTokens.primitivesColorsForeground100
                    )
                }
                if (full) {
                    // The body takes what the header and actions leave.
                    Spacer(modifier = Modifier.weight(1f))
                }

                if (
                    (content.primaryActionText != null && onPrimaryAction != null) ||
                    (content.secondaryActionText != null && onSecondaryAction != null)
                ) {
                    Spacer(modifier = Modifier.defaultMinSize(minHeight = KozmosDimensions.primitivesLayoutSpacing300))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Spacer(modifier = Modifier.weight(1f))

                        if (content.secondaryActionText != null && onSecondaryAction != null) {
                            KozmosButton(
                                modifier = Modifier.defaultMinSize(minHeight = 44.dp),
                                onClick = onSecondaryAction,
                                variant = KozmosButtonVariant.Outline
                            ) {
                                Text(content.secondaryActionText)
                            }
                        }

                        if (content.primaryActionText != null && onPrimaryAction != null) {
                            Spacer(modifier = Modifier.defaultMinSize(minWidth = KozmosDimensions.primitivesLayoutSpacing150))
                            KozmosButton(
                                modifier = Modifier.defaultMinSize(minHeight = 44.dp),
                                onClick = onPrimaryAction,
                                size = KozmosButtonSize.Lg
                            ) {
                                Text(content.primaryActionText)
                            }
                        }
                    }
                }
            }
            if (content.showCloseButton && media != null) {
                // Over media the close keeps the dialog's top corner, 24 in,
                // on a surface of its own so it reads over any picture.
                Surface(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(padding),
                    shape = CircleShape,
                    color = KozmosThemeTokens.semanticsSurface0,
                    border = BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle)
                ) {
                    KozmosDialogCloseButton(onDismissRequest)
                }
            }
        }
    }
}

@Composable
private fun KozmosDialogCloseButton(onDismissRequest: () -> Unit) {
    IconButton(
        modifier = Modifier.defaultMinSize(minWidth = 44.dp, minHeight = 44.dp),
        onClick = onDismissRequest
    ) {
        Icon(
            imageVector = Icons.Default.Close,
            contentDescription = "Close dialog",
            tint = KozmosThemeTokens.primitivesColorsForeground500
        )
    }
}

/**
 * The media above the title, 16 over it: inside the padding, or bleeding past
 * it to the dialog's edges and top corners, where the Surface's shape clips
 * it. Named, it is one image to TalkBack; unnamed, it is hidden.
 */
@Composable
private fun KozmosDialogMediaBox(media: KozmosDialogMedia, padding: Dp) {
    val bleed = if (media.bleed) padding else 0.dp
    Box(
        modifier = Modifier
            .layout { measurable, constraints ->
                // Wider than the padded column by the padding each side, and
                // drawn from the Surface's own edge and top.
                val extra = (bleed * 2).roundToPx()
                val placeable = measurable.measure(
                    constraints.copy(
                        minWidth = constraints.minWidth + extra,
                        maxWidth = constraints.maxWidth + extra
                    )
                )
                val top = bleed.roundToPx()
                layout(placeable.width - extra, placeable.height - top) {
                    placeable.place(-bleed.roundToPx(), -top)
                }
            }
            .fillMaxWidth()
            .then(
                if (media.label != null) {
                    Modifier.clearAndSetSemantics {
                        contentDescription = media.label
                        role = Role.Image
                    }
                } else {
                    Modifier.clearAndSetSemantics { }
                }
            )
    ) {
        media.content()
    }
    Spacer(modifier = Modifier.defaultMinSize(minHeight = KozmosDimensions.primitivesLayoutSpacing200))
}
