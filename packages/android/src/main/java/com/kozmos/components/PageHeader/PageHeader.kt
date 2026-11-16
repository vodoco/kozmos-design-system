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
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.dp
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
 * 8 after it, centred on it. The actions, 8 apart, sit at the row's end, 16
 * from the text and centred on the title's first line, so a 44 button makes
 * the header no taller, where the row holds them beside a text 256 wide;
 * where it does not (a phone), they wrap under the text, 16 below it and at
 * its start, as React's do. Right to left, both mirror. TalkBack reads the
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
            // React's row: the text, then the actions 16 after it on the
            // title's line where both fit, and under the text where they
            // don't (PageHeaderRowPolicy).
            val policy = remember(line) { PageHeaderRowPolicy(line) }
            Layout(
                modifier = Modifier.fillMaxWidth(),
                measurePolicy = policy,
                content = {
                    Column {
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
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
                            verticalAlignment = Alignment.CenterVertically,
                            content = actions
                        )
                    }
                }
            )
        }
    }
}

/** The least width React's text column keeps beside the actions: `flex: 1 1 16rem`. */
internal val PageHeaderTextBasis: Dp = 256.dp

/**
 * React's `flex-wrap: wrap; gap: 1rem` row, with the text column's basis
 * 16rem: the actions sit on the title's line, at the end and centred on it,
 * when the row holds the basis, the 16 gap and the actions; otherwise they
 * wrap under the text, 16 below it and at its start (the right, right to
 * left), and the header grows by their height. On the title's line they take
 * no height of their own, so a 44 button makes the header no taller. Actions
 * that draw nothing (an `if` that leaves them out) are none: no gap.
 */
private class PageHeaderRowPolicy(private val line: Dp) : MeasurePolicy {
    override fun MeasureScope.measure(measurables: List<Measurable>, constraints: Constraints): MeasureResult {
        val width = if (constraints.hasBoundedWidth) constraints.maxWidth else constraints.minWidth
        val gap = KozmosDimensions.primitivesLayoutSpacing200.roundToPx()
        val actions = measurables.getOrNull(1)?.measure(Constraints(maxWidth = width))
            ?.takeIf { it.width > 0 && it.height > 0 }
        val onTheLine = actions != null && width >= PageHeaderTextBasis.roundToPx() + gap + actions.width
        val textWidth = if (onTheLine) width - gap - actions!!.width else width
        val text = measurables[0].measure(Constraints(minWidth = textWidth, maxWidth = textWidth))
        val height = when {
            actions == null || onTheLine -> text.height
            else -> text.height + gap + actions.height
        }
        return layout(width, constraints.constrainHeight(height)) {
            text.placeRelative(0, 0)
            if (actions != null) {
                if (onTheLine) {
                    val centre = line.roundToPx() / 2
                    actions.placeRelative(width - actions.width, centre - actions.height / 2)
                } else {
                    actions.placeRelative(0, text.height + gap)
                }
            }
        }
    }
}
