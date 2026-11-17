package com.kozmos.components.daterangepicker

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DateRangePicker
import androidx.compose.material3.DateRangePickerState
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDateRangePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import com.kozmos.components.KozmosPickerField
import com.kozmos.components.PickerConfirmButton
import com.kozmos.components.PickerDismissButton
import com.kozmos.components.fieldwrapper.KozmosMixedReset
import com.kozmos.components.fieldwrapper.KozmosMixedValue
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.components.pickerStatusColor
import com.kozmos.components.pickerInitialValue
import com.kozmos.components.toPickerDate
import com.kozmos.components.toPickerMillis
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

data class KozmosDateRangeValue(
    val start: LocalDate? = null,
    val end: LocalDate? = null
)

/**
 * [mixed] (GAP-255, decision 188): the range stands for several that differ,
 * and both ends show [mixedLabel] in place of their dates, each said once as
 * its state; the dialog opens with no range chosen, and a confirmed range is
 * the edit. [onResetMixed] offers [resetMixedLabel] once, under the range,
 * when it is no longer mixed; pressed, focus goes to the start field.
 * [KozmosMixedValue] has the whole of it.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KozmosDateRangePicker(
    value: KozmosDateRangeValue,
    onValueChange: (KozmosDateRangeValue) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    startLabel: String = "Start date",
    endLabel: String = "End date",
    helperText: String? = null,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    status: KozmosInputStatus = KozmosInputStatus.Default,
    expanded: Boolean = false,
    mixed: Boolean = false,
    mixedLabel: String = KozmosMixedValue.LABEL,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL
) {
    val statusColor = pickerStatusColor(status)
    var open by remember { mutableStateOf(false) }
    val startFocus = remember { FocusRequester() }
    // The app's locale's own short date, for a field half the row wide:
    // "5/25/26", "25.05.26". It was "MMM d, yyyy" in Locale.US.
    val dates = DateTimeFormatter.ofLocalizedDate(FormatStyle.SHORT)
        .withLocale(LocalConfiguration.current.locales[0])
    val helperColor = when {
        !enabled -> KozmosThemeTokens.primitivesColorsForeground500
        statusColor != null -> statusColor
        else -> KozmosThemeTokens.primitivesColorsForeground400
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
    ) {
        if (label != null) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = statusColor ?: if (enabled) {
                    KozmosThemeTokens.primitivesColorsForeground100
                } else {
                    KozmosThemeTokens.primitivesColorsForeground500
                }
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150),
            verticalAlignment = Alignment.Top
        ) {
            // Either field opens the one range picker: a range is one
            // choice (decision 106). Each field opened a dialog of its own.
            KozmosPickerField(
                label = startLabel,
                value = value.start?.format(dates),
                icon = Icons.Default.CalendarToday,
                onOpen = { open = true },
                modifier = Modifier.weight(1f),
                chevron = false,
                status = status,
                enabled = enabled,
                readOnly = readOnly,
                mixed = mixed,
                mixedLabel = mixedLabel,
                fieldFocus = startFocus
            )
            KozmosPickerField(
                label = endLabel,
                value = value.end?.format(dates),
                icon = Icons.Default.CalendarToday,
                onOpen = { open = true },
                modifier = Modifier.weight(1f),
                chevron = false,
                status = status,
                enabled = enabled,
                readOnly = readOnly,
                mixed = mixed,
                mixedLabel = mixedLabel
            )
        }

        // One reset for the range, under both ends: a range is one choice.
        if (KozmosMixedValue.showsReset(mixed, onResetMixed, enabled, readOnly)) {
            KozmosMixedReset(label = resetMixedLabel, onClick = {
                // Focus goes back to the range's start, as on the web.
                startFocus.requestFocus()
                onResetMixed?.invoke()
            })
        }

        if (expanded) {
            DateRangePreview(
                value = if (mixed) KozmosDateRangeValue() else value,
                mixedLabel = if (mixed) mixedLabel else null,
                dates = dates,
                startLabel = startLabel,
                endLabel = endLabel,
                enabled = enabled
            )
        }

        if (!helperText.isNullOrBlank()) {
            Text(
                text = helperText,
                style = MaterialTheme.typography.bodyMedium,
                color = helperColor
            )
        }
    }

    if (open) {
        val state = rememberDateRangePickerState(
            // Mixed (GAP-255), no range is chosen.
            initialSelectedStartDateMillis = pickerInitialValue(value.start, mixed)?.toPickerMillis(),
            initialSelectedEndDateMillis = pickerInitialValue(value.end, mixed)?.toPickerMillis()
        )
        DatePickerDialog(
            onDismissRequest = { open = false },
            confirmButton = {
                PickerConfirmButton(enabled = state.selectedStartDateMillis != null) {
                    onValueChange(
                        KozmosDateRangeValue(
                            start = state.selectedStartDateMillis?.toPickerDate(),
                            end = state.selectedEndDateMillis?.toPickerDate()
                        )
                    )
                    open = false
                }
            },
            dismissButton = { PickerDismissButton { open = false } }
        ) {
            KozmosDateRangePickerContent(state, Modifier.weight(1f))
        }
    }
}

/** What the dialog shows: Material's range picker, one choice of both ends, in the theme's colours. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun KozmosDateRangePickerContent(state: DateRangePickerState, modifier: Modifier = Modifier) {
    DateRangePicker(state = state, modifier = modifier)
}

@Composable
private fun DateRangePreview(
    value: KozmosDateRangeValue,
    mixedLabel: String?,
    dates: DateTimeFormatter,
    startLabel: String,
    endLabel: String,
    enabled: Boolean
) {
    val textColor = if (enabled) {
        KozmosThemeTokens.primitivesColorsForeground0
    } else {
        KozmosThemeTokens.primitivesColorsForeground500
    }
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(KozmosThemeTokens.primitivesColorsBackground0, shape)
            .border(1.dp, KozmosThemeTokens.semanticsBorderInput, shape)
            .padding(KozmosDimensions.primitivesLayoutSpacing150),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
    ) {
        // The range as a dash joins it, a missing date by its field's label:
        // it wrote a fixed English "Start", "to" and "End".
        Text(
            text = mixedLabel ?: "${value.start?.format(dates) ?: startLabel} – ${value.end?.format(dates) ?: endLabel}",
            style = MaterialTheme.typography.bodySmall,
            color = textColor
        )
        Spacer(modifier = Modifier.weight(1f))
    }
}
