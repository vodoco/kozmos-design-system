package com.kozmos.utils

import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.intl.LocaleList
import androidx.compose.ui.text.withStyle

/**
 * A phrase TalkBack says, and the BCP 47 language to say it in when that
 * differs from the interface's: a result's authored name, or the summary the
 * model wrote in the query's language. Null or empty is the interface's.
 */
internal data class KozmosSpokenPhrase(val text: String, val lang: String? = null)

/**
 * [text] tagged with [lang], as drawn and as spoken: the SpanStyle's
 * LocaleList is what Compose hands TalkBack as a LocaleSpan over exactly
 * these words, the technique [instructionAnnotatedText] uses for an
 * instruction's parts. Plain when there is no language.
 */
internal fun kozmosLocalizedText(text: String, lang: String?): AnnotatedString {
    val tag = lang?.takeIf { it.isNotEmpty() } ?: return AnnotatedString(text)
    return buildAnnotatedString { withStyle(SpanStyle(localeList = LocaleList(tag))) { append(text) } }
}

/** [phrases] as one accessible text, ", " between them, each in its own language. */
internal fun kozmosSpokenText(phrases: List<KozmosSpokenPhrase>): AnnotatedString = buildAnnotatedString {
    phrases.forEachIndexed { index, phrase ->
        if (index > 0) append(", ")
        append(kozmosLocalizedText(phrase.text, phrase.lang))
    }
}

/** Whether any phrase is in a language other than the interface's. */
internal fun List<KozmosSpokenPhrase>.speaksAnotherLanguage(): Boolean = any { !it.lang.isNullOrEmpty() }
