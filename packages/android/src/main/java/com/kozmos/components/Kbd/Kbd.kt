package com.kozmos.components.kbd

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosTypography

/**
 * One key drawn as a key cap and read by its name (GAP-156): "Esc" is drawn
 * as a key and TalkBack reads "Escape".
 *
 * @param key The glyph on the cap, as the caller writes it: "Esc", "⌘".
 * @param label What TalkBack reads instead of the key's spoken name.
 */
@Composable
fun KozmosKbd(
    key: String,
    modifier: Modifier = Modifier,
    label: String? = null
) {
    KozmosKbd(keys = listOf(key), modifier = modifier, label = label)
}

/**
 * A combination of keys pressed together, drawn as caps with a "+" between
 * and read by the keys' names joined with "+": `listOf("Ctrl", "C")` reads
 * "Control+C". One TalkBack node; the caller writes the glyph a platform
 * uses (⌘ or Ctrl): nothing is mapped.
 *
 * Drawn as React's `<Kbd>` is: a cap 20 tall and at least 20 wide, 4 either
 * side of its glyph, the marker radius, a 1dp border in the border colour on
 * the muted fill, its glyph 12/16 medium in the foreground colour. Caps sit 4
 * apart with the "+" in the muted foreground.
 *
 * @param label What TalkBack reads instead of the keys' spoken names.
 */
@Composable
fun KozmosKbd(
    keys: List<String>,
    modifier: Modifier = Modifier,
    label: String? = null
) {
    val spoken = label ?: keys.joinToString("+") { kozmosKbdSpokenName(it) }
    // React's text-xs font-medium: 12 on a 16 line, in the platform's font.
    val style = TextStyle(
        fontFamily = KozmosTypography.family,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        fontWeight = FontWeight.Medium
    )
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusMarker)
    Row(
        // One node, read by the keys' names; the glyphs are not read.
        modifier = modifier.clearAndSetSemantics { contentDescription = spoken },
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50),
        verticalAlignment = Alignment.CenterVertically
    ) {
        keys.forEachIndexed { index, key ->
            if (index > 0) {
                Text(text = "+", style = style, color = KozmosThemeTokens.primitivesColorsForeground400)
            }
            Box(
                // React's h-5 min-w-5: 20 tall, at least 20 wide. No token is 20.
                modifier = Modifier
                    .heightIn(min = 20.dp)
                    .widthIn(min = 20.dp)
                    .background(KozmosThemeTokens.primitivesColorsBackground100, shape)
                    .border(1.dp, KozmosThemeTokens.semanticsBorderSubtle, shape)
                    .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing50),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = key,
                    style = style,
                    color = KozmosThemeTokens.primitivesColorsForeground0,
                    maxLines = 1
                )
            }
        }
    }
}

/**
 * A key's spoken name, English by default: exact for symbols, any case for
 * words; any other key is read as written.
 */
internal fun kozmosKbdSpokenName(key: String): String = KBD_SPOKEN_NAMES[key.lowercase()] ?: key

/** The names, by the key lowercased; a symbol is its own lower case. */
private val KBD_SPOKEN_NAMES = mapOf(
    "esc" to "Escape",
    "ctrl" to "Control",
    "cmd" to "Command",
    "⌘" to "Command",
    "opt" to "Option",
    "⌥" to "Option",
    "⇧" to "Shift",
    "⌃" to "Control",
    "↵" to "Enter",
    "⏎" to "Enter",
    "⌫" to "Backspace",
    "bksp" to "Backspace",
    "del" to "Delete",
    "⌦" to "Delete",
    "⇥" to "Tab",
    "↑" to "Up arrow",
    "↓" to "Down arrow",
    "←" to "Left arrow",
    "→" to "Right arrow",
    "pgup" to "Page up",
    "pgdn" to "Page down",
    "␣" to "Space",
    "ins" to "Insert",
    "⇪" to "Caps lock",
    "win" to "Windows"
)
