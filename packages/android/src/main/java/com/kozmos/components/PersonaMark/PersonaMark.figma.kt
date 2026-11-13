package com.kozmos.components.personamark

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaVariant

// GAP-106: a new set, so its node id is written once the importer has built
// it in the live file; until then this file stays out of
// figma.linked.config.json. Form is the mark's form: Single is one persona's
// diamond, Group the diamonds of the personas a row is visible to. The
// colour is the persona's, product data that Figma holds as the diamond's
// fill, not as a property.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD")
@FigmaVariant("Form", "Single")
class KozmosPersonaMarkSingleConnect {
    @Composable
    fun ComponentExample() {
        KozmosPersonaMark(color = Color(0xFFFF9800))
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD")
@FigmaVariant("Form", "Group")
class KozmosPersonaMarkGroupConnect {
    @Composable
    fun ComponentExample() {
        KozmosPersonaMarkGroup(
            personas = listOf(
                KozmosPersonaMarkPersona(name = "Customer", color = Color(0xFFFF9800)),
                KozmosPersonaMarkPersona(name = "Visitor", color = Color(0xFF2196F3)),
                KozmosPersonaMarkPersona(name = "Staff", color = Color(0xFF4CAF50))
            )
        )
    }
}
