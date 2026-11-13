// Radio.mdx's Compose snippet ("Cards and tiles"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project, and read by
// ControlDescriptionDocSnippetsTest. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Map
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kozmos.components.radio.KozmosRadioGroup
import com.kozmos.components.radio.KozmosRadioGroupItem
import com.kozmos.components.radio.KozmosRadioGroupItemVariant

// Each card is one radio, named by its title, its description read after it;
// the media is drawn and not read. Use Tile for a grid of short choices.
@Composable
fun MapStyleCards() {
    var style by remember { mutableStateOf("vector") }
    KozmosRadioGroup {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            KozmosRadioGroupItem(
                value = "vector",
                selectedValue = style,
                onOptionSelected = { style = it },
                label = "Vector",
                description = "Drawn from the building's plans",
                variant = KozmosRadioGroupItemVariant.Card,
                media = { Icon(Icons.Default.Map, contentDescription = null) },
                modifier = Modifier.weight(1f)
            )
            KozmosRadioGroupItem(
                value = "satellite",
                selectedValue = style,
                onOptionSelected = { style = it },
                label = "Satellite",
                description = "Aerial imagery under the plans",
                variant = KozmosRadioGroupItemVariant.Card,
                media = { Icon(Icons.Default.Layers, contentDescription = null) },
                modifier = Modifier.weight(1f)
            )
        }
    }
}
