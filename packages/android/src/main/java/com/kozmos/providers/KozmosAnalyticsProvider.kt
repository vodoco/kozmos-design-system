package com.kozmos.providers

import android.os.Handler
import android.os.Looper
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember

/**
 * Compose's `AnalyticsProvider`: the events of the Kozmos parts inside
 * [content] reach [onDispatch] in batches, as React's `AnalyticsProvider` and
 * SwiftUI's `.kozmosAnalytics(batchDelayMs:onDispatch:)` hand them on.
 *
 * - The first event, when no batch is open, opens one, and the batch is
 *   delivered [batchDelayMs] after it (2000 by default) with every event
 *   tracked meanwhile, in the order tracked. A later event does not move the
 *   delivery, so a steady stream arrives every [batchDelayMs], not when it
 *   stops. An event after the delivery opens the next batch.
 * - When the provider leaves the composition, whatever it still holds is
 *   delivered then, as React's provider flushes when it unmounts. It does not
 *   deliver early when the app moves to the background.
 * - It puts a tracker in [LocalKozmosAnalytics], so every part inside sends
 *   to it, and a product's own event sent through `LocalKozmosAnalytics.current`
 *   joins the same batches. A nested provider takes its own subtree's events,
 *   and the one above it gets none of them.
 *
 * [onDispatch] is called on the main thread; an event tracked on another
 * thread is queued there. The newest [onDispatch] gets each batch, and a
 * change of [batchDelayMs] applies from the next batch.
 */
@Composable
fun KozmosAnalyticsProvider(
    onDispatch: (List<KozmosAnalyticsEvent>) -> Unit,
    batchDelayMs: Long = 2000,
    content: @Composable () -> Unit
) = KozmosAnalyticsProvider(onDispatch, batchDelayMs, MainLooperSchedule, content)

/** As the public provider, on [schedule]: a test passes a clock it moves by hand. */
@Composable
internal fun KozmosAnalyticsProvider(
    onDispatch: (List<KozmosAnalyticsEvent>) -> Unit,
    batchDelayMs: Long = 2000,
    schedule: KozmosAnalyticsSchedule,
    content: @Composable () -> Unit
) {
    val engine = remember(schedule) { KozmosAnalyticsBatcher(batchDelayMs, onDispatch, schedule) }
    // The newest closure and delay, as React's provider reads its newest props.
    SideEffect {
        engine.onDispatch = onDispatch
        engine.batchDelayMs = batchDelayMs
    }
    DisposableEffect(engine) { onDispose { engine.flush() } }
    val tracker: KozmosAnalyticsTracker = remember(engine) {
        { event -> onMainThread { engine.track(event) } }
    }
    CompositionLocalProvider(LocalKozmosAnalytics provides tracker, content = content)
}

/** Runs `fire` after a delay and returns a way to call it off. */
internal fun interface KozmosAnalyticsSchedule {
    fun after(delayMs: Long, fire: () -> Unit): () -> Unit
}

/**
 * The batching itself, on the main thread: SwiftUI's `KozmosAnalytics` engine.
 * It keeps no Compose state, so it can be tested on a plain JVM clock.
 */
internal class KozmosAnalyticsBatcher(
    /** The wait from a batch's first event to its delivery; a change applies from the next batch. */
    var batchDelayMs: Long,
    /** Read when a batch is delivered. */
    var onDispatch: (List<KozmosAnalyticsEvent>) -> Unit,
    private val schedule: KozmosAnalyticsSchedule
) {
    private val queue = mutableListOf<KozmosAnalyticsEvent>()
    private var cancelDelivery: (() -> Unit)? = null

    fun track(event: KozmosAnalyticsEvent) {
        queue += event
        if (cancelDelivery == null) {
            cancelDelivery = schedule.after(batchDelayMs.coerceAtLeast(0)) {
                cancelDelivery = null
                flush()
            }
        }
    }

    /** Delivers the open batch now; the next event opens a new one. */
    fun flush() {
        cancelDelivery?.invoke()
        cancelDelivery = null
        if (queue.isEmpty()) return
        val batch = queue.toList()
        queue.clear()
        onDispatch(batch)
    }
}

private val mainHandler by lazy { Handler(Looper.getMainLooper()) }

private fun onMainThread(body: () -> Unit) {
    if (Looper.myLooper() == Looper.getMainLooper()) body() else mainHandler.post(body)
}

/** The main looper's clock: what the provider runs on in an app. */
private object MainLooperSchedule : KozmosAnalyticsSchedule {
    override fun after(delayMs: Long, fire: () -> Unit): () -> Unit {
        val run = Runnable(fire)
        mainHandler.postDelayed(run, delayMs)
        return { mainHandler.removeCallbacks(run) }
    }
}
