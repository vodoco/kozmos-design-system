package com.kozmos.components.numberinput

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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import com.kozmos.components.fieldwrapper.kozmosUnsaidWhen
import com.kozmos.components.fieldwrapper.KozmosMixedReset
import com.kozmos.components.fieldwrapper.KozmosMixedValue
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosNumberInput(
    value: Double?,
    onValueChange: (Double?) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String = "",
    enabled: Boolean = true,
    readOnly: Boolean = false,
    status: KozmosInputStatus = KozmosInputStatus.Default,
    error: Boolean = false,
    helperText: String? = null,
    errorMessage: String? = null,
    step: Double = 1.0,
    min: Double? = null,
    max: Double? = null,
    showSteppers: Boolean = true,
    mixed: Boolean = false,
    mixedLabel: String = KozmosMixedValue.LABEL,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL,
    /**
     * A unit drawn inside the field after the value, "m" (GAP-098): never part
     * of the value, and at the field's end, left in a right-to-left layout.
     */
    unit: String? = null,
    /** The unit's spoken name, "metres" for "m", read after the value; [unit] when unset. */
    unitLabel: String? = null
) {
    val effectiveStatus = if (error) KozmosInputStatus.Error else status
    val supportingText = errorMessage ?: helperText
    val fieldShape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val statusColor = when (effectiveStatus) {
        KozmosInputStatus.Error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
        KozmosInputStatus.Warning -> KozmosThemeTokens.primitivesColorsEmotionalAlert600
        KozmosInputStatus.Success -> KozmosThemeTokens.primitivesColorsEmotionalSuccess600
        KozmosInputStatus.Default -> null
    }
    val borderColor = statusColor ?: KozmosThemeTokens.semanticsBorderInput
    val fieldBackground = if (!enabled || readOnly) {
        KozmosThemeTokens.primitivesColorsBackground100
    } else {
        KozmosThemeTokens.primitivesColorsBackground0
    }
    val textColor = if (!enabled) {
        KozmosThemeTokens.primitivesColorsForeground500
    } else {
        MaterialTheme.colorScheme.onSurface
    }
    val placeholderColor = when {
        !enabled -> KozmosThemeTokens.primitivesColorsForeground500
        else -> KozmosThemeTokens.primitivesColorsForeground400
    }
    val helperColor = when {
        !enabled -> KozmosThemeTokens.primitivesColorsForeground500
        statusColor != null -> statusColor
        else -> KozmosThemeTokens.primitivesColorsForeground400
    }
    // What the visitor types into a mixed field, kept as typed until the field
    // loses focus (GAP-153): formatted from the product's first value, a "-"
    // or a "-0." still being typed would be dropped ("-5" became 5).
    var draft by remember { mutableStateOf<String?>(null) }
    // Back to mixed (a reset): the typed text is gone.
    LaunchedEffect(mixed) { if (mixed) draft = null }
    val drafting = mixed || draft != null
    // Mixed, a step would start from nothing and write that number over
    // every selected feature's own: the steppers wait for a typed edit.
    val stepperEnabled = enabled && !readOnly && !drafting
    val fieldFocus = remember { FocusRequester() }
    // Mixed (GAP-153), the field shows none of its own value; the unit stays,
    // to say what to type.
    val shownValue = if (mixed) null else value
    val textValue = draft ?: formatNumberInputValue(shownValue)
    val spokenUnit = (unitLabel ?: unit)?.takeIf { it.isNotBlank() }

    fun clampValue(nextValue: Double): Double {
        var clampedValue = nextValue
        if (min != null) clampedValue = clampedValue.coerceAtLeast(min)
        if (max != null) clampedValue = clampedValue.coerceAtMost(max)
        return clampedValue
    }

    fun updateFromText(nextText: String) {
        val trimmed = nextText.trim()
        if (drafting) {
            // A mixed field reports a value only once the text is a number:
            // "-", "." or "-." report nothing.
            draft = nextText
            trimmed.toDoubleOrNull()?.takeIf { it.isFinite() }?.let { onValueChange(clampValue(it)) }
            return
        }
        if (trimmed.isEmpty()) {
            onValueChange(null)
            return
        }

        trimmed.toDoubleOrNull()?.let { parsed ->
            onValueChange(clampValue(parsed))
        }
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
    ) {
        if (label != null) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = statusColor ?: textColor
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp)
                .background(fieldBackground, fieldShape)
                .border(1.dp, borderColor, fieldShape),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (showSteppers) {
                IconButton(
                    onClick = { onValueChange(clampValue((shownValue ?: 0.0) - step)) },
                    enabled = stepperEnabled,
                    modifier = Modifier.size(44.dp),
                    colors = IconButtonDefaults.iconButtonColors(
                        contentColor = statusColor ?: textColor,
                        disabledContentColor = KozmosThemeTokens.primitivesColorsForeground500
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Remove,
                        contentDescription = "Decrease value",
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            BasicTextField(
                value = textValue,
                onValueChange = ::updateFromText,
                enabled = enabled,
                readOnly = readOnly,
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyMedium.copy(
                    color = textColor,
                    textAlign = if (showSteppers) TextAlign.Center else TextAlign.Start
                ),
                cursorBrush = SolidColor(KozmosThemeTokens.primitivesColorsTheme600),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .focusRequester(fieldFocus)
                    .onFocusChanged { if (!it.isFocused) draft = null }
                    .semantics {
                        // Mixed, the field says the mixed label as its state,
                        // then the unit: "Multiple values, metres". Else the
                        // unit is read once, after the value the field already
                        // says as its text: "15, metres".
                        val said = listOfNotNull(mixedLabel.takeIf { mixed }, spokenUnit)
                        if (said.isNotEmpty()) stateDescription = said.joinToString(", ")
                    },
                decorationBox = { innerTextField ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .fillMaxHeight()
                            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing150),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // The value keeps clear of the unit: the unit takes its width, the value the rest.
                        Box(
                            modifier = Modifier.weight(1f),
                            contentAlignment = if (showSteppers) Alignment.Center else Alignment.CenterStart
                        ) {
                            if (textValue.isEmpty()) {
                                Text(
                                    text = if (mixed) mixedLabel else placeholder,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = placeholderColor,
                                    // Mixed, the field says it as its state.
                                    modifier = Modifier.kozmosUnsaidWhen(mixed)
                                )
                            }
                            innerTextField()
                        }
                        if (!unit.isNullOrBlank()) {
                            Text(
                                text = unit,
                                style = MaterialTheme.typography.bodyMedium,
                                color = placeholderColor,
                                maxLines = 1,
                                modifier = Modifier
                                    .padding(start = KozmosDimensions.primitivesLayoutSpacing50)
                                    // Heard with the value, through the field's state, not again here.
                                    .clearAndSetSemantics { }
                            )
                        }
                    }
                }
            )

            if (showSteppers) {
                IconButton(
                    onClick = { onValueChange(clampValue((shownValue ?: 0.0) + step)) },
                    enabled = stepperEnabled,
                    modifier = Modifier.size(44.dp),
                    colors = IconButtonDefaults.iconButtonColors(
                        contentColor = statusColor ?: textColor,
                        disabledContentColor = KozmosThemeTokens.primitivesColorsForeground500
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Increase value",
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        if (KozmosMixedValue.showsReset(mixed, onResetMixed, enabled, readOnly)) {
            KozmosMixedReset(label = resetMixedLabel, onClick = {
                fieldFocus.requestFocus()
                onResetMixed?.invoke()
            })
        }

        if (!supportingText.isNullOrBlank()) {
            Text(
                text = supportingText,
                style = MaterialTheme.typography.bodyMedium,
                color = helperColor
            )
        }
    }
}

private fun formatNumberInputValue(value: Double?): String {
    if (value == null) return ""
    return if (value % 1.0 == 0.0) value.toInt().toString() else value.toString()
}
