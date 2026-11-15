package com.kozmos.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * A control's label and, under it, its description (GAP-162): the label in
 * the control's own colour, the description smaller and muted, React's
 * `text-sm text-muted-foreground`. Both are plain texts, so the control's
 * merged node reads the label, then the description. With a description the
 * texts start 2dp down, centring the label's 20sp line on a 24dp control.
 */
@Composable
internal fun KozmosControlText(
    label: String?,
    labelColor: Color,
    description: String?,
    labelStyle: TextStyle = MaterialTheme.typography.bodyMedium,
    topInset: Dp = KozmosDimensions.primitivesLayoutSpacing25
) {
    if (description == null) {
        if (label != null) Text(text = label, style = labelStyle, color = labelColor)
        return
    }
    Column(
        modifier = Modifier.padding(top = topInset),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
    ) {
        if (label != null) Text(text = label, style = labelStyle, color = labelColor)
        Text(
            text = description,
            style = MaterialTheme.typography.bodySmall,
            color = KozmosThemeTokens.primitivesColorsForeground400
        )
    }
}
