package com.kozmos.components.dialog

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonSize
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

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
    content: @Composable () -> Unit
) {
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
    onSecondaryAction: (() -> Unit)? = null
) {
    KozmosDialog(
        onDismissRequest = onDismissRequest,
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
    onSecondaryAction: (() -> Unit)? = null
) {
    Dialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = modifier.widthIn(min = 280.dp, max = 512.dp),
            shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer),
            color = KozmosThemeTokens.semanticsSurface0,
            border = BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle),
            shadowElevation = 20.dp
        ) {
            Column(
                modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing300)
            ) {
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

                    if (content.showCloseButton) {
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
                }

                content.bodyText?.let { bodyText ->
                    Spacer(modifier = Modifier.defaultMinSize(minHeight = KozmosDimensions.primitivesLayoutSpacing300))
                    Text(
                        text = bodyText,
                        color = KozmosThemeTokens.primitivesColorsForeground100
                    )
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
        }
    }
}
