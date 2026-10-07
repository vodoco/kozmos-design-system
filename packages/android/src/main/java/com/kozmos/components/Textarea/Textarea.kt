package com.kozmos.components.textarea

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosTextarea(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "",
    minLines: Int = 3,
    maxLines: Int = 5,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder) },
        minLines = minLines,
        maxLines = maxLines,
        modifier = modifier.fillMaxWidth(),
        colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
            focusedBorderColor = KozmosThemeTokens.primitivesColorsTheme600,
            unfocusedBorderColor = KozmosThemeTokens.semanticsBorderInput,
            cursorColor = KozmosThemeTokens.primitivesColorsTheme600,
            focusedLabelColor = KozmosThemeTokens.primitivesColorsTheme600
        )
    )
}
