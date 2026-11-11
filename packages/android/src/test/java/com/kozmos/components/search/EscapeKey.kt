package com.kozmos.components.search

import android.view.KeyEvent

/**
 * An Escape press from a hardware keyboard. Its character is none, said here:
 * the text field asks for it, and layoutlib cannot load a key character map,
 * so a plain KeyEvent that reaches the field throws instead of passing on.
 */
internal fun escapeKey(action: Int): KeyEvent = hardwareKey(action, KeyEvent.KEYCODE_ESCAPE)

/** Any key from a hardware keyboard, with no character, as [escapeKey]. */
internal fun hardwareKey(action: Int, code: Int): KeyEvent = object : KeyEvent(action, code) {
    override fun getUnicodeChar(metaState: Int): Int = 0
}
