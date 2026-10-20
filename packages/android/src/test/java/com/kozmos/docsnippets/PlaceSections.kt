// Separator.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import com.kozmos.components.separator.KozmosSeparator
import com.kozmos.components.text.KozmosText
import com.kozmos.tokens.KozmosDimensions

// A line between two sections. Between the items of a row it is
// KozmosSeparator(orientation = SeparatorOrientation.Vertical).
@Composable
fun PlaceSections() {
    Column(verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)) {
        KozmosText(text = "Opening hours")
        KozmosSeparator()
        KozmosText(text = "Monday–Friday, 09:00–18:00")
    }
}
