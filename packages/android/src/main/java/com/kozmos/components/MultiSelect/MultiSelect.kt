package com.kozmos.components.multiselect

import com.kozmos.components.fieldwrapper.KozmosFieldState
import com.kozmos.components.fieldwrapper.kozmosFieldState
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
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.offset
import com.kozmos.components.chip.ChipSize
import com.kozmos.components.chip.KozmosChip
import com.kozmos.components.chip.KozmosChipGroup
import com.kozmos.components.combobox.selectionFieldColors
import com.kozmos.components.fieldwrapper.KozmosMixedReset
import com.kozmos.components.fieldwrapper.KozmosMixedValue
import com.kozmos.components.fieldwrapper.kozmosUnsaidWhen
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.components.listbox.KozmosListbox
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * [mixed] (GAP-255, decision 188): the field stands for several selections
 * that differ, and shows none of its own: no chips, [mixedLabel] in the
 * placeholder's place, said once as the field's state; its list checks no
 * option and offers no clear, and a choice reports that option alone, the
 * edit after which the product clears `mixed`. [onResetMixed] offers
 * [resetMixedLabel] under the field once it is no longer mixed, never while
 * it is disabled or read-only; pressed, focus goes back to the field.
 * [KozmosMixedValue] has the whole of it.
 */
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
    onExpandedChange: ((Boolean) -> Unit)? = null,
    mixed: Boolean = false,
    mixedLabel: String = KozmosMixedValue.LABEL,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL,
    /** Said as a read-only field's state (GAP-235); a product that translates passes its own. */
    readOnlyLabel: String = KozmosFieldState.READ_ONLY_LABEL
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
    // Mixed (GAP-255), no option is the choice: no chips, none checked,
    // nothing to clear, and a choice starts from none, so it is that option
    // alone. The product clears `mixed` on that edit.
    val shownValues = if (mixed) emptyList() else selectedValues
    val fieldFocus = remember { FocusRequester() }
    val selectedOptions = shownValues.mapNotNull { value ->
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
                                onValueChange(shownValues.filterNot { it == option.value })
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
                        .focusRequester(fieldFocus)
                        // Mixed with nothing typed, said as its state; read
                        // only and in error, said on the field itself
                        // (GAP-235, GAP-236).
                        .semantics {
                            kozmosFieldState(
                                readOnly = readOnly,
                                readOnlyLabel = readOnlyLabel,
                                inError = effectiveStatus == KozmosInputStatus.Error,
                                errorMessage = errorMessage,
                                stateParts = listOfNotNull(mixedLabel.takeIf { mixed && searchValue.isEmpty() })
                            )
                        }
                        .weight(1f)
                        .fillMaxHeight(),
                    decorationBox = { innerTextField ->
                        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterStart) {
                            if (searchValue.isEmpty() && shownValues.isEmpty()) {
                                Text(
                                    text = if (mixed) mixedLabel else placeholder,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = colors.placeholder,
                                    modifier = Modifier.kozmosUnsaidWhen(mixed)
                                )
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
                // padding, so it runs to the field's end. The field is 48dp
                // tall, where React and Figma draw 44: a parity gap of its
                // own, as #392 records it on iOS, left as it is here.
                if (clearable && shownValues.isNotEmpty() && enabled && !readOnly) {
                    IconButton(
                        onClick = {
                            onValueChange(emptyList())
                            onSearchValueChange("")
                            setExpanded(false)
                        },
                        modifier = Modifier
                            .reachingPastTheRow(vertical = TargetReach)
                            .size(TargetSize),
                        colors = IconButtonDefaults.iconButtonColors(contentColor = KozmosThemeTokens.primitivesColorsForeground400)
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
                        contentColor = KozmosThemeTokens.primitivesColorsForeground400,
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
                    color = KozmosThemeTokens.primitivesColorsForeground400,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(KozmosThemeTokens.primitivesColorsBackground0, fieldShape)
                        .border(1.dp, KozmosThemeTokens.semanticsBorderInput, fieldShape)
                        .padding(KozmosDimensions.primitivesLayoutSpacing150)
                )
            } else {
                KozmosListbox(
                    options = filteredOptions,
                    selectedValues = shownValues,
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

        if (KozmosMixedValue.showsReset(mixed, onResetMixed, enabled, readOnly)) {
            KozmosMixedReset(label = resetMixedLabel, onClick = {
                // The query goes with the edit, and focus goes back to the
                // field, as on the web.
                onSearchValueChange("")
                setExpanded(false)
                fieldFocus.requestFocus()
                onResetMixed?.invoke()
            })
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
