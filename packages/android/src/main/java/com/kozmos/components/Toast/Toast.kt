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
import androidx.compose.material.icons.filled.Close
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
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

data class KozmosToastContent(
    val title: String,
    val description: String? = null,
    val actionText: String? = null,
    val showCloseButton: Boolean = true
)

@Composable
fun KozmosToast(
    hostState: SnackbarHostState,
    modifier: Modifier = Modifier
) {
    SnackbarHost(
        hostState = hostState,
        modifier = modifier
    ) { data ->
        KozmosSnackbarToast(data)
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
    onDismiss: (() -> Unit)? = null
) {
    KozmosToast(
        content = KozmosToastContent(
            title = title,
            description = description,
            actionText = actionText,
            showCloseButton = showCloseButton
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
                        color = KozmosThemeTokens.primitivesColorsForeground500
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
                        contentDescription = "Dismiss notification",
                        tint = KozmosThemeTokens.primitivesColorsForeground500
                    )
                }
            }
        }
    }
}

@Composable
private fun KozmosSnackbarToast(data: SnackbarData) {
    val visuals = data.visuals
    KozmosToast(
        content = KozmosToastContent(
            title = visuals.message,
            actionText = visuals.actionLabel,
            showCloseButton = visuals.withDismissAction
        ),
        onAction = if (visuals.actionLabel == null) null else data::performAction,
        onDismiss = if (visuals.withDismissAction) data::dismiss else null
    )
}
