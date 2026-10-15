package com.kozmos.components.poiresultcard

import android.os.SystemClock

/**
 * Tells a result's second tap from its first (decision 72, GAP-143), for a
 * card given `onOpen`. The first tap selects at once: no waiting to see
 * whether a second follows, as a double-tap detector would. A second tap on
 * the same result within the platform's double-tap time opens it, once, and
 * is not a second selection; taps that keep coming that quickly after it do
 * nothing, as the web ignores a third click. A tap after a pause, or on
 * another result, selects again.
 *
 * [now] is the clock, in milliseconds: the uptime touch events are timed by,
 * and a test's own.
 */
internal class KozmosResultTapGate(private val now: () -> Long = { SystemClock.uptimeMillis() }) {
    enum class Tap { Select, Open, Ignore }

    private var lastKey: String? = null
    private var lastAt = 0L
    private var opened = false

    /** What a tap on the result [key] does, [timeoutMillis] being the double-tap time. */
    fun tap(key: String, timeoutMillis: Long): Tap {
        val time = now()
        val quick = key == lastKey && time - lastAt < timeoutMillis
        val tap = when {
            !quick -> Tap.Select
            opened -> Tap.Ignore
            else -> Tap.Open
        }
        lastKey = key
        lastAt = time
        opened = tap != Tap.Select
        return tap
    }
}
