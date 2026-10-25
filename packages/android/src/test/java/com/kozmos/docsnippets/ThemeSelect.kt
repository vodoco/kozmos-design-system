// Select.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.select.KozmosSelect
import com.kozmos.components.select.KozmosSelectItem
import com.kozmos.components.select.KozmosSelectTrigger

// KozmosSelectTrigger is the closed field: the choice, or the placeholder
// until there is one, beside a caret. It anchors the menu, which
// KozmosSelect draws. An item hands on its value, then asks for the menu to
// close.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ThemeSelect(theme: String, onThemeChange: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val themes = mapOf("light" to "Light", "dark" to "Dark", "system" to "System")
    KozmosSelect(
        expanded = expanded,
        onExpandedChange = { expanded = it },
        trigger = {
            KozmosSelectTrigger(value = themes[theme], placeholder = "Theme")
        }
    ) {
        themes.forEach { (value, label) ->
            KozmosSelectItem(
                value = value,
                label = label,
                onValueChange = onThemeChange,
                onDismissRequest = { expanded = false }
            )
        }
    }
}
