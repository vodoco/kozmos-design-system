package com.kozmos.components.datepicker

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import java.time.LocalDate

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=438-4292")
class KozmosDatePickerConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Date"

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Focus" to "focus",
        "Disabled" to "disabled",
        "Readonly" to "readonly",
        "Mixed" to "mixed"
    )

    // GAP-255: Reset Mixed, Mixed Text and Reset Mixed Text are mapped once
    // the owner's plugin Update has put them in the library.

    @Composable
    fun ComponentExample() {
        KozmosDatePicker(
            date = LocalDate.of(2026, 5, 25),
            onDateSelected = {},
            label = label,
            enabled = state != "disabled",
            readOnly = state == "readonly",
            mixed = state == "mixed"
        )
    }
}
