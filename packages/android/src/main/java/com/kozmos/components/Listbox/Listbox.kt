package com.kozmos.components.listbox

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

data class KozmosListboxOption(
    val value: String,
    val label: String,
    val description: String? = null,
    val disabled: Boolean = false
)

/** A picker command, never a selectable option or query value. IDs must be unique. */
data class KozmosPickerAction(val id: String, val label: String, val disabled: Boolean = false, val onAction: () -> Unit)

internal fun validPickerActions(actions: List<KozmosPickerAction>): List<KozmosPickerAction> {
    val counts = actions.groupingBy { it.id }.eachCount()
    return actions.filter { it.id.isNotBlank() && counts[it.id] == 1 }
}

@Composable
fun KozmosListbox(
    options: List<KozmosListboxOption>,
    selectedValues: List<String> = emptyList(),
    onSelectionChange: (List<String>, KozmosListboxOption) -> Unit = { _, _ -> },
    modifier: Modifier = Modifier,
    multiple: Boolean = false,
    enabled: Boolean = true,
    maxHeight: androidx.compose.ui.unit.Dp = 256.dp,
    actions: List<KozmosPickerAction> = emptyList(),
    emptyText: String? = null
) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(max = maxHeight)
            .clip(shape)
            .background(KozmosThemeTokens.primitivesColorsBackground0)
            .border(1.dp, KozmosThemeTokens.semanticsBorderSubtle, shape)
            .verticalScroll(rememberScrollState())
            .padding(KozmosDimensions.primitivesLayoutSpacing50),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
    ) {
        if (options.isEmpty() && emptyText != null) {
            Text(emptyText, style = MaterialTheme.typography.bodyMedium,
                color = KozmosThemeTokens.primitivesColorsForeground500,
                modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing150))
        }
        options.forEach { option ->
            val selected = selectedValues.contains(option.value)
            val rowShape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(rowShape)
                    .background(if (selected) KozmosThemeTokens.primitivesColorsBackground100 else Color.Transparent)
                    .selectable(selected = selected, enabled = enabled && !option.disabled) {
                        val nextValues = if (multiple) {
                            if (selected) {
                                selectedValues.filterNot { it == option.value }
                            } else {
                                selectedValues + option.value
                            }
                        } else {
                            listOf(option.value)
                        }
                        onSelectionChange(nextValues, option)
                    }
                    .padding(
                        horizontal = KozmosDimensions.primitivesLayoutSpacing150,
                        vertical = KozmosDimensions.primitivesLayoutSpacing100
                    ),
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = option.label,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = if (option.disabled) {
                            KozmosThemeTokens.primitivesColorsForeground500
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        },
                        maxLines = 1
                    )
                    if (!option.description.isNullOrBlank()) {
                        Text(
                            text = option.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = KozmosThemeTokens.primitivesColorsForeground500,
                            maxLines = 1
                        )
                    }
                }

                if (selected) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        // An icon on a surface: theme/600 (decision 59).
                        tint = KozmosThemeTokens.primitivesColorsTheme600
                    )
                }
            }
        }
        validPickerActions(actions).forEach { action -> key(action.id) {
            KozmosButton(onClick = { if (enabled && !action.disabled) action.onAction() },
                modifier = Modifier.fillMaxWidth(), variant = KozmosButtonVariant.Ghost,
                enabled = enabled && !action.disabled) { Text(action.label) }
        } }
    }
}
