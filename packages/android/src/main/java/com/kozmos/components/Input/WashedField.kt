package com.kozmos.components.input

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * A field washed rather than outlined, as React draws the route points and the
 * feedback box: no edge, black at 5 % on light and white at 10 % on dark,
 * doubled while focused, the control radius, and the ring role's 2 dp outline
 * marking focus. Single-line it is 40 high, 12 in; [multiline] makes it a text
 * area, 80 high at least, 8 and 12 in, as React's is.
 */
@Composable
internal fun KozmosWashedField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    multiline: Boolean = false,
    label: String? = null
) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val wash = (if (KozmosThemeTokens.isDark) 0.10f else 0.05f) * (if (focused) 2f else 1f)
    val ring = KozmosThemeTokens.primitivesColorsTheme600
    val textStyle = MaterialTheme.typography.bodyMedium
    val placeholderColor = KozmosThemeTokens.primitivesColorsForeground400
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        singleLine = !multiline,
        textStyle = textStyle.copy(color = KozmosThemeTokens.primitivesColorsForeground0),
        cursorBrush = SolidColor(ring),
        interactionSource = interaction,
        modifier = modifier
            .then(if (multiline) Modifier.heightIn(min = 80.dp) else Modifier.height(40.dp))
            .background(KozmosThemeTokens.primitivesColorsForeground0.copy(alpha = wash), shape)
            .then(if (focused) Modifier.border(2.dp, ring, shape) else Modifier)
            .semantics { contentDescription = label ?: placeholder },
        decorationBox = { inner ->
            Box(
                contentAlignment = if (multiline) Alignment.TopStart else Alignment.CenterStart,
                modifier = Modifier
                    .then(if (multiline) Modifier else Modifier.fillMaxSize())
                    .padding(horizontal = 12.dp, vertical = if (multiline) 8.dp else 0.dp)
            ) {
                if (value.isEmpty()) {
                    Text(placeholder, style = textStyle, color = placeholderColor, maxLines = if (multiline) 3 else 1)
                }
                inner()
            }
        }
    )
}
