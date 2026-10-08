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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
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
    showSteppers: Boolean = true
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
        else -> KozmosThemeTokens.primitivesColorsForeground500
    }
    val stepperEnabled = enabled && !readOnly
    val textValue = formatNumberInputValue(value)

    fun clampValue(nextValue: Double): Double {
        var clampedValue = nextValue
        if (min != null) clampedValue = clampedValue.coerceAtLeast(min)
        if (max != null) clampedValue = clampedValue.coerceAtMost(max)
        return clampedValue
    }

    fun updateFromText(nextText: String) {
        val trimmed = nextText.trim()
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
                    onClick = { onValueChange(clampValue((value ?: 0.0) - step)) },
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
                    .fillMaxHeight(),
                decorationBox = { innerTextField ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .fillMaxHeight()
                            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing150),
                        contentAlignment = if (showSteppers) Alignment.Center else Alignment.CenterStart
                    ) {
                        if (textValue.isEmpty()) {
                            Text(
                                text = placeholder,
                                style = MaterialTheme.typography.bodyMedium,
                                color = placeholderColor
                            )
                        }
                        innerTextField()
                    }
                }
            )

            if (showSteppers) {
                IconButton(
                    onClick = { onValueChange(clampValue((value ?: 0.0) + step)) },
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
