package com.kozmos.components.daterangepicker

import android.app.DatePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Calendar

data class KozmosDateRangeValue(
    val start: LocalDate? = null,
    val end: LocalDate? = null
)

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
    expanded: Boolean = false
) {
    val statusColor = dateRangeStatusColor(status)
    // The app's locale's own short date, for a field half the row wide:
    // "5/25/26", "25.05.26". It was "MMM d, yyyy" in Locale.US.
    val dates = DateTimeFormatter.ofLocalizedDate(FormatStyle.SHORT)
        .withLocale(LocalConfiguration.current.locales[0])
    val helperColor = when {
        !enabled -> KozmosThemeTokens.primitivesColorsForeground500
        statusColor != null -> statusColor
        else -> KozmosThemeTokens.primitivesColorsForeground500
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
            DateRangeField(
                label = startLabel,
                value = value.start,
                dates = dates,
                enabled = enabled,
                readOnly = readOnly,
                status = status,
                modifier = Modifier.weight(1f),
                onDateSelected = { onValueChange(value.copy(start = it)) }
            )
            DateRangeField(
                label = endLabel,
                value = value.end,
                dates = dates,
                enabled = enabled,
                readOnly = readOnly,
                status = status,
                modifier = Modifier.weight(1f),
                onDateSelected = { onValueChange(value.copy(end = it)) }
            )
        }

        if (expanded) {
            DateRangePreview(
                value = value,
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
}

@Composable
private fun DateRangeField(
    label: String,
    value: LocalDate?,
    dates: DateTimeFormatter,
    enabled: Boolean,
    readOnly: Boolean,
    status: KozmosInputStatus,
    modifier: Modifier = Modifier,
    onDateSelected: (LocalDate) -> Unit
) {
    val context = LocalContext.current
    val calendar = Calendar.getInstance()
    if (value != null) {
        calendar.set(value.year, value.monthValue - 1, value.dayOfMonth)
    }
    val dialog = DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            onDateSelected(LocalDate.of(year, month + 1, dayOfMonth))
        },
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH),
        calendar.get(Calendar.DAY_OF_MONTH)
    )
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val borderColor = dateRangeStatusColor(status) ?: KozmosThemeTokens.semanticsBorderInput
    val background = if (!enabled || readOnly) {
        KozmosThemeTokens.primitivesColorsBackground100
    } else {
        KozmosThemeTokens.primitivesColorsBackground0
    }
    val textColor = if (enabled) {
        KozmosThemeTokens.primitivesColorsForeground0
    } else {
        KozmosThemeTokens.primitivesColorsForeground500
    }
    val iconColor = if (enabled) {
        KozmosThemeTokens.primitivesColorsForeground400
    } else {
        KozmosThemeTokens.primitivesColorsForeground500
    }

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = if (enabled) KozmosThemeTokens.primitivesColorsForeground100 else KozmosThemeTokens.primitivesColorsForeground500,
            // The field carries this name; heard here too, it is said twice.
            modifier = Modifier.clearAndSetSemantics { }
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp)
                .background(background, shape)
                .border(1.dp, borderColor, shape)
                // One control, named by the field's label: with no date it
                // shows no words, and wrote a fixed English "Select date".
                .clickable(enabled = enabled && !readOnly, role = Role.Button) { dialog.show() }
                .semantics { contentDescription = label }
                .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing150),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
        ) {
            Icon(
                imageVector = Icons.Default.CalendarToday,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(18.dp)
            )
            if (value != null) {
                Text(
                    text = value.format(dates),
                    style = MaterialTheme.typography.bodyMedium,
                    color = textColor,
                    maxLines = 1
                )
            }
        }
    }
}

@Composable
private fun DateRangePreview(
    value: KozmosDateRangeValue,
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
            text = "${value.start?.format(dates) ?: startLabel} – ${value.end?.format(dates) ?: endLabel}",
            style = MaterialTheme.typography.bodySmall,
            color = textColor
        )
        Spacer(modifier = Modifier.weight(1f))
    }
}

@Composable
private fun dateRangeStatusColor(status: KozmosInputStatus): Color? = when (status) {
    KozmosInputStatus.Error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
    KozmosInputStatus.Warning -> KozmosThemeTokens.primitivesColorsEmotionalAlert600
    KozmosInputStatus.Success -> KozmosThemeTokens.primitivesColorsEmotionalSuccess600
    KozmosInputStatus.Default -> null
}
