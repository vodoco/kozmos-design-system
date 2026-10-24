// Alert.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.alert.KozmosAlert
import com.kozmos.components.alert.KozmosAlertContent
import com.kozmos.components.alert.KozmosAlertDescription
import com.kozmos.components.alert.KozmosAlertIcon
import com.kozmos.components.alert.KozmosAlertTitle

// The icon, title and description take the alert's status: its icon and
// its colour. It announces nothing: it is part of the page, as React's is
// by default.
@Composable
fun ClosingTimeAlert() {
    KozmosAlert {
        KozmosAlertIcon()
        KozmosAlertContent {
            KozmosAlertTitle(title = "Heads up!")
            KozmosAlertDescription(description = "The venue closes at 18:00 today.")
        }
    }
}
