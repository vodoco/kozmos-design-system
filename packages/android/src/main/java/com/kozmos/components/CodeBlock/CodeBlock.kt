package com.kozmos.components.codeblock

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosTypography
import kotlinx.coroutines.delay

/** CodeBlock's measures (GAP-216): 12 inside, a 44 copy 4 in from the block's top end. */
object KozmosCodeBlockDefaults {
    val padding = KozmosDimensions.primitivesLayoutSpacing150
    val copySize = 44.dp
    val copyInset = KozmosDimensions.primitivesLayoutSpacing50
}

/** How long the copy's check stays, as the web's. */
private const val CopiedMillis = 2000L

/**
 * A read-only block of code (GAP-216, decision 225), as React's `CodeBlock`:
 * [code] in the mono family ([KozmosTypography.mono]), in the foreground on
 * the muted surface (background/100), on the control radius, 12 inside. Long
 * lines wrap (the default); with [wrap] off each line stays whole and the
 * block scrolls sideways. With [maxHeight] the block is no taller than it
 * and the code scrolls down inside it, so a long value never pushes the
 * screen; unset (null), the block is as tall as its code. With [copyable], a copy at the top end copies the
 * code and says so in a polite live region, in the product's words
 * ([copyLabel], [copiedLabel]). No syntax colouring: the code is plain text,
 * selectable.
 *
 * MAP-619's merged unit shows a custom field's JSON in one. TalkBack finds a
 * group named [label], Compose's nearest to a named region, holding the code
 * and the copy.
 */
@Composable
fun KozmosCodeBlock(
    code: String,
    label: String,
    modifier: Modifier = Modifier,
    wrap: Boolean = true,
    maxHeight: Dp? = null,
    copyable: Boolean = false,
    copyLabel: String = "Copy",
    copiedLabel: String = "Copied",
    onCopy: ((String) -> Unit)? = null
) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(KozmosThemeTokens.primitivesColorsBackground100, shape)
            .semantics {
                paneTitle = label
                isTraversalGroup = true
            }
    ) {
        val endPadding = if (copyable) {
            KozmosCodeBlockDefaults.copySize + KozmosCodeBlockDefaults.copyInset
        } else {
            KozmosCodeBlockDefaults.padding
        }
        val sideways = if (wrap) Modifier else Modifier.horizontalScroll(rememberScrollState())
        val down = if (maxHeight == null) Modifier else Modifier.heightIn(max = maxHeight).verticalScroll(rememberScrollState())
        val scroller = down.then(sideways)
        Box(Modifier.fillMaxWidth().then(scroller)) {
            SelectionContainer {
                Text(
                    text = code,
                    style = MaterialTheme.typography.bodyMedium,
                    fontFamily = KozmosTypography.mono,
                    color = KozmosThemeTokens.primitivesColorsForeground0,
                    softWrap = wrap,
                    modifier = Modifier.padding(
                        start = KozmosCodeBlockDefaults.padding,
                        top = KozmosCodeBlockDefaults.padding,
                        bottom = KozmosCodeBlockDefaults.padding,
                        // The code is kept clear of the copy.
                        end = endPadding
                    )
                )
            }
        }
        if (copyable) {
            KozmosCodeBlockCopy(
                code = code,
                copyLabel = copyLabel,
                copiedLabel = copiedLabel,
                onCopy = onCopy,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(KozmosCodeBlockDefaults.copyInset)
            )
        }
    }
}

/** The copy: as Input's, a 44 button and a polite live region that says it copied. */
@Composable
private fun KozmosCodeBlockCopy(
    code: String,
    copyLabel: String,
    copiedLabel: String,
    onCopy: ((String) -> Unit)?,
    modifier: Modifier
) {
    val clipboard = LocalClipboardManager.current
    var copies by remember { mutableIntStateOf(0) }
    var said by remember { mutableStateOf("") }
    LaunchedEffect(copies) {
        if (copies == 0) return@LaunchedEffect
        delay(CopiedMillis)
        copies = 0
        said = ""
    }
    Box(modifier.size(KozmosCodeBlockDefaults.copySize)) {
        Box(
            modifier = Modifier
                .matchParentSize()
                .clickable(role = Role.Button) {
                    clipboard.setText(AnnotatedString(code))
                    // The same words twice are not read twice: a second copy
                    // changes them by a no-break space, as the web's.
                    said = if (said == copiedLabel) "$copiedLabel\u00a0" else copiedLabel
                    copies += 1
                    onCopy?.invoke(code)
                }
                .semantics { contentDescription = copyLabel },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (copies > 0) Icons.Default.Check else Icons.Default.ContentCopy,
                contentDescription = null,
                tint = KozmosThemeTokens.primitivesColorsForeground400,
                modifier = Modifier.size(16.dp)
            )
        }
        // In the page from the start, so the change is read.
        Box(Modifier.size(1.dp).clearAndSetSemantics {
            liveRegion = LiveRegionMode.Polite
            if (said.isNotEmpty()) contentDescription = said
        })
    }
}
