package com.kozmos.components.searchbar

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.providers.LocalKozmosAnalytics
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.ImeAction

/**
 * @param trailing What sits at the end of the search row — the assistant's
 * button, in the SDK's sheet. The row is the component's, not the caller's:
 * the field fills its width, so a pair composed by hand ends up on two lines
 * the moment the row is narrow, and on the web it did exactly that. Nothing a
 * caller passes here can put them apart.
 */
@Composable
fun KozmosSearchBar(
    value: String,
    onValueChange: (String) -> Unit,
    onClear: (() -> Unit)? = null,
    placeholder: String = "Search...",
    modifier: Modifier = Modifier,
    trailing: (@Composable () -> Unit)? = null
) {
    if (trailing != null) {
        Row(
            modifier = modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // The field takes what is left; what follows keeps its own width.
            KozmosSearchBar(
                value = value,
                onValueChange = onValueChange,
                onClear = onClear,
                placeholder = placeholder,
                modifier = Modifier.weight(1f)
            )
            trailing()
        }
        return
    }

    val trackEvent = LocalKozmosAnalytics.current

    // 44 tall: a control's height, the prototype's field. A basic field, since
    // Material's outlined one will not go below 56.
    Surface(
        modifier = modifier.fillMaxWidth(),
        shadowElevation = 8.dp,
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
        color = KozmosThemeTokens.primitivesColorsBackground0
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp)
                .padding(start = KozmosDimensions.primitivesLayoutSpacing150),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
        ) {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = null,
                tint = KozmosThemeTokens.primitivesColorsForeground500,
                modifier = Modifier.size(18.dp)
            )
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyLarge.copy(color = KozmosThemeTokens.primitivesColorsForeground100),
                cursorBrush = SolidColor(KozmosThemeTokens.primitivesColorsTheme500),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(
                    onSearch = {
                        trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(
                            component = "SearchBar",
                            eventName = "search_initiated",
                            properties = mapOf("query" to value)
                        ))
                    }
                ),
                modifier = Modifier
                    .weight(1f)
                    .semantics { contentDescription = placeholder },
                decorationBox = { inner ->
                    Box(contentAlignment = Alignment.CenterStart) {
                        if (value.isEmpty()) {
                            Text(placeholder, style = MaterialTheme.typography.bodyLarge, color = KozmosThemeTokens.primitivesColorsForeground500)
                        }
                        inner()
                    }
                }
            )
            if (value.isNotEmpty() && onClear != null) {
                // A 24 grey circle to see; the 44 button around it to hit.
                IconButton(
                    onClick = {
                        trackEvent(com.kozmos.providers.KozmosAnalyticsEvent("SearchBar", "search_cleared"))
                        onClear()
                    },
                    modifier = Modifier.size(44.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(KozmosDimensions.primitivesLayoutSizing300)
                            .clip(CircleShape)
                            .background(KozmosThemeTokens.primitivesColorsBackground300),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Clear search",
                            tint = KozmosThemeTokens.primitivesColorsForeground500,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            } else {
                Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing150))
            }
        }
    }
}
