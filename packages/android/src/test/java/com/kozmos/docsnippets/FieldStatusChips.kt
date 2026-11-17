// Chip.mdx's Compose snippet ("Emotions"), word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.KozmosEmotion
import com.kozmos.components.chip.KozmosChip
import com.kozmos.components.chip.KozmosChipGroup

@Composable
fun FieldStatusChips(onToggleNew: () -> Unit, onRemoveDeletion: () -> Unit) {
    KozmosChipGroup {
        KozmosChip(
            text = "New",
            emotion = KozmosEmotion.Informative,
            selected = true,
            onClick = onToggleNew
        )
        KozmosChip(
            text = "Marked for Deletion",
            emotion = KozmosEmotion.Danger,
            onRemove = onRemoveDeletion
        )
    }
}
