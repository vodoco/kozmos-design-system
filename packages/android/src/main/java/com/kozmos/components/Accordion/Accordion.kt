package com.kozmos.components.accordion

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.spring
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.components.motion.KozmosTransitions
import com.kozmos.components.motion.rememberKozmosAnimationsOn
import com.kozmos.components.spinner.KozmosSpinner
import com.kozmos.components.spinner.KozmosSpinnerSize
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

/**
 * How an accordion's sections are drawn, mirroring React's `variant`. Boxed
 * (decision 149) draws each header as a box of its own, 8 apart: a hairline
 * while closed and the theme's darkest fill while open, with the section's
 * content in the page's flow under it.
 */
enum class KozmosAccordionVariant(val value: String) {
    Default("default"),
    Boxed("boxed")
}

private val LocalAccordionVariant = staticCompositionLocalOf { KozmosAccordionVariant.Default }
private val LocalAccordionItemDisabled = staticCompositionLocalOf { false }

@Composable
fun KozmosAccordion(
    modifier: Modifier = Modifier,
    variant: KozmosAccordionVariant = KozmosAccordionVariant.Default,
    content: @Composable ColumnScope.() -> Unit
) {
    val boxed = variant == KozmosAccordionVariant.Boxed
    CompositionLocalProvider(LocalAccordionVariant provides variant) {
        Column(
            modifier = modifier,
            verticalArrangement = if (boxed) {
                Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
            } else {
                Arrangement.Top
            }
        ) {
            content()
        }
    }
}

/**
 * [disabled] takes no press on the item's trigger, as React's item does: its
 * content is left alone, so an open item stays open and its fields live.
 */
@Composable
fun KozmosAccordionItem(
    modifier: Modifier = Modifier,
    disabled: Boolean = false,
    content: @Composable ColumnScope.() -> Unit
) {
    CompositionLocalProvider(LocalAccordionItemDisabled provides disabled) {
        Column(modifier = modifier) {
            content()
        }
    }
}

/**
 * [label] and [icon] are drawn by the boxed form alone: the small line over
 * the title, the product's words, and the mark at the start, 20 square,
 * decoration to TalkBack. [loading] draws a spinner where the chevron is and
 * disables the item while it is set, in either form, and TalkBack reads
 * [loadingLabel] as the trigger's state: Compose has no busy state to set.
 */
@Composable
fun KozmosAccordionTrigger(
    value: String,
    selectedValue: String?,
    onValueChange: (String?) -> Unit,
    title: String,
    modifier: Modifier = Modifier,
    label: String? = null,
    icon: (@Composable () -> Unit)? = null,
    loading: Boolean = false,
    loadingLabel: String = "Loading"
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    val isExpanded = value == selectedValue
    val inert = loading || LocalAccordionItemDisabled.current
    val boxed = LocalAccordionVariant.current == KozmosAccordionVariant.Boxed
    val animationsOn = rememberKozmosAnimationsOn()
    val rotation by animateFloatAsState(
        if (isExpanded) 180f else 0f,
        animationSpec = if (boxed && !animationsOn) snap() else spring(),
        label = "rotation"
    )
    // Guarded here as well as by `enabled`: in Compose 1.6 a disabled node's
    // semantics click still runs its handler.
    val toggle = toggle@{
        if (inert) return@toggle
        if (!isExpanded) {
            trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "Accordion", eventName = "accordion_toggled", properties = mapOf("value" to value.toString())))
            onValueChange(value)
        } else {
            onValueChange(null)
        }
    }
    // A button that says whether its panel is open, as React's trigger with
    // `aria-expanded`: TalkBack reads the expand it offers while closed, and
    // the collapse while open, as the trigger's state, in the visitor's own
    // language. Disabled or loading it offers neither: `enabled` says it is
    // disabled, and loading says so in the product's words.
    val trigger = Modifier
        .fillMaxWidth()
        .clickable(enabled = !inert, role = Role.Button, onClick = toggle)
        .semantics {
            if (loading) stateDescription = loadingLabel
            if (inert) return@semantics
            if (isExpanded) {
                collapse { toggle(); true }
            } else {
                expand { toggle(); true }
            }
        }

    if (boxed) {
        KozmosAccordionBoxedRow(
            modifier = modifier,
            trigger = trigger,
            title = title,
            label = label,
            icon = icon,
            loading = loading,
            inert = inert,
            filled = isExpanded && !inert,
            rotation = rotation
        )
        return
    }

    Column(modifier = modifier) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = trigger.padding(KozmosDimensions.primitivesLayoutSpacing200)
        ) {
            Text(
                text = title,
                modifier = Modifier.weight(1f)
            )
            if (loading) {
                KozmosSpinner(
                    modifier = Modifier.clearAndSetSemantics {},
                    size = KozmosSpinnerSize.Sm,
                    color = LocalContentColor.current
                )
            } else {
                // Decoration, as React's chevron: the state is the trigger's. It
                // was described "Expand" or "Collapse", fixed English that named
                // an action, not the state.
                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = null,
                    modifier = Modifier.rotate(rotation)
                )
            }
        }
        Divider(color = KozmosThemeTokens.primitivesColorsBackground300)
    }
}

/**
 * The boxed form's header: 44 at least, as this platform's targets are and as
 * React's is at touch; the live page's 40 is compact's, which has no
 * counterpart here. 8 inside a hairline that stays, clear, while open, as
 * React's does, so nothing moves.
 */
@Composable
private fun KozmosAccordionBoxedRow(
    modifier: Modifier,
    trigger: Modifier,
    title: String,
    label: String?,
    icon: (@Composable () -> Unit)?,
    loading: Boolean,
    inert: Boolean,
    filled: Boolean,
    rotation: Float
) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    // Foreground 1000 on theme 900 turns over with the theme, so it reads in both.
    val ink = when {
        inert -> KozmosThemeTokens.primitivesColorsForeground400
        filled -> KozmosThemeTokens.primitivesColorsForeground1000
        else -> KozmosThemeTokens.primitivesColorsForeground0
    }
    val labelInk = if (filled) {
        KozmosThemeTokens.primitivesColorsTheme300
    } else {
        KozmosThemeTokens.primitivesColorsForeground400
    }
    val fill = when {
        inert -> KozmosThemeTokens.primitivesColorsBackground100
        filled -> KozmosThemeTokens.primitivesColorsTheme900
        else -> KozmosThemeTokens.primitivesColorsBackground0
    }
    val edge = if (filled) Color.Transparent else KozmosThemeTokens.semanticsBorderSubtle
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 44.dp)
            .clip(shape)
            .background(fill, shape)
            .border(1.dp, edge, shape)
            .then(trigger)
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing100 + 1.dp, vertical = 3.dp)
    ) {
        if (icon != null) {
            Box(
                modifier = Modifier.size(20.dp).clearAndSetSemantics {},
                contentAlignment = Alignment.Center
            ) {
                CompositionLocalProvider(LocalContentColor provides ink) { icon() }
            }
        }
        Column(modifier = Modifier.weight(1f)) {
            if (label != null) {
                Text(
                    text = label,
                    color = labelInk,
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp, lineHeight = 14.sp)
                )
            }
            Text(
                text = title,
                color = ink,
                style = MaterialTheme.typography.bodySmall.copy(
                    fontSize = 13.sp,
                    lineHeight = 18.sp,
                    fontWeight = FontWeight.Medium
                )
            )
        }
        if (loading) {
            KozmosSpinner(
                modifier = Modifier.clearAndSetSemantics {},
                dimension = 20.dp,
                color = ink
            )
        } else if (!inert) {
            Icon(
                imageVector = Icons.Default.KeyboardArrowDown,
                contentDescription = null,
                tint = ink,
                modifier = Modifier.size(20.dp).rotate(rotation)
            )
        }
    }
}

@Composable
fun KozmosAccordionContent(
    value: String,
    selectedValue: String?,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val isExpanded = value == selectedValue
    if (LocalAccordionVariant.current == KozmosAccordionVariant.Boxed) {
        // In the page's flow under its header, 8 below it; still under reduced
        // motion, as React's is.
        val animationsOn = rememberKozmosAnimationsOn()
        AnimatedVisibility(
            visible = isExpanded,
            enter = if (animationsOn) expandVertically(KozmosTransitions.standard()) else EnterTransition.None,
            exit = if (animationsOn) shrinkVertically(KozmosTransitions.standard()) else ExitTransition.None
        ) {
            Column(modifier = modifier.padding(top = KozmosDimensions.primitivesLayoutSpacing100)) {
                content()
            }
        }
        return
    }
    AnimatedVisibility(visible = isExpanded) {
        Column(modifier = modifier.padding(horizontal = KozmosDimensions.primitivesLayoutSpacing200, vertical = KozmosDimensions.primitivesLayoutSpacing100)) {
            content()
        }
    }
}
