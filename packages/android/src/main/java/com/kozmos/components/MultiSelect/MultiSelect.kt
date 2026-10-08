package com.kozmos.components.multiselect

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import com.kozmos.components.chip.ChipSize
import com.kozmos.components.chip.KozmosChip
import com.kozmos.components.chip.KozmosChipGroup
import com.kozmos.components.combobox.selectionFieldColors
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.components.listbox.KozmosListbox
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosMultiSelect(
    selectedValues: List<String>,
    onValueChange: (List<String>) -> Unit,
    searchValue: String,
    onSearchValueChange: (String) -> Unit,
    options: List<KozmosListboxOption>,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String = "Select options",
    enabled: Boolean = true,
    readOnly: Boolean = false,
    status: KozmosInputStatus = KozmosInputStatus.Default,
    error: Boolean = false,
    helperText: String? = null,
    errorMessage: String? = null,
    emptyText: String = "No results found",
    clearable: Boolean = true,
    expanded: Boolean? = null,
    defaultExpanded: Boolean = false,
    onExpandedChange: ((Boolean) -> Unit)? = null
) {
    var internalExpanded by rememberSaveable { mutableStateOf(defaultExpanded) }
    val isExpanded = expanded ?: internalExpanded
    val setExpanded: (Boolean) -> Unit = { next ->
        if (expanded == null) internalExpanded = next
        onExpandedChange?.invoke(next)
    }
    val effectiveStatus = if (error) KozmosInputStatus.Error else status
    val supportingText = errorMessage ?: helperText
    val colors = selectionFieldColors(effectiveStatus, enabled, readOnly)
    val fieldShape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val selectedOptions = selectedValues.mapNotNull { value ->
        options.firstOrNull { it.value == value }
    }
    val filteredOptions = options.filter { option ->
        val query = searchValue.trim().lowercase()
        query.isEmpty() ||
            option.label.lowercase().contains(query) ||
            option.value.lowercase().contains(query) ||
            (option.description?.lowercase()?.contains(query) == true)
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
    ) {
        if (label != null) {
            Text(text = label, style = MaterialTheme.typography.bodyMedium, color = colors.label)
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 44.dp)
                .background(colors.background, fieldShape)
                .border(1.dp, colors.border, fieldShape)
                .padding(
                    horizontal = KozmosDimensions.primitivesLayoutSpacing100,
                    vertical = KozmosDimensions.primitivesLayoutSpacing75
                ),
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
        ) {
            if (selectedOptions.isNotEmpty()) {
                KozmosChipGroup(
                    horizontalSpacing = KozmosDimensions.primitivesLayoutSpacing75,
                    verticalSpacing = KozmosDimensions.primitivesLayoutSpacing75
                ) {
                    selectedOptions.forEach { option ->
                        KozmosChip(
                            text = option.label,
                            size = ChipSize.Sm,
                            selected = true,
                            enabled = enabled && !readOnly,
                            onRemove = {
                                onValueChange(selectedValues.filterNot { it == option.value })
                            }
                        )
                    }
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                BasicTextField(
                    value = searchValue,
                    onValueChange = {
                        onSearchValueChange(it)
                        if (enabled && !readOnly) setExpanded(true)
                    },
                    enabled = enabled,
                    readOnly = readOnly,
                    singleLine = true,
                    textStyle = MaterialTheme.typography.bodyMedium.copy(color = colors.text),
                    cursorBrush = SolidColor(KozmosThemeTokens.primitivesColorsTheme600),
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight(),
                    decorationBox = { innerTextField ->
                        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterStart) {
                            if (searchValue.isEmpty() && selectedValues.isEmpty()) {
                                Text(text = placeholder, style = MaterialTheme.typography.bodyMedium, color = colors.placeholder)
                            }
                            innerTextField()
                        }
                    }
                )

                if (clearable && selectedValues.isNotEmpty() && enabled && !readOnly) {
                    IconButton(
                        onClick = {
                            onValueChange(emptyList())
                            onSearchValueChange("")
                            setExpanded(false)
                        },
                        modifier = Modifier.size(36.dp),
                        colors = IconButtonDefaults.iconButtonColors(contentColor = KozmosThemeTokens.primitivesColorsForeground500)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Clear selected options", modifier = Modifier.size(16.dp))
                    }
                }

                IconButton(
                    onClick = { if (enabled && !readOnly) setExpanded(!isExpanded) },
                    enabled = enabled && !readOnly,
                    modifier = Modifier.size(36.dp),
                    colors = IconButtonDefaults.iconButtonColors(
                        contentColor = KozmosThemeTokens.primitivesColorsForeground500,
                        disabledContentColor = KozmosThemeTokens.primitivesColorsForeground500
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.KeyboardArrowDown,
                        contentDescription = if (isExpanded) "Close options" else "Open options",
                        modifier = Modifier
                            .size(20.dp)
                            .rotate(if (isExpanded) 180f else 0f)
                    )
                }
            }
        }

        if (isExpanded) {
            if (filteredOptions.isEmpty()) {
                Text(
                    text = emptyText,
                    style = MaterialTheme.typography.bodyMedium,
                    color = KozmosThemeTokens.primitivesColorsForeground500,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(KozmosThemeTokens.primitivesColorsBackground0, fieldShape)
                        .border(1.dp, KozmosThemeTokens.semanticsBorderInput, fieldShape)
                        .padding(KozmosDimensions.primitivesLayoutSpacing150)
                )
            } else {
                KozmosListbox(
                    options = filteredOptions,
                    selectedValues = selectedValues,
                    onSelectionChange = { nextValues, _ ->
                        onValueChange(nextValues)
                        onSearchValueChange("")
                    },
                    multiple = true,
                    enabled = enabled
                )
            }
        }

        if (!supportingText.isNullOrBlank()) {
            Text(text = supportingText, style = MaterialTheme.typography.bodyMedium, color = colors.helper)
        }
    }
}
