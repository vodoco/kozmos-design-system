package com.kozmos.components.datepicker

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DatePickerState
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import com.kozmos.components.KozmosPickerField
import com.kozmos.components.PickerConfirmButton
import com.kozmos.components.PickerDismissButton
import com.kozmos.components.fieldwrapper.KozmosMixedValue
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.components.pickerInitialValue
import com.kozmos.components.toPickerDate
import com.kozmos.components.toPickerMillis
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

/**
 * A date, in a Kozmos field that opens Material 3's date picker in its
 * dialog, coloured by the Kozmos theme around it (decision 106). The field is
 * React's: the label above, the date in the app's locale's medium style, a
 * calendar at its start and Figma's chevron at its end, the helper text
 * under it, and status, disabled and read-only as KozmosInput's. Until
 * 2026-10-21 it was Material's OutlinedTextField, its label floating inside,
 * that opened the framework's DatePickerDialog in the Activity's theme.
 *
 * [mixed] (GAP-255, decision 188): the field stands for several dates that differ and shows
 * [mixedLabel] in place of its own, said once as its state; the dialog opens
 * with no date chosen, and a confirmed date is the edit. [onResetMixed]
 * offers [resetMixedLabel] under the field once it is no longer mixed.
 * [KozmosMixedValue] has the whole of it.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KozmosDatePicker(
    date: LocalDate?,
    onDateSelected: (LocalDate) -> Unit,
    modifier: Modifier = Modifier,
    // The product passes its own, translated words; the English default is
    // the repo's convention for a label parameter (as Dialog's closeLabel).
    label: String = "Select Date",
    status: KozmosInputStatus = KozmosInputStatus.Default,
    helperText: String? = null,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    mixed: Boolean = false,
    mixedLabel: String = KozmosMixedValue.LABEL,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL
) {
    val locale = LocalConfiguration.current.locales[0]
    var open by remember { mutableStateOf(false) }

    KozmosPickerField(
        label = label,
        // The app's locale's own medium date, as React's native input writes
        // it: "May 25, 2026", "25.05.2026".
        value = date?.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale)),
        icon = Icons.Default.CalendarToday,
        onOpen = { open = true },
        modifier = modifier,
        status = status,
        helperText = helperText,
        enabled = enabled,
        readOnly = readOnly,
        mixed = mixed,
        mixedLabel = mixedLabel,
        onResetMixed = onResetMixed,
        resetMixedLabel = resetMixedLabel
    )

    if (open) {
        val state = rememberDatePickerState(initialSelectedDateMillis = pickerInitialValue(date, mixed)?.toPickerMillis())
        DatePickerDialog(
            onDismissRequest = { open = false },
            confirmButton = {
                PickerConfirmButton(enabled = state.selectedDateMillis != null) {
                    state.selectedDateMillis?.let { onDateSelected(it.toPickerDate()) }
                    open = false
                }
            },
            dismissButton = { PickerDismissButton { open = false } }
        ) {
            KozmosDatePickerContent(state)
        }
    }
}

/** What the dialog shows: Material's date picker, in the theme's colours. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun KozmosDatePickerContent(state: DatePickerState) {
    DatePicker(state = state)
}
