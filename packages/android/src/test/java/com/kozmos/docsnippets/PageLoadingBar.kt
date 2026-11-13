// Progress.mdx's Compose snippet ("At the top of the page"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.kozmos.components.progress.KozmosProgress
import com.kozmos.components.progress.KozmosProgressPlacement

// The screen's loading bar: no value, so a segment sweeps from the inline
// start, and stands still with animations off. Placement Top is 4 tall and
// square; the caller puts it at the top. TalkBack hears "Loading the map"
// once, as the wait starts.
@Composable
fun PageLoadingBar(loading: Boolean, content: @Composable () -> Unit) {
    Box {
        content()
        if (loading) {
            KozmosProgress(
                modifier = Modifier.align(Alignment.TopCenter),
                placement = KozmosProgressPlacement.Top,
                label = "Loading the map"
            )
        }
    }
}
