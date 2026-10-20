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
import androidx.compose.ui.platform.LocalContext
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Calendar

@Composable
fun KozmosDatePicker(
    date: LocalDate?,
    onDateSelected: (LocalDate) -> Unit,
    modifier: Modifier = Modifier,
    // The product's words, or none, as React's optional `label` and SwiftUI's
    // empty default: Kozmos writes no English of its own into the field. It
    // was "Select Date" until 2026-10-20.
    label: String? = null
) {
    val context = LocalContext.current
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
            value = date?.format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) ?: "",
            onValueChange = {},
            label = label?.let { { Text(it) } },
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
