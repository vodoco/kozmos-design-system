package com.kozmos.components.link

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.text.InlineTextContent
import androidx.compose.foundation.text.appendInlineContent
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.Placeholder
import androidx.compose.ui.text.PlaceholderVerticalAlign
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.em
import com.kozmos.components.icon.KozmosPointrIcons
import com.kozmos.tokens.KozmosThemeTokens

/**
 * Underlined text in the theme colour; a press calls [onClick].
 *
 * @param external The link leaves the app (GAP-202, decision 122): Pointr's
 *   new-tab icon, `link-external-01`, after its last word, in its colour and
 *   the text's size, and [externalLabel] as the click's label. Where it goes
 *   is still [onClick]'s.
 * @param externalLabel The click's label when [external], which TalkBack
 *   reads as "Double-tap to open in your browser": "open in your browser" by
 *   default. Pass the product's own words; empty, TalkBack says its own.
 */
@Composable
fun KozmosLink(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    external: Boolean = false,
    externalLabel: String = "open in your browser"
) {
    // Theme-coloured text on a surface is theme/600, as React's is
    // (decision 59): theme/500 read 3.13:1 on the dark greys.
    val color = KozmosThemeTokens.primitivesColorsTheme600
    if (!external) {
        Text(
            text = text,
            color = color,
            textDecoration = TextDecoration.Underline,
            modifier = modifier.clickable { onClick() }
        )
        return
    }
    val mirrored = LocalLayoutDirection.current == LayoutDirection.Rtl
    Text(
        // A no-break space joins the icon to the last word, so the icon never
        // starts a line alone, and is the gap before it. The icon stands in
        // for a word joiner, which TalkBack does not read.
        text = buildAnnotatedString {
            append(text)
            append('\u00A0')
            appendInlineContent(EXTERNAL_ICON, alternateText = "\u2060")
        },
        inlineContent = mapOf(
            EXTERNAL_ICON to InlineTextContent(
                // The text's size, centred on its line, as React's 1em icon is.
                Placeholder(1.em, 1.em, PlaceholderVerticalAlign.TextCenter)
            ) {
                Icon(
                    imageVector = KozmosPointrIcons.LinkExternal01,
                    contentDescription = null,
                    tint = color,
                    // It points to the link's end: mirrored right to left, as
                    // Material's AutoMirrored OpenInNew is.
                    modifier = Modifier.fillMaxSize().scale(scaleX = if (mirrored) -1f else 1f, scaleY = 1f)
                )
            }
        ),
        color = color,
        textDecoration = TextDecoration.Underline,
        modifier = modifier.clickable(onClickLabel = externalLabel.ifEmpty { null }) { onClick() }
    )
}

/** The inline content's key for the new-tab icon. */
internal const val EXTERNAL_ICON = "kozmos-link-external"
