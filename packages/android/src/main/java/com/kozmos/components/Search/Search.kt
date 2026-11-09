package com.kozmos.components.search

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.unit.dp
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import com.kozmos.tokens.KozmosThemeTokens

/**
 * A search field. With [clearable], a clear button at its end while it holds
 * text and can be edited (GAP-161, decision 132): it empties the field through
 * [onValueChange], calls [onClear], reports `search_cleared` with no query,
 * and hands focus back to the field. Escape in a field holding text does the
 * same; in an empty one it is left to the screen, so a sheet can close.
 * [clearLabel] is the button's name, in the product's language.
 */
@Composable
fun KozmosSearch(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "Search",
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    clearable: Boolean = false,
    clearLabel: String = "Clear search",
    onClear: (() -> Unit)? = null
) {
    val trackEvent = LocalKozmosAnalytics.current
    val focus = remember { FocusRequester() }
    val canClear = clearable && value.isNotEmpty() && enabled && !readOnly
    val clear = {
        onValueChange("")
        onClear?.invoke()
        trackEvent(KozmosAnalyticsEvent(component = "Search", eventName = "search_cleared"))
        // The button leaves with the text: focus goes back to the field, not to nothing.
        focus.requestFocus()
    }
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder) },
        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
        trailingIcon = if (canClear) {
            {
                IconButton(
                    onClick = clear,
                    modifier = Modifier.size(48.dp),
                    colors = IconButtonDefaults.iconButtonColors(contentColor = KozmosThemeTokens.primitivesColorsForeground400)
                ) {
                    Icon(Icons.Default.Close, contentDescription = clearLabel, modifier = Modifier.size(16.dp))
                }
            }
        } else {
            null
        },
        enabled = enabled,
        readOnly = readOnly,
        modifier = modifier
            .fillMaxWidth()
            .focusRequester(focus)
            .onPreviewKeyEvent { event ->
                if (event.key == Key.Escape && canClear) {
                    if (event.type == KeyEventType.KeyDown) clear()
                    true
                } else {
                    false
                }
            },
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
        singleLine = true,
        colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
            focusedBorderColor = KozmosThemeTokens.primitivesColorsTheme600,
            unfocusedBorderColor = KozmosThemeTokens.semanticsBorderInput,
            cursorColor = KozmosThemeTokens.primitivesColorsTheme600,
            focusedLeadingIconColor = KozmosThemeTokens.primitivesColorsForeground400,
            unfocusedLeadingIconColor = KozmosThemeTokens.primitivesColorsForeground400
        )
    )
}
