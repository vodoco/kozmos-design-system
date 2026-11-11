package com.kozmos.components.notice

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.components.icon.resolveIconVector
import com.kozmos.components.spinner.KozmosSpinner
import com.kozmos.components.spinner.KozmosSpinnerSize
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * What a notice is about, React's `Notice.tone`: [Warning], the default,
 * [Info], [Critical] and [Success] (GAP-160). Each draws its own mark:
 * `alert-triangle`, `info-circle`, `alert-circle` and `check`, Toast's for
 * the same four tones.
 */
enum class KozmosNoticeTone { Warning, Info, Critical, Success }

/**
 * Where the work a notice reports on has got, React's `Notice.status`
 * (GAP-160): [Progress] turns the system's loading arc where the tone's mark
 * is; [Done] draws a check at the summary's inline end, in the tone's
 * colour, in place of the mark at its start. Null reports no work.
 */
enum class KozmosNoticeStatus { Progress, Done }

/**
 * Where the mark sits beside the summary, React's `iconAlign`: [Start] on
 * the first line of a summary that wraps; [Center] centred on a one-line
 * summary that holds a control (GAP-118).
 */
enum class KozmosNoticeIconAlign { Start, Center }

/**
 * How loudly a notice announces itself, React's `Notice.live`: [Polite],
 * the default; [Assertive] interrupts, for an emergency and nothing else;
 * [Off] is no live region.
 */
enum class KozmosNoticeLive { Off, Polite, Assertive }

/**
 * The mark a notice draws at its start: the tone's own, none (and no
 * column), or the product's.
 */
sealed interface KozmosNoticeIcon {
    /** The tone's own mark, the default. */
    data object Tone : KozmosNoticeIcon

    /** No mark, and no empty column before the summary (GAP-118). */
    data object None : KozmosNoticeIcon

    /** The product's own mark, drawn at 16 in the tone's colour. */
    class Custom(val content: @Composable () -> Unit) : KozmosNoticeIcon
}

/** What a notice resolves to before any colour is chosen, so it can be tested without drawing. */
internal data class KozmosNoticeAppearance(val mark: Mark, val busy: Boolean, val trailingCheck: Boolean) {
    enum class Mark { None, Spinner, Tone, Custom }

    companion object {
        fun of(status: KozmosNoticeStatus?, icon: KozmosNoticeIcon): KozmosNoticeAppearance = when {
            status == KozmosNoticeStatus.Progress -> KozmosNoticeAppearance(Mark.Spinner, busy = true, trailingCheck = false)
            icon is KozmosNoticeIcon.Custom ->
                KozmosNoticeAppearance(Mark.Custom, busy = false, trailingCheck = status == KozmosNoticeStatus.Done)
            icon is KozmosNoticeIcon.None || status == KozmosNoticeStatus.Done ->
                KozmosNoticeAppearance(Mark.None, busy = false, trailingCheck = status == KozmosNoticeStatus.Done)
            else -> KozmosNoticeAppearance(Mark.Tone, busy = false, trailingCheck = false)
        }
    }
}

/** The tone's own mark, by Kozmos icon name. */
internal fun kozmosNoticeToneIcon(tone: KozmosNoticeTone): String = when (tone) {
    KozmosNoticeTone.Warning -> "alert-triangle"
    KozmosNoticeTone.Info -> "info-circle"
    KozmosNoticeTone.Critical -> "alert-circle"
    KozmosNoticeTone.Success -> "check"
}

/** The tone's text and mark colour: its emotion's text role, 4.5:1 on the page. */
@Composable
@ReadOnlyComposable
internal fun kozmosNoticeInk(tone: KozmosNoticeTone): Color = when (tone) {
    KozmosNoticeTone.Warning -> KozmosThemeTokens.semanticsEmotionAlertText
    KozmosNoticeTone.Info -> KozmosThemeTokens.semanticsEmotionInformativeText
    KozmosNoticeTone.Critical -> KozmosThemeTokens.semanticsEmotionDangerText
    KozmosNoticeTone.Success -> KozmosThemeTokens.semanticsEmotionSuccessText
}

/**
 * The tone's edge and fill colour, React's `border-*` / `bg-*`: alert 800,
 * info 700, danger 600 and success 800.
 */
@Composable
@ReadOnlyComposable
internal fun kozmosNoticeHue(tone: KozmosNoticeTone): Color = when (tone) {
    KozmosNoticeTone.Warning -> KozmosThemeTokens.primitivesColorsEmotionalAlert800
    KozmosNoticeTone.Info -> KozmosThemeTokens.primitivesColorsEmotionalInfo700
    KozmosNoticeTone.Critical -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
    KozmosNoticeTone.Success -> KozmosThemeTokens.primitivesColorsEmotionalSuccess800
}

/** The edge's strength: React's `/50`, and `/60` for critical. */
internal fun kozmosNoticeEdgeAlpha(tone: KozmosNoticeTone): Float = if (tone == KozmosNoticeTone.Critical) 0.6f else 0.5f

/** React's `h-3.5` chevron on "More": the icon scale has no 14, as on the web. */
private val NoticeChevronSize = 14.dp

/** The fill's strength, React's `/5`. */
internal const val KozmosNoticeFillAlpha = 0.05f

/**
 * A short notice that opens for the long version: React's `Notice`, on
 * Compose (GAP-142, GAP-160).
 *
 * One line, [summary], always shown, with the tone's mark at its start;
 * [detail] behind a "More" disclosure ([expandLabel]) unless [collapsible] is
 * false; [action] under the text, as "Call 112" on the emergency notice or
 * "Set Building Boundary" (GAP-033). A container's corner, 20; a 1 edge in
 * the tone's colour at half strength; a 5% fill of it; 12 at the sides and
 * 8 above and below; the mark 16, 8 from the summary; the summary 14
 * semibold, the detail 14 regular 6 under it, the action 12 under the text,
 * all in the tone's text colour.
 *
 * [status] Progress turns the loading arc in the mark's place and stands it
 * still with animations off; Done ends the summary in a check at its inline
 * end and draws no mark at its start unless [icon] is the product's own.
 * The marks say nothing to TalkBack: the summary's words say it.
 *
 * Expansion is uncontrolled from [defaultExpanded], or controlled with
 * [expanded] and [onExpandedChange]. The whole notice is a live region,
 * polite unless [live] says otherwise.
 */
@Composable
fun KozmosNotice(
    summary: String,
    modifier: Modifier = Modifier,
    detail: String? = null,
    tone: KozmosNoticeTone = KozmosNoticeTone.Warning,
    status: KozmosNoticeStatus? = null,
    icon: KozmosNoticeIcon = KozmosNoticeIcon.Tone,
    iconAlign: KozmosNoticeIconAlign = KozmosNoticeIconAlign.Start,
    collapsible: Boolean = true,
    defaultExpanded: Boolean = false,
    expanded: Boolean? = null,
    onExpandedChange: ((Boolean) -> Unit)? = null,
    expandLabel: String = "More",
    live: KozmosNoticeLive = KozmosNoticeLive.Polite,
    action: (@Composable () -> Unit)? = null
) = KozmosNotice(
    summary = { Text(summary) },
    modifier = modifier,
    detail = detail,
    tone = tone,
    status = status,
    icon = icon,
    iconAlign = iconAlign,
    collapsible = collapsible,
    defaultExpanded = defaultExpanded,
    expanded = expanded,
    onExpandedChange = onExpandedChange,
    expandLabel = expandLabel,
    live = live,
    action = action
)

/**
 * [KozmosNotice] with a summary of the product's own: a line that holds a
 * control, as "Not finding it? [Search with AI]" (GAP-118). It is drawn in
 * the summary's style and the tone's colour unless it says otherwise.
 */
@Composable
fun KozmosNotice(
    summary: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    detail: String? = null,
    tone: KozmosNoticeTone = KozmosNoticeTone.Warning,
    status: KozmosNoticeStatus? = null,
    icon: KozmosNoticeIcon = KozmosNoticeIcon.Tone,
    iconAlign: KozmosNoticeIconAlign = KozmosNoticeIconAlign.Start,
    collapsible: Boolean = true,
    defaultExpanded: Boolean = false,
    expanded: Boolean? = null,
    onExpandedChange: ((Boolean) -> Unit)? = null,
    expandLabel: String = "More",
    live: KozmosNoticeLive = KozmosNoticeLive.Polite,
    action: (@Composable () -> Unit)? = null
) {
    var uncontrolled by remember { mutableStateOf(defaultExpanded) }
    val open = expanded ?: uncontrolled
    val toggle: () -> Unit = {
        val next = !open
        if (expanded == null) uncontrolled = next
        onExpandedChange?.invoke(next)
    }
    val hasDetail = !detail.isNullOrEmpty()
    val detailShown = hasDetail && (!collapsible || open)
    val appearance = KozmosNoticeAppearance.of(status, icon)
    val drawsMark = appearance.mark != KozmosNoticeAppearance.Mark.None
    val ink = kozmosNoticeInk(tone)
    val hue = kozmosNoticeHue(tone)
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer)
    val markGap = KozmosDimensions.primitivesLayoutSpacing100
    val markSize = KozmosDimensions.primitivesLayoutSizing200
    // The detail and the action start where the summary does.
    val indent = if (drawsMark) markSize + markGap else KozmosDimensions.primitivesLayoutSpacing0
    val body = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp, lineHeight = 19.sp)

    CompositionLocalProvider(LocalContentColor provides ink, LocalTextStyle provides body) {
        Column(
            modifier
                .fillMaxWidth()
                .semantics {
                    when (live) {
                        KozmosNoticeLive.Polite -> liveRegion = LiveRegionMode.Polite
                        KozmosNoticeLive.Assertive -> liveRegion = LiveRegionMode.Assertive
                        KozmosNoticeLive.Off -> Unit
                    }
                }
                .background(hue.copy(alpha = KozmosNoticeFillAlpha), shape)
                .border(1.dp, hue.copy(alpha = kozmosNoticeEdgeAlpha(tone)), shape)
                .padding(
                    horizontal = KozmosDimensions.primitivesLayoutSpacing150,
                    vertical = KozmosDimensions.primitivesLayoutSpacing100
                )
        ) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(markGap),
                verticalAlignment = if (iconAlign == KozmosNoticeIconAlign.Center) Alignment.CenterVertically else Alignment.Top
            ) {
                if (drawsMark) {
                    Box(
                        Modifier
                            .then(if (iconAlign == KozmosNoticeIconAlign.Start) Modifier.padding(top = KozmosDimensions.primitivesLayoutSpacing25) else Modifier)
                            .size(markSize)
                            .clearAndSetSemantics {},
                        contentAlignment = Alignment.Center
                    ) {
                        when (appearance.mark) {
                            KozmosNoticeAppearance.Mark.Spinner -> KozmosSpinner(size = KozmosSpinnerSize.Sm, color = ink)
                            KozmosNoticeAppearance.Mark.Custom -> (icon as KozmosNoticeIcon.Custom).content()
                            else -> Icon(resolveIconVector(kozmosNoticeToneIcon(tone)), contentDescription = null, tint = ink, modifier = Modifier.size(markSize))
                        }
                    }
                }
                Box(Modifier.weight(1f)) {
                    CompositionLocalProvider(LocalTextStyle provides body.copy(fontWeight = FontWeight.SemiBold)) {
                        summary()
                    }
                }
                if (hasDetail && collapsible) {
                    Row(
                        Modifier
                            .minimumInteractiveComponentSize()
                            .clickable(role = Role.Button, onClickLabel = expandLabel, onClick = toggle)
                            .semantics(mergeDescendants = true) {
                                if (open) collapse { toggle(); true } else expand { toggle(); true }
                            },
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
                    ) {
                        Text(expandLabel, style = body.copy(fontSize = 12.sp, lineHeight = 16.sp, fontWeight = FontWeight.SemiBold))
                        Icon(
                            resolveIconVector("chevron-down"),
                            contentDescription = null,
                            tint = ink,
                            modifier = Modifier.size(NoticeChevronSize).rotate(if (open) 180f else 0f)
                        )
                    }
                }
                if (appearance.trailingCheck) {
                    Icon(
                        resolveIconVector("check"),
                        contentDescription = null,
                        tint = ink,
                        modifier = Modifier
                            .then(if (iconAlign == KozmosNoticeIconAlign.Start) Modifier.padding(top = KozmosDimensions.primitivesLayoutSpacing25) else Modifier)
                            .size(markSize)
                            .clearAndSetSemantics {}
                    )
                }
            }
            if (detailShown) {
                Text(
                    detail!!,
                    textAlign = TextAlign.Start,
                    modifier = Modifier.padding(start = indent, top = KozmosDimensions.primitivesLayoutSpacing75)
                )
            }
            if (action != null) {
                Box(Modifier.padding(start = indent, top = KozmosDimensions.primitivesLayoutSpacing150)) { action() }
            }
        }
    }
}
