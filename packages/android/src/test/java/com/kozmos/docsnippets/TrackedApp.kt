// AnalyticsProvider.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics

// Compose has no batching provider: the tracker gets each event of the
// parts inside as it happens.
@Composable
fun TrackedApp(send: (KozmosAnalyticsEvent) -> Unit, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalKozmosAnalytics provides { event -> send(event) }) {
        content()
    }
}
