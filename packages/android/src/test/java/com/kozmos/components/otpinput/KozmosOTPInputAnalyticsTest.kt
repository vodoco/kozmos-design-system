package com.kozmos.components.otpinput

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import com.kozmos.components.LiveSemantics
import com.kozmos.components.live
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's `otp_code_completed` on Compose: the field reports a code completed
 * once, when the user's typing or paste fills the last empty cell, with its
 * `length` as a string, as Compose's event properties are. Not again while a
 * full code is edited; again once it has been cleared and completed; never for
 * a code the host passes as `value`, and once when the user completes a
 * partial code the host passed; never for a code a shorter `length` makes full.
 *
 * The host holds the code, as a product does, and some tests set it as the
 * host. The field is typed into through its SetText action, as TalkBack and an
 * IME's commit do: the whole of its new text, a digit longer each time for
 * typing, the whole code at once for a paste.
 *
 * Every test ends with a completion the user makes, which is reported, so
 * against the field before it reported anything each fails, those that
 * expect silence among them.
 */
class KozmosOTPInputAnalyticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val events = mutableListOf<KozmosAnalyticsEvent>()

    private fun completion(length: String) =
        KozmosAnalyticsEvent(component = "OTPInput", eventName = "otp_code_completed", properties = mapOf("length" to length))

    /**
     * The field, held by a host that keeps [code]: by default it takes every
     * change the field hands it, or [onValueChange] decides.
     */
    private fun otp(
        code: MutableState<String>,
        length: MutableState<Int> = mutableStateOf(6),
        onValueChange: ((String) -> Unit)? = null,
        script: suspend LiveSemantics.() -> Unit
    ) = paparazzi.live(durationMillis = 8000, content = {
        KozmosMaterialTheme {
            CompositionLocalProvider(LocalKozmosAnalytics provides { events += it }) {
                KozmosOTPInput(value = code.value, onValueChange = onValueChange ?: { code.value = it }, length = length.value)
            }
        }
    }, script = script)

    /** Puts [text] in the field, as a paste over its whole text or an IME's commit does. */
    private suspend fun LiveSemantics.enter(text: String) {
        val field = read().merged.single { it.setText != null }
        assertTrue("the field took no text", field.setText!!.invoke(text))
        frames(2)
    }

    /** Types [digits] one by one after what the field shows. */
    private suspend fun LiveSemantics.type(digits: String) {
        for (digit in digits) {
            val shown = read().merged.single { it.setText != null }.editableText.orEmpty()
            enter(shown + digit)
        }
    }

    @Test
    fun typingTheLastDigitReportsTheCodeOnce() {
        val code = mutableStateOf("")
        otp(code) {
            type("12345")
            assertEquals("five digits of six were reported", emptyList<KozmosAnalyticsEvent>(), events)
            type("6")
            assertEquals("123456", code.value)
            assertEquals(listOf(completion(length = "6")), events)
        }
    }

    @Test
    fun pastingAFullCodeReportsItOnce() {
        val code = mutableStateOf("")
        otp(code) {
            enter("123-456")
            assertEquals("123456", code.value)
            assertEquals(listOf(completion(length = "6")), events)
        }
    }

    @Test
    fun aPartialCodeReportsNothing() {
        val code = mutableStateOf("")
        otp(code, length = mutableStateOf(4)) {
            type("12")
            enter("123")
            assertEquals("a partial code was reported", emptyList<KozmosAnalyticsEvent>(), events)
            type("4")
            assertEquals(listOf(completion(length = "4")), events)
        }
    }

    @Test
    fun editingAFullCodeReportsNothingMore() {
        val code = mutableStateOf("")
        otp(code) {
            type("123456")
            assertEquals(listOf(completion(length = "6")), events)
            enter("123457")
            type("8")
            enter("923457")
            assertEquals("923457", code.value)
            assertEquals("an edit to the full code was reported", listOf(completion(length = "6")), events)
        }
    }

    @Test
    fun clearingAndCompletingReportsAgain() {
        val code = mutableStateOf("")
        otp(code) {
            enter("123456")
            enter("")
            assertEquals("", code.value)
            assertEquals("clearing was reported", listOf(completion(length = "6")), events)
            type("654321")
            assertEquals(List(2) { completion(length = "6") }, events)
            // A digit taken back and typed again empties the last cell and fills it.
            enter("65432")
            type("1")
            assertEquals(List(3) { completion(length = "6") }, events)
        }
    }

    @Test
    fun aFullCodeTheHostSetsReportsNothing() {
        val code = mutableStateOf("123456")
        otp(code) {
            frames(2)
            code.value = "654321"
            frames(2)
            code.value = ""
            frames(2)
            code.value = "111111"
            frames(2)
            assertEquals("a code the host set was reported", emptyList<KozmosAnalyticsEvent>(), events)
            // The host's full code, edited by the user, is still no completion of theirs.
            enter("111112")
            assertEquals("an edit to the host's full code was reported", emptyList<KozmosAnalyticsEvent>(), events)
            enter("")
            type("123456")
            assertEquals(listOf(completion(length = "6")), events)
        }
    }

    @Test
    fun aPartialCodeTheHostSetsReportsOnceTheUserCompletesIt() {
        val code = mutableStateOf("")
        otp(code) {
            code.value = "123"
            frames(2)
            assertEquals("a partial code the host set was reported", emptyList<KozmosAnalyticsEvent>(), events)
            type("456")
            assertEquals("123456", code.value)
            assertEquals(listOf(completion(length = "6")), events)
        }
    }

    @Test
    fun aCodeAShorterLengthMakesFullReportsNothing() {
        val code = mutableStateOf("")
        val length = mutableStateOf(8)
        otp(code, length) {
            type("123456")
            length.value = 6
            frames(2)
            enter("123457")
            assertEquals("a code a shorter length made full was reported", emptyList<KozmosAnalyticsEvent>(), events)
            enter("")
            type("123456")
            assertEquals(listOf(completion(length = "6")), events)
        }
    }

    /**
     * Two edits before a recomposition, each making a full code from the code
     * last drawn, are one completion: the second is measured against what the
     * first passed on.
     */
    @Test
    fun twoEditsBeforeARecompositionReportOneCompletion() {
        val code = mutableStateOf("")
        otp(code) {
            type("12345")
            val field = read().merged.single { it.setText != null }
            assertTrue(field.setText!!.invoke("123456"))
            assertTrue(field.setText!!.invoke("1234567"))
            frames(2)
            assertEquals("123456", code.value)
            assertEquals(listOf(completion(length = "6")), events)
        }
    }

    /**
     * A host that takes the code a frame or more later, as one updating
     * through a view model may, hears one completion, though the field shows
     * its old code again meanwhile and the user, seeing five digits, types a
     * sixth again. (The same sixth digit again is no edit to the field.)
     */
    @Test
    fun aHostThatTakesTheCodeLaterHearsOneCompletion() {
        val code = mutableStateOf("12345")
        val pending = mutableListOf<String>()
        otp(code, onValueChange = { pending += it }) {
            enter("123456")
            assertEquals("the host took the code at once", "12345", code.value)
            assertEquals("12345", read().merged.single { it.setText != null }.editableText)
            type("7")
            assertEquals(listOf("123456", "123457"), pending)
            code.value = pending.last()
            frames(2)
            assertEquals("123457", code.value)
            assertEquals(listOf(completion(length = "6")), events)
        }
    }
}
