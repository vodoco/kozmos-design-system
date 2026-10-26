// AnalyticsProvider.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.KozmosAnalyticsProvider

// The events of the parts inside arrive in batches, each 2000ms after its
// first event by default, and what is left when this leaves the
// composition. onDispatch is called on the main thread.
@Composable
fun TrackedApp(send: (List<KozmosAnalyticsEvent>) -> Unit, content: @Composable () -> Unit) {
    KozmosAnalyticsProvider(onDispatch = send) {
        content()
    }
}
