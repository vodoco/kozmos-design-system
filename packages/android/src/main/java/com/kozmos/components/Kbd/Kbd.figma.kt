package com.kozmos.components.kbd

import androidx.compose.runtime.Composable
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

// GAP-156: Keys is the form. Single is one cap; Combination is caps joined by
// a "+", Modifier Text the first of `keys` and Key Text the last.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11942")
@FigmaVariant("Keys", "Single")
class KozmosKbdSingleConnect {
    @FigmaProperty(FigmaType.Text, "Key Text")
    val keyText: String = "Esc"

    @Composable
    fun ComponentExample() {
        KozmosKbd(key = keyText)
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11942")
@FigmaVariant("Keys", "Combination")
class KozmosKbdCombinationConnect {
    @FigmaProperty(FigmaType.Text, "Key Text")
    val keyText: String = "C"

    @FigmaProperty(FigmaType.Text, "Modifier Text")
    val modifierText: String = "Ctrl"

    @Composable
    fun ComponentExample() {
        KozmosKbd(keys = listOf(modifierText, keyText))
    }
}
