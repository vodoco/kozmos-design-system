package com.kozmos.components.timepicker

import android.text.format.DateFormat
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.TimePicker
import androidx.compose.material3.TimePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.kozmos.components.KozmosPickerField
import com.kozmos.components.PickerConfirmButton
import com.kozmos.components.PickerDismissButton
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.tokens.KozmosDimensions
import java.time.LocalTime
import java.time.format.DateTimeFormatter

/**
 * The device's 24-hour setting, when a test sets it: layoutlib, which
 * Paparazzi draws with, answers `DateFormat.is24HourFormat` with false
 * whatever the setting and the locale. Unset, the device decides.
 */
internal val LocalKozmosClockIs24Hour = staticCompositionLocalOf<Boolean?> { null }

/**
 * A time, in a Kozmos field that opens Material 3's time picker in a dialog,
 * coloured by the Kozmos theme around it (decision 106). The field is
 * React's: the label above, the time in the locale's short style on the
 * device's clock, a clock at its start and Figma's chevron at its end, the
 * helper text under it, and status, disabled and read-only as KozmosInput's.
 * Until 2026-10-21 it was Material's OutlinedTextField, its label floating
 * inside, that opened the framework's TimePickerDialog in the Activity's
 * theme.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KozmosTimePicker(
    time: LocalTime?,
    onTimeSelected: (LocalTime) -> Unit,
    modifier: Modifier = Modifier,
    // The product passes its own, translated words; the English default is
    // the repo's convention for a label parameter (as Dialog's closeLabel).
    label: String = "Select Time",
    status: KozmosInputStatus = KozmosInputStatus.Default,
    helperText: String? = null,
    enabled: Boolean = true,
    readOnly: Boolean = false
) {
    val context = LocalContext.current
    val locale = LocalConfiguration.current.locales[0]
    // The device's clock: its 24-hour setting, or else its locale's own. The
    // dialog and the field both keep it.
    val is24Hour = LocalKozmosClockIs24Hour.current ?: DateFormat.is24HourFormat(context)
    var open by remember { mutableStateOf(false) }

    // The locale's own short time on that clock, as Android's TextClock
    // makes it: "9:30 PM", "21:30".
    val pattern = DateFormat.getBestDateTimePattern(locale, if (is24Hour) "Hm" else "hm")
    KozmosPickerField(
        label = label,
        value = time?.format(DateTimeFormatter.ofPattern(pattern, locale)),
        icon = Icons.Default.AccessTime,
        onOpen = { open = true },
        modifier = modifier,
        status = status,
        helperText = helperText,
        enabled = enabled,
        readOnly = readOnly
    )

    if (open) {
        val state = rememberTimePickerState(
            initialHour = time?.hour ?: 0,
            initialMinute = time?.minute ?: 0,
            is24Hour = is24Hour
        )
        // Material 3 has a time picker and no dialog for it: this is its
        // date picker dialog's shape, colour and buttons around it.
        Dialog(onDismissRequest = { open = false }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
            Surface(shape = MaterialTheme.shapes.extraLarge, color = MaterialTheme.colorScheme.surface, tonalElevation = 6.dp) {
                Column(
                    modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing300),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    KozmosTimePickerContent(state)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        PickerDismissButton { open = false }
                        PickerConfirmButton {
                            onTimeSelected(LocalTime.of(state.hour, state.minute))
                            open = false
                        }
                    }
                }
            }
        }
    }
}

/** What the dialog shows: Material's time picker, in the theme's colours. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun KozmosTimePickerContent(state: TimePickerState) {
    TimePicker(state = state)
}
