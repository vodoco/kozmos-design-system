// Notice.mdx's Compose snippet ("Success, progress and done"), word for word
// below the package line: compiled here, so a renamed or removed parameter
// fails in this target rather than in a reader's project. Change the two
// together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.components.notice.KozmosNotice
import com.kozmos.components.notice.KozmosNoticeStatus
import com.kozmos.components.notice.KozmosNoticeTone
import com.kozmos.tokens.KozmosDimensions

// The geometry notices: a warning with its action under the words, the
// arc turning while the geometry saves, and a success that ends in a check.
@Composable
fun GeometryNotices(onSetBoundary: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)) {
        KozmosNotice(
            summary = "Set Geometry",
            action = {
                KozmosButton(onClick = onSetBoundary, variant = KozmosButtonVariant.Outline) {
                    Text("Set Building Boundary")
                }
            }
        )
        KozmosNotice(
            summary = "Saving the geometry",
            tone = KozmosNoticeTone.Info,
            status = KozmosNoticeStatus.Progress
        )
        KozmosNotice(
            summary = "Geometry is set",
            tone = KozmosNoticeTone.Success,
            status = KozmosNoticeStatus.Done
        )
    }
}
