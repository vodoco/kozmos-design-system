package com.kozmos.components.manoeuvrecard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.icon
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.LocalKozmosSurfaceStyle
import com.kozmos.components.surface.kozmosMutedForeground
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

/** What TalkBack hears for the closed card: the instruction, then the detail. */
fun manoeuvreDescription(instruction: String, detail: String?): String =
    if (detail.isNullOrEmpty()) instruction else "$instruction, $detail"

/**
 * The lines the instruction is cut at: none, unless the product asks for one
 * line or more.
 */
internal fun manoeuvreInstructionLineLimit(lines: Int?): Int? = lines?.takeIf { it >= 1 }

/** The parts of the manoeuvre card that can hold focus. */
internal enum class ManoeuvreCardPart { Instruction, Itinerary, Bar }

/**
 * Where focus goes as the card opens or closes, from the part it was on: null
 * leaves it where it is. Opening takes the instruction away, so focus on it
 * moves to Hide, the grab bar, in its place; closing takes the itinerary
 * away and silences the bar, so focus on either moves to the instruction.
 * Focus anywhere else was not in what changed. On the web the scrolling
 * itinerary takes focus as the card opens; here the itinerary is no stop of
 * its own — a focusable box around its steps would be a silent stop for
 * TalkBack — so Hide, the control that took the instruction's place, does.
 */
internal fun manoeuvreCardFocusAfter(expanded: Boolean, from: ManoeuvreCardPart?): ManoeuvreCardPart? =
    when {
        expanded && from == ManoeuvreCardPart.Instruction -> ManoeuvreCardPart.Bar
        !expanded && (from == ManoeuvreCardPart.Bar || from == ManoeuvreCardPart.Itinerary) -> ManoeuvreCardPart.Instruction
        else -> null
    }

/**
 * The current manoeuvre, floating over the map during navigation: its arrow,
 * the instruction, how far and how long, and a grab bar that opens the full
 * itinerary in its place. The card owns the toggle and what TalkBack hears
 * of it; the itinerary it opens into is the caller's — `KozmosItinerary`, in
 * the products — so the card never decides what a route is made of. Open,
 * the card is as tall as the itinerary up to `maxItineraryHeight`, past
 * which the itinerary scrolls: a long route must not cover the map.
 *
 * The instruction shows whole, and the card grows with it (GAP-094): two
 * lines cut ordinary instructions short of the level, the side, or in German
 * the turn itself. [instructionLines] sets a limit for a product that wants
 * one: the most lines drawn before an ellipsis; under one line is no limit.
 * TalkBack hears the whole instruction either way.
 *
 * Focus goes with the disclosure (review T4): focus on the part that the
 * change takes away moves to the part in its place — see
 * [manoeuvreCardFocusAfter] — whether a keyboard, TalkBack or the product
 * opened or closed the card. A tap moves no focus, and focus anywhere else
 * stays where it is.
 *
 * [instructionLines] sits after 0.5.0's parameters and before [itinerary],
 * so the itinerary stays last for a trailing lambda; the overload below
 * keeps 0.5.0's positional call.
 */
@Composable
fun KozmosManoeuvreCard(
    type: DirectionType,
    instruction: String,
    expanded: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
    detail: String? = null,
    expandLabel: String = "Show itinerary",
    collapseLabel: String = "Hide itinerary",
    manoeuvreLabel: String = "Current manoeuvre",
    maxItineraryHeight: Dp = 320.dp,
    surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
    instructionLines: Int? = null,
    itinerary: @Composable () -> Unit
) {
    val instructionFocus = remember { FocusRequester() }
    val barFocus = remember { FocusRequester() }
    // The part that has input focus, the keyboard's.
    var focused by remember { mutableStateOf<ManoeuvreCardPart?>(null) }
    // Read as the card recomposes for a change of `expanded`, while the part
    // that held focus is still there: once the change is applied the
    // instruction may be gone, and its focus with it.
    val focusedAtChange = remember(expanded) { focused }
    // An accessibility service (TalkBack, Switch Access) acts on the part its
    // own focus is on, and gives it no input focus: the part it opened or
    // closed the card from is where its focus was.
    var focusAfterToggle by remember { mutableStateOf<ManoeuvreCardPart?>(null) }
    fun toggleFromService(part: ManoeuvreCardPart) {
        focusAfterToggle = manoeuvreCardFocusAfter(!expanded, part)
        onToggle()
    }
    LaunchedEffect(expanded) {
        // Moving input focus is what TalkBack follows too: Compose says
        // TYPE_VIEW_FOCUSED as a node takes it.
        when (focusAfterToggle ?: manoeuvreCardFocusAfter(expanded, focusedAtChange)) {
            ManoeuvreCardPart.Bar -> barFocus.requestFocus()
            ManoeuvreCardPart.Instruction -> instructionFocus.requestFocus()
            else -> Unit
        }
        focusAfterToggle = null
    }
    Surface(
        // Open, the card has no name of its own: the itinerary inside is the
        // named thing, and two nodes called the same would be read twice.
        modifier = modifier.then(if (expanded) Modifier else Modifier.semantics { contentDescription = manoeuvreLabel }),
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer),
        color = KozmosSurfaceDefaults.tint(surface),
        border = KozmosSurfaceDefaults.border(surface),
        shadowElevation = 8.dp
    ) {
        // What the card holds is drawn on its surface: its muted text, and
        // the itinerary's, reads it (decision 48).
        CompositionLocalProvider(LocalKozmosSurfaceStyle provides surface) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(
                    start = KozmosDimensions.primitivesLayoutSpacing200,
                    top = KozmosDimensions.primitivesLayoutSpacing200,
                    end = KozmosDimensions.primitivesLayoutSpacing200,
                    bottom = KozmosDimensions.primitivesLayoutSpacing50
                )
        ) {
            if (expanded) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = maxItineraryHeight)
                        // Focus in what the product put in the itinerary.
                        .onFocusChanged { state ->
                            if (state.hasFocus) focused = ManoeuvreCardPart.Itinerary
                            else if (focused == ManoeuvreCardPart.Itinerary) focused = null
                        }
                        .verticalScroll(rememberScrollState())
                ) {
                    itinerary()
                }
            } else {
                // The instruction row is the button: a tap anywhere on it opens
                // the itinerary, and TalkBack hears the manoeuvre with the action.
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .focusRequester(instructionFocus)
                        .onFocusChanged { state ->
                            if (state.isFocused) focused = ManoeuvreCardPart.Instruction
                            else if (focused == ManoeuvreCardPart.Instruction) focused = null
                        }
                        // What an accessibility service's click does, in
                        // place of the one the click below gives it: the same
                        // toggle, from where that service's focus is.
                        .semantics {
                            onClick(label = expandLabel) { toggleFromService(ManoeuvreCardPart.Instruction); true }
                        }
                        .clickable(onClickLabel = expandLabel, role = Role.Button, onClick = onToggle)
                        .semantics(mergeDescendants = true) {
                            contentDescription = manoeuvreDescription(instruction, detail)
                            expand { toggleFromService(ManoeuvreCardPart.Instruction); true }
                        },
                    verticalAlignment = Alignment.Top
                ) {
                    Box(
                        modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing400),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = type.icon(),
                            contentDescription = null,
                            tint = KozmosThemeTokens.primitivesColorsTheme500,
                            modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing300)
                        )
                    }
                    Column(modifier = Modifier.weight(1f).padding(start = KozmosDimensions.primitivesLayoutSpacing150)) {
                        // Whole unless the product asks for a limit (GAP-094).
                        Text(
                            text = instruction,
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.SemiBold),
                            color = KozmosThemeTokens.primitivesColorsForeground100,
                            maxLines = manoeuvreInstructionLineLimit(instructionLines) ?: Int.MAX_VALUE,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (!detail.isNullOrEmpty()) {
                            // Muted, and on glass the foreground colour
                            // (decision 48).
                            Text(
                                text = detail,
                                style = MaterialTheme.typography.bodyMedium,
                                color = kozmosMutedForeground()
                            )
                        }
                    }
                }
            }
            // The grab bar: the sign that the card opens, and the way to close
            // it. Closed, the instruction row already offers the way in.
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = KozmosDimensions.primitivesLayoutSpacing150)
                    .focusRequester(barFocus)
                    .onFocusChanged { state ->
                        if (state.isFocused) focused = ManoeuvreCardPart.Bar
                        else if (focused == ManoeuvreCardPart.Bar) focused = null
                    }
                    // Closed, the bar has no semantics at all — the cleared
                    // node hides the click that follows it — so TalkBack
                    // never lands on a second way to do what the row does.
                    .then(
                        if (expanded) {
                            Modifier.semantics {
                                contentDescription = collapseLabel
                                onClick(label = collapseLabel) { toggleFromService(ManoeuvreCardPart.Bar); true }
                                collapse { toggleFromService(ManoeuvreCardPart.Bar); true }
                            }
                        } else {
                            Modifier.clearAndSetSemantics { }
                        }
                    )
                    // Nor is it a stop for the keyboard while it is silent:
                    // focus there would be on something TalkBack cannot see.
                    .focusProperties { canFocus = expanded }
                    .clickable(onClick = onToggle, role = Role.Button)
                    .padding(vertical = KozmosDimensions.primitivesLayoutSpacing50),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .width(36.dp)
                        .height(5.dp)
                        .background(KozmosThemeTokens.primitivesColorsBackground300, CircleShape)
                )
            }
        }
        }
    }
}

/**
 * [KozmosManoeuvreCard] as 0.5.0 declared it: its parameters, in its order,
 * [itinerary] last. A call that passes them by position still compiles, and
 * so does one that passes the itinerary as a trailing lambda: a parameter
 * added since, instructionLines, sits before itinerary so that the lambda
 * stays last, and this overload keeps the positional call. It draws the card
 * the full one does, with the whole instruction.
 */
@Composable
fun KozmosManoeuvreCard(
    type: DirectionType,
    instruction: String,
    expanded: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
    detail: String? = null,
    expandLabel: String = "Show itinerary",
    collapseLabel: String = "Hide itinerary",
    manoeuvreLabel: String = "Current manoeuvre",
    maxItineraryHeight: Dp = 320.dp,
    surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
    itinerary: @Composable () -> Unit
) {
    KozmosManoeuvreCard(
        type = type,
        instruction = instruction,
        expanded = expanded,
        onToggle = onToggle,
        modifier = modifier,
        detail = detail,
        expandLabel = expandLabel,
        collapseLabel = collapseLabel,
        manoeuvreLabel = manoeuvreLabel,
        maxItineraryHeight = maxItineraryHeight,
        surface = surface,
        instructionLines = null,
        itinerary = itinerary
    )
}
