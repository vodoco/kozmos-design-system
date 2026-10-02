package com.kozmos.components.instruction

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.intl.LocaleList
import androidx.compose.ui.text.withStyle
import com.kozmos.contracts.KozmosInstructionPart
import com.kozmos.contracts.KozmosInstructionPartRole
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.LocalKozmosSurfaceStyle
import com.kozmos.components.surface.kozmosMutedForeground

/** Inline styles retain a single sentence's shaping, wrapping and exact supplied ordering. */
@Composable
internal fun instructionAnnotatedText(
    parts: List<KozmosInstructionPart>,
    surface: KozmosSurfaceStyle? = LocalKozmosSurfaceStyle.current
): AnnotatedString {
    val muted = kozmosMutedForeground(surface)
    return buildAnnotatedString {
        parts.forEach { part ->
            withStyle(SpanStyle(
                color = if (part.role == KozmosInstructionPartRole.Secondary) muted else Color.Unspecified,
                fontWeight = if (part.role == KozmosInstructionPartRole.Secondary) FontWeight.Normal else null,
                localeList = part.lang?.takeIf { it.isNotEmpty() }?.let { LocaleList(it) }
            )) { append(part.text) }
        }
    }
}

internal fun List<KozmosInstructionPart>.hasSpeechLanguage(): Boolean = any { !it.lang.isNullOrEmpty() }
