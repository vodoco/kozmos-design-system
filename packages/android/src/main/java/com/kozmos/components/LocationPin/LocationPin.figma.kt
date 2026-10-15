package com.kozmos.components.locationpin

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

// The SDK's map result markers (decision 71): Kind is Result, Featured or
// Place; State is Default or Selected; Content, on a Result only, is Number
// or Dot. A Result with Content=Dot has no number. The place's State is
// always Default: selected changes nothing on it.

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6847")
@FigmaVariant("Kind", "Result")
@FigmaVariant("Content", "Number")
class KozmosLocationPinResultConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Cafe"

    @FigmaProperty(FigmaType.Text, "Number Text")
    val numberText: String = "12"

    @FigmaProperty(FigmaType.Enum, "State")
    val selected: Boolean = Figma.mapping("Default" to false, "Selected" to true)

    @Composable
    fun ComponentExample() {
        KozmosLocationPin(
            label = label,
            number = numberText.toInt(),
            selected = selected
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6847")
@FigmaVariant("Kind", "Result")
@FigmaVariant("Content", "Dot")
class KozmosLocationPinResultDotConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Cafe"

    @FigmaProperty(FigmaType.Enum, "State")
    val selected: Boolean = Figma.mapping("Default" to false, "Selected" to true)

    @Composable
    fun ComponentExample() {
        KozmosLocationPin(
            label = label,
            selected = selected
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6847")
@FigmaVariant("Kind", "Featured")
class KozmosLocationPinFeaturedConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Cafe"

    @FigmaProperty(FigmaType.Enum, "State")
    val selected: Boolean = Figma.mapping("Default" to false, "Selected" to true)

    // The tile's logo is markerContent, the place's image: Figma's tile is
    // the empty one.
    @Composable
    fun ComponentExample() {
        KozmosLocationPin(
            label = label,
            selected = selected,
            featured = true
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6847")
@FigmaVariant("Kind", "Place")
class KozmosLocationPinPlaceConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Cafe"

    @Composable
    fun ComponentExample() {
        KozmosLocationPin(
            label = label,
            place = true
        )
    }
}
