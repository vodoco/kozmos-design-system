package com.kozmos.components.label

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosLabel(
    text: String = "Label",
    modifier: Modifier = Modifier,
    required: Boolean = false,
    optionalText: String? = null,
    enabled: Boolean = true
) {
    Row(modifier = modifier) {
        Text(
            text = text,
            color = if (enabled) {
                KozmosThemeTokens.primitivesColorsForeground100
            } else {
                KozmosThemeTokens.primitivesColorsForeground500
            },
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Medium)
        )

        if (required) {
            Spacer(modifier = Modifier.width(2.dp))
            Text(
                text = "*",
                color = KozmosThemeTokens.primitivesColorsEmotionalDanger600,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold)
            )
        } else if (optionalText != null) {
            Spacer(modifier = Modifier.width(4.dp))
            // Muted; disabled, the disabled label's colour, never darker than it.
            Text(
                text = optionalText,
                color = if (enabled) {
                    KozmosThemeTokens.primitivesColorsForeground400
                } else {
                    KozmosThemeTokens.primitivesColorsForeground500
                },
                style = MaterialTheme.typography.labelSmall
            )
        }
    }
}
