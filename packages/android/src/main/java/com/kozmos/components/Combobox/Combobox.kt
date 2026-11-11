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
import androidx.compose.runtime.remember
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import com.kozmos.components.listbox.KozmosPickerAction
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
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.stateDescription
import com.kozmos.components.fieldwrapper.KozmosMixedReset
import com.kozmos.components.fieldwrapper.KozmosMixedValue
import com.kozmos.components.fieldwrapper.kozmosUnsaidWhen
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

internal fun filteredComboboxOptions(options: List<KozmosListboxOption>, inputValue: String, filterLocally: Boolean): List<KozmosListboxOption> {
    if (!filterLocally) return options
    val query = inputValue.trim().lowercase()
    return options.filter { option -> query.isEmpty() || option.label.lowercase().contains(query) || option.value.lowercase().contains(query) || (option.description?.lowercase()?.contains(query) == true) }
}

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
    onExpandedChange: ((Boolean) -> Unit)? = null,
    mixed: Boolean = false,
    mixedLabel: String = KozmosMixedValue.LABEL,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL
) = KozmosCombobox(value, onValueChange, inputValue, onInputValueChange, options,
    KozmosComboboxLabels(), modifier, label, placeholder, enabled, readOnly, status, error,
    helperText, errorMessage, emptyText, clearable, expanded, defaultExpanded, onExpandedChange,
    mixed = mixed, mixedLabel = mixedLabel, onResetMixed = onResetMixed, resetMixedLabel = resetMixedLabel)

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
    onExpandedChange: ((Boolean) -> Unit)? = null,
    mixed: Boolean = false,
    mixedLabel: String = KozmosMixedValue.LABEL,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL
) = KozmosCombobox(value, onValueChange, inputValue, onInputValueChange, options,
    controlLabels, true, modifier, label, placeholder, enabled, readOnly, status, error,
    helperText, errorMessage, emptyText, clearable, expanded, defaultExpanded, onExpandedChange,
    mixed = mixed, mixedLabel = mixedLabel, onResetMixed = onResetMixed, resetMixedLabel = resetMixedLabel)

/** Explicit host filtering without changing either existing positional/trailing-lambda overload. */
@Composable
fun KozmosCombobox(
    value: String,
    onValueChange: (String, KozmosListboxOption?) -> Unit,
    inputValue: String,
    onInputValueChange: (String) -> Unit,
    options: List<KozmosListboxOption>,
    controlLabels: KozmosComboboxLabels,
    filterLocally: Boolean,
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
    onExpandedChange: ((Boolean) -> Unit)? = null,
    mixed: Boolean = false,
    mixedLabel: String = KozmosMixedValue.LABEL,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL
) = KozmosCombobox(value, onValueChange, inputValue, onInputValueChange, options,
    controlLabels, filterLocally, emptyList(), modifier, label, placeholder, enabled, readOnly, status, error,
    helperText, errorMessage, emptyText, clearable, expanded, defaultExpanded, onExpandedChange,
    mixed = mixed, mixedLabel = mixedLabel, onResetMixed = onResetMixed, resetMixedLabel = resetMixedLabel)

/** Commands are unfiltered, do not change query/selection, and request dismissal before activation. */
@Composable
fun KozmosCombobox(
    value: String, onValueChange: (String, KozmosListboxOption?) -> Unit,
    inputValue: String, onInputValueChange: (String) -> Unit, options: List<KozmosListboxOption>,
    controlLabels: KozmosComboboxLabels, filterLocally: Boolean,
    popupActions: List<KozmosPickerAction>,
    modifier: Modifier = Modifier, label: String? = null, placeholder: String = "Select option",
    enabled: Boolean = true, readOnly: Boolean = false,
    status: KozmosInputStatus = KozmosInputStatus.Default, error: Boolean = false,
    helperText: String? = null, errorMessage: String? = null, emptyText: String = "No results found",
    clearable: Boolean = true, expanded: Boolean? = null, defaultExpanded: Boolean = false,
    onExpandedChange: ((Boolean) -> Unit)? = null,
    // GAP-153: the field stands for several values that differ. No option is
    // the choice, though the visitor may type a query. KozmosMixedValue has it.
    mixed: Boolean = false,
    mixedLabel: String = KozmosMixedValue.LABEL,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL
) {
    var internalExpanded by rememberSaveable { mutableStateOf(defaultExpanded) }
    val isExpanded = (expanded ?: internalExpanded) && enabled && !readOnly
    val inputFocus = remember { FocusRequester() }
    var inputFocused by remember { mutableStateOf(false) }
    // Whether the field had focus while the popup was open: only then does a command hand it back.
    var restoresInputFocus by remember { mutableStateOf(false) }
    LaunchedEffect(isExpanded) { if (isExpanded) restoresInputFocus = inputFocused }
    val setExpanded: (Boolean) -> Unit = { next ->
        if (expanded == null) internalExpanded = next
        onExpandedChange?.invoke(next)
    }
    // Turning mixed (GAP-153), the field's text goes with its choice, as on
    // the web; a query typed while mixed is the visitor's and stays. Only on
    // the turn, never as the field enters composition again (a rotation, a
    // list scrolled back, a tab returned to), which would wipe that query.
    var wasMixed by remember { mutableStateOf(mixed) }
    LaunchedEffect(mixed) {
        if (mixed && !wasMixed && inputValue.isNotEmpty()) onInputValueChange("")
        wasMixed = mixed
    }
    val effectiveStatus = if (error) KozmosInputStatus.Error else status
    val supportingText = errorMessage ?: helperText
    val filteredOptions = filteredComboboxOptions(options, inputValue, filterLocally)
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
                color = colors.label,
                // The field carries this name; heard here too, it is said twice.
                modifier = Modifier.clearAndSetSemantics { }
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
                cursorBrush = SolidColor(KozmosThemeTokens.primitivesColorsTheme600),
                modifier = Modifier
                    .focusRequester(inputFocus)
                    .onFocusChanged {
                        inputFocused = it.isFocused
                        if (it.isFocused && isExpanded) restoresInputFocus = true
                    }
                    .semantics {
                        contentDescription = label ?: placeholder
                        // Mixed with nothing typed, said as its state.
                        if (mixed && inputValue.isEmpty()) stateDescription = mixedLabel
                    }
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

            if (clearable && inputValue.isNotEmpty() && enabled && !readOnly) {
                IconButton(
                    onClick = {
                        // Mixed, there is no choice to clear, only the query:
                        // an empty choice would read as an edit that empties
                        // the property across the selection (GAP-153).
                        if (!mixed) onValueChange("", null)
                        onInputValueChange("")
                        setExpanded(false)
                    },
                    modifier = Modifier.size(48.dp),
                    colors = IconButtonDefaults.iconButtonColors(contentColor = KozmosThemeTokens.primitivesColorsForeground400)
                ) {
                    Icon(Icons.Default.Close, contentDescription = controlLabels.clear, modifier = Modifier.size(16.dp))
                }
            }

            IconButton(
                onClick = { if (enabled && !readOnly) setExpanded(!isExpanded) },
                enabled = enabled && !readOnly,
                modifier = Modifier.size(48.dp),
                colors = IconButtonDefaults.iconButtonColors(
                    contentColor = KozmosThemeTokens.primitivesColorsForeground400,
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
            if (filteredOptions.isEmpty() && popupActions.isEmpty()) {
                if (emptyText != supportingText) Text(
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
                    // Mixed, no option is the choice: none is checked.
                    selectedValues = if (mixed || value.isEmpty()) emptyList() else listOf(value),
                    onSelectionChange = { nextValues, option ->
                        if (enabled && !readOnly && !option.disabled) {
                            setExpanded(false)
                            onValueChange(nextValues.firstOrNull().orEmpty(), option)
                            onInputValueChange(option.label)
                        }
                    },
                    enabled = enabled && !readOnly,
                    multiple = false,
                    emptyText = emptyText.takeUnless { it == supportingText },
                    actions = popupActions.map { action -> action.copy(onAction = {
                        if (enabled && !readOnly && !action.disabled) {
                            // Focusing a field that did not have focus raises the keyboard
                            // over the map a command may be sending the visitor to.
                            if (restoresInputFocus) inputFocus.requestFocus()
                            setExpanded(false)
                            action.onAction()
                        }
                    }) }
                )
            }
        }

        if (KozmosMixedValue.showsReset(mixed, onResetMixed, enabled, readOnly)) {
            KozmosMixedReset(
                label = resetMixedLabel,
                onClick = {
                    // The text goes with the choice, typed or not, and focus
                    // goes back to the field, as on the web.
                    onInputValueChange("")
                    setExpanded(false)
                    inputFocus.requestFocus()
                    onResetMixed?.invoke()
                }
            )
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
            else -> KozmosThemeTokens.primitivesColorsForeground400
        }
    )
}
