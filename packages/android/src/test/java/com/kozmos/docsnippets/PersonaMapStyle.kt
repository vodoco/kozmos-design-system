// Input.mdx's Compose snippet ("An edit action"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.input.KozmosInput
import com.kozmos.components.input.KozmosInputAction

// Map Personas: a persona's Map Style, read only, with a pencil at the
// field's end. What editing means is the product's: onEdit opens its editor.
@Composable
fun PersonaMapStyle(mapStyle: String, onEdit: () -> Unit) {
    KozmosInput(
        value = mapStyle,
        onValueChange = {},
        label = "Map Style",
        readOnly = true,
        action = KozmosInputAction.Edit(label = "Edit Map Style", onEdit = onEdit)
    )
}
