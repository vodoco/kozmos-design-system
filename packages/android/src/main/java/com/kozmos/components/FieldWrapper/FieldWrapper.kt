package com.kozmos.components.fieldwrapper

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosFieldWrapper(
    modifier: Modifier = Modifier,
    label: String? = null,
    description: String? = null,
    optionalText: String? = null,
    required: Boolean = false,
    hideLabel: Boolean = false,
    status: KozmosInputStatus = KozmosInputStatus.Default,
    error: Boolean = false,
    helperText: String? = null,
    errorMessage: String? = null,
    content: @Composable () -> Unit
) {
    val effectiveStatus = if (error) KozmosInputStatus.Error else status
    val supportingText = errorMessage ?: helperText
    val statusColor = fieldStatusColor(effectiveStatus)
    val labelColor = statusColor ?: MaterialTheme.colorScheme.onSurface
    val metaColor = KozmosThemeTokens.primitivesColorsForeground400
    val optionalDisplayText = optionalText?.takeUnless { required || it.isBlank() }
    val showLabelRow = !hideLabel && (!label.isNullOrBlank() || optionalDisplayText != null)

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
    ) {
        if (showLabelRow) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (!label.isNullOrBlank()) {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.bodyMedium,
                            color = labelColor
                        )
                    }
                    if (required) {
                        Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing25))
                        Text(
                            text = "*",
                            style = MaterialTheme.typography.bodyMedium,
                            color = KozmosThemeTokens.primitivesColorsEmotionalDanger600
                        )
                    }
                }

                if (optionalDisplayText != null) {
                    Text(
                        text = optionalDisplayText,
                        style = MaterialTheme.typography.labelSmall,
                        color = metaColor
                    )
                }
            }
        }

        if (!description.isNullOrBlank()) {
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = metaColor
            )
        }

        content()

        if (!supportingText.isNullOrBlank()) {
            Text(
                text = supportingText,
                style = MaterialTheme.typography.bodyMedium,
                color = statusColor ?: metaColor
            )
        }
    }
}

@Composable
fun KozmosFormField(
    modifier: Modifier = Modifier,
    label: String? = null,
    description: String? = null,
    optionalText: String? = null,
    required: Boolean = false,
    status: KozmosInputStatus = KozmosInputStatus.Default,
    helperText: String? = null,
    content: @Composable () -> Unit
) {
    KozmosFieldWrapper(
        modifier = modifier,
        label = label,
        description = description,
        optionalText = optionalText,
        required = required,
        status = status,
        helperText = helperText,
        content = content
    )
}

@Composable
private fun fieldStatusColor(status: KozmosInputStatus): Color? {
    return when (status) {
        KozmosInputStatus.Error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
        KozmosInputStatus.Warning -> KozmosThemeTokens.primitivesColorsEmotionalAlert600
        KozmosInputStatus.Success -> KozmosThemeTokens.primitivesColorsEmotionalSuccess600
        KozmosInputStatus.Default -> null
    }
}
