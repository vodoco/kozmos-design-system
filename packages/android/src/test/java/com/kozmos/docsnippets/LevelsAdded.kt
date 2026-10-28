// Progress.mdx's Compose snippet ("Circular"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.kozmos.components.progress.KozmosProgress
import com.kozmos.components.progress.KozmosProgressShape
import com.kozmos.components.progress.KozmosProgressSize

// A count out of a total: 11 of 15 levels, as a fraction of 1. The label's
// words name the ring for TalkBack; stateDescription says the count.
@Composable
fun LevelsAdded() {
    KozmosProgress(
        progress = 11f / 15f,
        modifier = Modifier.semantics { stateDescription = "11 of 15" },
        shape = KozmosProgressShape.Circular,
        size = KozmosProgressSize.Lg
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("11", fontSize = 30.sp, fontWeight = FontWeight.SemiBold)
            Text("Levels Added in total", fontSize = 12.sp)
        }
    }
}
