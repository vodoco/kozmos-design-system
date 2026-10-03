package com.kozmos.components.combobox

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.components.listbox.KozmosListbox
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

data class KozmosComboboxLabels(
    val clear: String = "Clear selection",
    val open: String = "Open options",
    val close: String = "Close options"
)

// Preserve the released positional and trailing-lambda signature.
@Composable
fun KozmosCombobox(
    value: String,
    onValueChange: (String, KozmosListboxOption?) -> Unit,
    inputValue: String,
    onInputValueChange: (String) -> Unit,
    options: List<KozmosListboxOption>,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String = "Select option",
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
) = KozmosCombobox(value, onValueChange, inputValue, onInputValueChange, options,
    KozmosComboboxLabels(), modifier, label, placeholder, enabled, readOnly, status, error,
    helperText, errorMessage, emptyText, clearable, expanded, defaultExpanded, onExpandedChange)

@Composable
fun KozmosCombobox(
    value: String,
    onValueChange: (String, KozmosListboxOption?) -> Unit,
    inputValue: String,
    onInputValueChange: (String) -> Unit,
    options: List<KozmosListboxOption>,
    controlLabels: KozmosComboboxLabels,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String = "Select option",
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
    val filteredOptions = options.filter { option ->
        val query = inputValue.trim().lowercase()
        query.isEmpty() ||
            option.label.lowercase().contains(query) ||
            option.value.lowercase().contains(query) ||
            (option.description?.lowercase()?.contains(query) == true)
    }
    val colors = selectionFieldColors(effectiveStatus, enabled, readOnly)
    val fieldShape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
    ) {
        if (label != null) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.label
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .background(colors.background, fieldShape)
                .border(1.dp, colors.border, fieldShape),
            verticalAlignment = Alignment.CenterVertically
        ) {
            BasicTextField(
                value = inputValue,
                onValueChange = {
                    onInputValueChange(it)
                    if (enabled && !readOnly) setExpanded(true)
                },
                enabled = enabled,
                readOnly = readOnly,
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyMedium.copy(color = colors.text),
                cursorBrush = SolidColor(KozmosThemeTokens.primitivesColorsTheme500),
                modifier = Modifier
                    .semantics { contentDescription = label ?: placeholder }
                    .weight(1f)
                    .fillMaxHeight(),
                decorationBox = { innerTextField ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .fillMaxHeight()
                            .padding(start = KozmosDimensions.primitivesLayoutSpacing150),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        if (inputValue.isEmpty()) {
                            Text(
                                text = placeholder,
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.placeholder
                            )
                        }
                        innerTextField()
                    }
                }
            )

            if (clearable && inputValue.isNotEmpty() && enabled && !readOnly) {
                IconButton(
                    onClick = {
                        onValueChange("", null)
                        onInputValueChange("")
                        setExpanded(false)
                    },
                    modifier = Modifier.size(48.dp),
                    colors = IconButtonDefaults.iconButtonColors(contentColor = KozmosThemeTokens.primitivesColorsForeground500)
                ) {
                    Icon(Icons.Default.Close, contentDescription = controlLabels.clear, modifier = Modifier.size(16.dp))
                }
            }

            IconButton(
                onClick = { if (enabled && !readOnly) setExpanded(!isExpanded) },
                enabled = enabled && !readOnly,
                modifier = Modifier.size(48.dp),
                colors = IconButtonDefaults.iconButtonColors(
                    contentColor = KozmosThemeTokens.primitivesColorsForeground500,
                    disabledContentColor = KozmosThemeTokens.primitivesColorsForeground500
                )
            ) {
                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = if (isExpanded) controlLabels.close else controlLabels.open,
                    modifier = Modifier
                        .size(20.dp)
                        .rotate(if (isExpanded) 180f else 0f)
                )
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
                    selectedValues = if (value.isEmpty()) emptyList() else listOf(value),
                    onSelectionChange = { nextValues, option ->
                        onValueChange(nextValues.firstOrNull().orEmpty(), option)
                        onInputValueChange(option.label)
                        setExpanded(false)
                    },
                    enabled = enabled,
                    multiple = false
                )
            }
        }

        if (!supportingText.isNullOrBlank()) {
            Text(
                text = supportingText,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.helper
            )
        }
    }
}

internal data class SelectionFieldColors(
    val background: androidx.compose.ui.graphics.Color,
    val border: androidx.compose.ui.graphics.Color,
    val text: androidx.compose.ui.graphics.Color,
    val placeholder: androidx.compose.ui.graphics.Color,
    val label: androidx.compose.ui.graphics.Color,
    val helper: androidx.compose.ui.graphics.Color
)

@Composable
internal fun selectionFieldColors(
    status: KozmosInputStatus,
    enabled: Boolean,
    readOnly: Boolean
): SelectionFieldColors {
    val statusColor = when (status) {
        KozmosInputStatus.Error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
        KozmosInputStatus.Warning -> KozmosThemeTokens.primitivesColorsEmotionalAlert600
        KozmosInputStatus.Success -> KozmosThemeTokens.primitivesColorsEmotionalSuccess600
        KozmosInputStatus.Default -> null
    }
    val textColor = when {
        status == KozmosInputStatus.Error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
        !enabled -> KozmosThemeTokens.primitivesColorsForeground500
        else -> MaterialTheme.colorScheme.onSurface
    }
    return SelectionFieldColors(
        background = if (!enabled || readOnly) KozmosThemeTokens.primitivesColorsBackground100 else KozmosThemeTokens.primitivesColorsBackground0,
        border = statusColor ?: KozmosThemeTokens.semanticsBorderInput,
        text = textColor,
        placeholder = if (!enabled) KozmosThemeTokens.primitivesColorsForeground500 else KozmosThemeTokens.primitivesColorsForeground400,
        label = statusColor ?: textColor,
        helper = when {
            !enabled -> KozmosThemeTokens.primitivesColorsForeground500
            statusColor != null -> statusColor
            else -> KozmosThemeTokens.primitivesColorsForeground500
        }
    )
}
