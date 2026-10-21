package com.kozmos.providers

import androidx.compose.runtime.compositionLocalOf

data class KozmosAnalyticsEvent(
    val component: String,
    val eventName: String,
    val properties: Map<String, String>? = null
) {
    /**
     * When the event was made, which a part does as it happens: milliseconds
     * since 1970, as React's `timestamp`. Declared here, not in the
     * constructor, so it is no part of `equals`, `hashCode` or `copy`: two
     * events of the same part, name and properties are equal, as they always
     * were. A copy is stamped when it is made.
     */
    val timestamp: Long = System.currentTimeMillis()
}

typealias KozmosAnalyticsTracker = (KozmosAnalyticsEvent) -> Unit

val LocalKozmosAnalytics = compositionLocalOf<KozmosAnalyticsTracker> {
    { event ->
        // Native fallback closure protecting composables detached from explicit telemetry anchors natively.
        println("[Kozmos Analytics] ${event.component} -> ${event.eventName}")
    }
}
