package com.kozmos.components.mapcontrolbutton

import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Reveals something for a while after a value changes, then closes it again.
 *
 * React's `useRevealOnChange`, for Compose. A map mode toggle rests icon-only;
 * when its mode changes it widens to say which mode it is now, holds long
 * enough to be read, and collapses so it stops covering the map. That is
 * timing, not appearance, so it lives here rather than in
 * [KozmosMapControlButton] — and apart from any composable, so the timing can
 * be tested on a clock the test moves by hand.
 *
 * The first value it is shown never reveals: a control that announces its
 * state on arrival is announcing something the visitor did not just do.
 *
 * A change of the duration or delay applies from the next change of value; a
 * window that is already open keeps the timing it opened with.
 *
 * [schedule] runs its action after a number of milliseconds and returns a way
 * to call it off.
 */
internal class KozmosRevealOnChange(
    private val schedule: (delayMillis: Long, fire: () -> Unit) -> () -> Unit
) {
    /** Whether the caller should be showing its label right now. */
    var revealed by mutableStateOf(false)
        private set

    private var observed: Any? = null
    private var hasObserved = false
    private var cancelPending: (() -> Unit)? = null

    /**
     * Tells the reveal what the control shows now, every time that may have
     * changed. Only a change of [value] opens it; turning [enabled] off closes
     * it, and turning it back on replays nothing.
     */
    fun observe(value: Any?, enabled: Boolean, durationMillis: Long = 2500L, delayMillis: Long = 0L) {
        val changed = hasObserved && observed != value
        hasObserved = true
        observed = value

        if (!enabled) {
            // Off mid-reveal closes rather than freezes.
            cancel()
            revealed = false
            return
        }
        if (!changed) return

        // A second change restarts the window rather than stacking another on
        // it: the first reveal's close would otherwise cut the second short.
        cancel()
        cancelPending = schedule(delayMillis) {
            revealed = true
            cancelPending = schedule(durationMillis) {
                revealed = false
                cancelPending = null
            }
        }
    }

    private fun cancel() {
        cancelPending?.invoke()
        cancelPending = null
    }
}

/**
 * Whether a control that reveals on change should be showing its label now.
 *
 * The timers run in the composition's own scope, so they stop when the control
 * leaves. They are not the system's animator: turning animations off stops the
 * control growing, not the reveal — the new state is still said, and still
 * said for as long.
 */
@Composable
internal fun rememberRevealOnChange(
    value: Any?,
    enabled: Boolean,
    durationMillis: Long,
    delayMillis: Long
): Boolean {
    val scope = rememberCoroutineScope()
    val reveal = remember {
        KozmosRevealOnChange { wait, fire ->
            val job = scope.launch {
                delay(wait)
                fire()
            }
            return@KozmosRevealOnChange { job.cancel() }
        }
    }
    // Every composition tells it what the control shows; only a change acts.
    SideEffect { reveal.observe(value, enabled, durationMillis, delayMillis) }
    return reveal.revealed
}
