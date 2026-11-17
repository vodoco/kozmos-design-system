package com.kozmos.components.daterangepicker

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.input.KozmosInputStatus
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=443-10939")
class KozmosDateRangePickerConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Date range"

    @FigmaProperty(FigmaType.Text, "Start Label Text")
    val startLabel: String = "Start date"

    @FigmaProperty(FigmaType.Text, "End Label Text")
    val endLabel: String = "End date"

    @FigmaProperty(FigmaType.Text, "Start Value Text")
    val startValue: String = "May 21, 2026"

    @FigmaProperty(FigmaType.Text, "End Value Text")
    val endValue: String = "May 25, 2026"

    @FigmaProperty(FigmaType.Text, "Helper Text")
    val helperText: String = "Choose a date range."

    @FigmaProperty(FigmaType.Boolean, "Show Helper Text")
    val showHelperText: Boolean = false

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Focus" to "focus",
        "Disabled" to "disabled",
        "Readonly" to "readonly",
        "Mixed" to "mixed"
    )

    // GAP-255: its way back to the several values, once edited.
    @FigmaProperty(FigmaType.Boolean, "Reset Mixed")
    val resetMixed: Boolean = false

    @FigmaProperty(FigmaType.Text, "Mixed Text")
    val mixedLabel: String = "Multiple values"

    @FigmaProperty(FigmaType.Text, "Reset Mixed Text")
    val resetMixedLabel: String = "Reset to multiple values"

    @FigmaProperty(FigmaType.Enum, "Status")
    val status: KozmosInputStatus = Figma.mapping(
        "Default" to KozmosInputStatus.Default,
        "Error" to KozmosInputStatus.Error,
        "Warning" to KozmosInputStatus.Warning,
        "Success" to KozmosInputStatus.Success
    )

    @FigmaProperty(FigmaType.Enum, "Content")
    val expanded: Boolean = Figma.mapping(
        "Closed" to false,
        "Open" to true
    )

    @Composable
    fun ComponentExample() {
        KozmosDateRangePicker(
            value = KozmosDateRangeValue(
                start = figmaDate(startValue, "2026-05-21"),
                end = figmaDate(endValue, "2026-05-25")
            ),
            onValueChange = {},
            label = label,
            startLabel = startLabel,
            endLabel = endLabel,
            helperText = if (showHelperText) helperText else null,
            enabled = state != "disabled",
            readOnly = state == "readonly",
            status = status,
            expanded = expanded,
            mixed = state == "mixed",
            mixedLabel = mixedLabel,
            onResetMixed = if (resetMixed) ({}) else null,
            resetMixedLabel = resetMixedLabel
        )
    }
}

private val isoDateFormatter: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE
private val displayDateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US)

private fun figmaDate(value: String, fallback: String): LocalDate =
    runCatching { LocalDate.parse(value, isoDateFormatter) }
        .getOrElse {
            runCatching { LocalDate.parse(value, displayDateFormatter) }
                .getOrElse { LocalDate.parse(fallback, isoDateFormatter) }
        }
