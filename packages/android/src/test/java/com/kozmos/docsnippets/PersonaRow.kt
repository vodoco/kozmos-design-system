// PersonaMark.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import com.kozmos.components.personamark.KozmosPersonaMark
import com.kozmos.components.text.KozmosText
import com.kozmos.tokens.KozmosDimensions

// Beside the persona's name the mark is decoration: TalkBack reads this row
// "Customer". With name, a mark standing alone is an image named by the
// persona; KozmosPersonaMarkGroup draws a row's personas, read
// "Assigned personas: Customer, Visitor".
@Composable
fun PersonaRow() {
    Row(
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
        verticalAlignment = Alignment.CenterVertically
    ) {
        KozmosPersonaMark(color = Color(0xFFFF9800))
        KozmosText(text = "Customer")
    }
}
