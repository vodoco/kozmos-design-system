package com.kozmos.components.text

import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp

/**
 * Which step of the type ramp a piece of text sits on: the steps of SwiftUI's
 * `KozmosTextStyle`, so a caller names a step rather than reaching past the
 * component for a font.
 *
 * Each is the Material role Compose's own parts draw that step in, so a
 * screen's text matches the parts beside it: title3 is Card's title,
 * headline WayfindingCard's and Alert's titles, subheadline the descriptions
 * of Toast, Card and Alert, footnote MapStatusPill's 13sp on 16sp lines,
 * caption Tag's 12sp, caption2 BottomNavigation's labels, and title2 the step
 * above title3. They scale with the reader's font size, as Material's roles
 * do.
 */
enum class KozmosTextStyle {
    Title2,
    Title3,
    Headline,
    Body,
    Subheadline,
    Footnote,
    Caption,
    Caption2;

    internal val textStyle: TextStyle
        @Composable
        @ReadOnlyComposable
        get() = when (this) {
            Title2 -> MaterialTheme.typography.headlineSmall
            Title3 -> MaterialTheme.typography.titleLarge
            Headline -> MaterialTheme.typography.titleMedium
            Body -> MaterialTheme.typography.bodyLarge
            Subheadline -> MaterialTheme.typography.bodyMedium
            Footnote -> MaterialTheme.typography.bodySmall.copy(fontSize = 13.sp, lineHeight = 16.sp)
            Caption -> MaterialTheme.typography.bodySmall
            Caption2 -> MaterialTheme.typography.labelSmall
        }
}

@Composable
fun KozmosText(
    text: String,
    modifier: Modifier = Modifier,
    // The step on the type ramp, as SwiftUI's style. Left out, the words draw
    // in the text style around them, as they always did: body text on a
    // page, under KozmosMaterialTheme. Last, so a call by position still
    // compiles.
    style: KozmosTextStyle? = null
) {
    Text(text = text, modifier = modifier, style = style?.textStyle ?: LocalTextStyle.current)
}
