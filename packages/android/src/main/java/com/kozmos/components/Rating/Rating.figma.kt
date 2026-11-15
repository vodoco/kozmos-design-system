package com.kozmos.components.rating

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

// State is the form. Default is the control, whole stars; Readonly is a
// score, which the set draws to the nearest half on the stars (decision 181)
// and KozmosRating(rating = …) takes as a Float.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=512-39747")
@FigmaVariant("State", "Default")
class KozmosRatingConnect {
    @FigmaProperty(FigmaType.Enum, "Value")
    val value: Int = Figma.mapping(
        "0" to 0,
        "1" to 1,
        "2" to 2,
        "3" to 3,
        "4" to 4,
        "5" to 5
    )

    @Composable
    fun ComponentExample() {
        KozmosRating(
            value = value,
            onValueChange = {},
            max = 5
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=512-39747")
@FigmaVariant("State", "Readonly")
class KozmosRatingReadonlyConnect {
    @FigmaProperty(FigmaType.Enum, "Value")
    val rating: Float = Figma.mapping(
        "0" to 0f,
        "0.5" to 0.5f,
        "1" to 1f,
        "1.5" to 1.5f,
        "2" to 2f,
        "2.5" to 2.5f,
        "3" to 3f,
        "3.5" to 3.5f,
        "4" to 4f,
        "4.5" to 4.5f,
        "5" to 5f
    )

    @Composable
    fun ComponentExample() {
        KozmosRating(
            rating = rating,
            max = 5
        )
    }
}
