package com.kozmos.components.pageheader

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp
import com.kozmos.components.container.KozmosContainer
import com.kozmos.components.container.KozmosContainerBlock
import com.kozmos.components.container.KozmosContainerBlockInset
import com.kozmos.components.container.KozmosContainerInset
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * How a page header's band is painted (GAP-036, decision 135), as React's
 * `PageHeader tone`. [Subtle], the default, is the pale theme tint, theme 0,
 * of KozmosCardHeader's subtle strip; [Default] paints none, for a header on
 * the page's own background.
 */
enum class KozmosPageHeaderTone {
    Subtle,
    Default
}

/**
 * How large a page header's title is drawn, as React's `PageHeader size`:
 * [Lg] Heading 2's 30 on a 36 line, for a landing page such as Home; [Md],
 * the default, Heading 3's 24 on a 32 line, for a page within a section.
 */
enum class KozmosPageHeaderSize(internal val fontSize: TextUnit, internal val lineHeight: TextUnit) {
    Lg(30.sp, 36.sp),
    Md(24.sp, 32.sp)
}

/**
 * The top of a page (GAP-036, decision 135): a [breadcrumb], the page's
 * [title] with an [info] button beside it, a [description], and the page's
 * [actions], on a band across the page. Its content sits in a
 * [KozmosContainer] with [inset] at the sides and the block inset (GAP-116)
 * 32 above and 24 below, so it lines up with the page under it.
 *
 * The title is a heading: TalkBack says "heading" after it, and its headings
 * navigation stops on it. The info button sits on the title's first line,
 * 8 after it, and the actions at the row's end, 8 apart and 16 from the text,
 * each centred on the title's first line, so a 44 button makes the header no
 * taller. Right to left, the actions are at the left. TalkBack reads the
 * breadcrumb, the title, the info button, the description, then the actions.
 * A slot left out draws nothing.
 */
@Composable
fun KozmosPageHeader(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    tone: KozmosPageHeaderTone = KozmosPageHeaderTone.Subtle,
    size: KozmosPageHeaderSize = KozmosPageHeaderSize.Md,
    inset: KozmosContainerInset = KozmosContainerInset.Window,
    breadcrumb: (@Composable () -> Unit)? = null,
    info: (@Composable () -> Unit)? = null,
    actions: (@Composable RowScope.() -> Unit)? = null
) {
    val band = when (tone) {
        KozmosPageHeaderTone.Subtle -> Modifier.background(KozmosThemeTokens.primitivesColorsTheme0)
        KozmosPageHeaderTone.Default -> Modifier
    }
    // The title's line, which grows with the reader's font scale: the info
    // button and the actions are centred on it.
    val line: Dp = with(LocalDensity.current) { size.lineHeight.toDp() }
    KozmosContainer(
        inset,
        modifier.fillMaxWidth().then(band),
        block = KozmosContainerBlock(KozmosContainerBlockInset.Lg, KozmosContainerBlockInset.Md)
    ) {
        Column(Modifier.fillMaxWidth()) {
            if (breadcrumb != null) {
                Box(Modifier.padding(bottom = KozmosDimensions.primitivesLayoutSpacing100)) { breadcrumb() }
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200),
                verticalAlignment = Alignment.Top
            ) {
                Column(Modifier.weight(1f)) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
                        verticalAlignment = Alignment.Top
                    ) {
                        Text(
                            text = title,
                            modifier = Modifier.weight(1f, fill = false).semantics { heading() },
                            color = KozmosThemeTokens.primitivesColorsForeground100,
                            // Exactly the line, as React's: no font padding
                            // above a 30 on its 36.
                            style = TextStyle(
                                fontSize = size.fontSize,
                                lineHeight = size.lineHeight,
                                fontWeight = FontWeight.Bold,
                                platformStyle = PlatformTextStyle(includeFontPadding = false),
                                lineHeightStyle = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.None)
                            )
                        )
                        if (info != null) {
                            Box(Modifier.height(line), contentAlignment = Alignment.Center) {
                                Box(Modifier.wrapContentHeight(unbounded = true)) { info() }
                            }
                        }
                    }
                    if (description != null) {
                        Text(
                            text = description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = KozmosThemeTokens.primitivesColorsForeground400,
                            modifier = Modifier.padding(top = KozmosDimensions.primitivesLayoutSpacing50)
                        )
                    }
                }
                if (actions != null) {
                    // A taller action spills past the title's line evenly.
                    Box(Modifier.height(line), contentAlignment = Alignment.Center) {
                        Row(
                            modifier = Modifier.wrapContentHeight(unbounded = true),
                            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
                            verticalAlignment = Alignment.CenterVertically,
                            content = actions
                        )
                    }
                }
            }
        }
    }
}
