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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.offset
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
    // Shown only while the field can be used, as Combobox's list is: a
    // disabled or read-only field shows no list, whatever `expanded` says.
    val isExpanded = (expanded ?: internalExpanded) && enabled && !readOnly
    val setExpanded: (Boolean) -> Unit = { next ->
        if (expanded == null) internalExpanded = next
        onExpandedChange?.invoke(next)
    }
    // And closed as either turns on, as React's MultiSelect closes its list,
    // so it does not open again by itself when the field can be used again.
    LaunchedEffect(enabled, readOnly) {
        if ((!enabled || readOnly) && (expanded ?: internalExpanded)) setExpanded(false)
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

                // The clear and the chevron are 44dp targets, as React's
                // Combobox's are (`h-field w-field`, 44 in touch): they were
                // 36. Each reaches 4dp above and below the 36dp row, into the
                // 6dp over it and the field's padding under it, so the field
                // keeps its height; the chevron also takes the field's 8dp end
                // padding, so it runs to the field's end.
                if (clearable && selectedValues.isNotEmpty() && enabled && !readOnly) {
                    IconButton(
                        onClick = {
                            onValueChange(emptyList())
                            onSearchValueChange("")
                            setExpanded(false)
                        },
                        modifier = Modifier
                            .reachingPastTheRow(vertical = TargetReach)
                            .size(TargetSize),
                        colors = IconButtonDefaults.iconButtonColors(contentColor = KozmosThemeTokens.primitivesColorsForeground500)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Clear selected options", modifier = Modifier.size(16.dp))
                    }
                }

                IconButton(
                    onClick = { if (enabled && !readOnly) setExpanded(!isExpanded) },
                    enabled = enabled && !readOnly,
                    modifier = Modifier
                        .reachingPastTheRow(vertical = TargetReach, end = KozmosDimensions.primitivesLayoutSpacing100)
                        .size(TargetSize),
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
                        if (enabled && !readOnly) {
                            onValueChange(nextValues)
                            onSearchValueChange("")
                        }
                    },
                    multiple = true,
                    enabled = enabled && !readOnly
                )
            }
        }

        if (!supportingText.isNullOrBlank()) {
            Text(text = supportingText, style = MaterialTheme.typography.bodyMedium, color = colors.helper)
        }
    }
}

/** The clear's and the chevron's side: React's touch field height, `h-field`. */
private val TargetSize = 44.dp

/** How far each target reaches above and below the field's 36dp row. */
private val TargetReach = (TargetSize - 36.dp) / 2

/**
 * Lays its node out [vertical] shorter above and below, and [end] narrower
 * at the inline end, than what follows in the chain, the target, which is
 * placed over the room it gives up. The row and the field are laid out as
 * they were around 36dp buttons, and the target takes a press across all of
 * its size. Placed relative, so right to left the target reaches past the
 * left.
 */
private fun Modifier.reachingPastTheRow(vertical: Dp, end: Dp = 0.dp): Modifier = layout { measurable, constraints ->
    val above = vertical.roundToPx()
    val past = end.roundToPx()
    val placeable = measurable.measure(constraints.offset(horizontal = past, vertical = 2 * above))
    layout(
        constraints.constrainWidth(placeable.width - past),
        constraints.constrainHeight(placeable.height - 2 * above)
    ) {
        placeable.placeRelative(0, -above)
    }
}
