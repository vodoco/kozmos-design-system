package com.kozmos.components.datepicker

import android.app.DatePickerDialog
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Calendar

@Composable
fun KozmosDatePicker(
    date: LocalDate?,
    onDateSelected: (LocalDate) -> Unit,
    modifier: Modifier = Modifier,
    // The product passes its own, translated words; the English default is
    // the repo's convention for a label parameter (as Dialog's closeLabel).
    label: String = "Select Date"
) {
    val context = LocalContext.current
    val locale = LocalConfiguration.current.locales[0]
    val calendar = Calendar.getInstance()
    
    if (date != null) {
        calendar.set(date.year, date.monthValue - 1, date.dayOfMonth)
    }

    val datePickerDialog = DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            onDateSelected(LocalDate.of(year, month + 1, dayOfMonth))
        },
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH),
        calendar.get(Calendar.DAY_OF_MONTH)
    )

    Box(modifier = modifier) {
        OutlinedTextField(
            // The app's locale's own medium date, as React's native input
            // writes it: "May 25, 2026", "25.05.2026". It was "MMM dd, yyyy",
            // US order in every locale.
            value = date?.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale)) ?: "",
            onValueChange = {},
            label = { Text(label) },
            readOnly = true,
            trailingIcon = {
                // Decoration, as React's aria-hidden calendar: the label names
                // the field. It was described by a fixed English "Select Date".
                Icon(Icons.Default.CalendarToday, contentDescription = null)
            },
            modifier = Modifier.fillMaxWidth(),
            interactionSource = remember { MutableInteractionSource() }
                .also { interactionSource ->
                     // Handle click via a transparent overlay or similar if readOnly blocks click
                     // But strictly, readOnly TextField still accepts focus. 
                     // Common pattern is clickable modifier on the Box or TextField.
                }
        )
        // Overlay to capture click
        Box(
            modifier = Modifier
                .matchParentSize()
                .clickable { datePickerDialog.show() }
        )
    }
}
