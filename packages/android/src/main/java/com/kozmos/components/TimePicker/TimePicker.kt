package com.kozmos.components.timepicker

import android.app.TimePickerDialog
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Calendar

@Composable
fun KozmosTimePicker(
    time: LocalTime?,
    onTimeSelected: (LocalTime) -> Unit,
    modifier: Modifier = Modifier,
    // The product passes its own, translated words; the English default is
    // the repo's convention for a label parameter (as Dialog's closeLabel).
    label: String = "Select Time"
) {
    val context = LocalContext.current
    val calendar = Calendar.getInstance()
    
    if (time != null) {
        calendar.set(Calendar.HOUR_OF_DAY, time.hour)
        calendar.set(Calendar.MINUTE, time.minute)
    }

    val timePickerDialog = TimePickerDialog(
        context,
        { _, hourOfDay, minute ->
            onTimeSelected(LocalTime.of(hourOfDay, minute))
        },
        calendar.get(Calendar.HOUR_OF_DAY),
        calendar.get(Calendar.MINUTE),
        false // is24HourView
    )

    val shown = time?.format(DateTimeFormatter.ofPattern("hh:mm a")) ?: ""

    Box(modifier = modifier) {
        OutlinedTextField(
            value = shown,
            onValueChange = {},
            label = { Text(label) },
            readOnly = true,
            trailingIcon = {
                // Decoration, as React's aria-hidden clock: the label names
                // the field. It was described by a fixed English "Select Time".
                Icon(Icons.Default.AccessTime, contentDescription = null)
            },
            // A drawing of the value: TalkBack is told about it by the box a
            // tap opens the dialog on, so the field is one control. It was a
            // second stop, which a double tap only focused.
            modifier = Modifier.fillMaxWidth().clearAndSetSemantics {}
        )
        // What a tap opens the dialog on: a button, named by the label, its
        // time its state. It had no role and no name.
        Box(
            modifier = Modifier
                .matchParentSize()
                .clickable(role = Role.Button) { timePickerDialog.show() }
                .semantics {
                    contentDescription = label
                    if (shown.isNotEmpty()) stateDescription = shown
                }
        )
    }
}
