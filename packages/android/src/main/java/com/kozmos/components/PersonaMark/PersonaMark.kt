package com.kozmos.components.personamark

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosDimensions

/**
 * A persona's colour mark (GAP-106): a small diamond in the persona's colour,
 * as Pointr Cloud marks each persona in its Map Persona Visibility list.
 *
 * The colour is product data, the persona's own, drawn as given in both
 * themes, as `KozmosCategoryTint` takes a category's. Beside the persona's
 * name the mark is decoration, hidden from TalkBack, so the name is read
 * once; given [name], it stands alone, an image named by it.
 *
 * Drawn as React's `<PersonaMark>` is: 12 by 12, a square turned an eighth,
 * its points on the box's edges.
 *
 * @param color The persona's colour, as the product holds it.
 * @param name The persona's name, for a mark that stands alone. Leave it out
 *   when the name is shown beside the mark.
 */
@Composable
fun KozmosPersonaMark(
    color: Color,
    modifier: Modifier = Modifier,
    name: String? = null
) {
    KozmosPersonaDiamond(
        color = color,
        modifier = modifier.clearAndSetSemantics {
            if (name != null) {
                contentDescription = name
                role = Role.Image
            }
        }
    )
}

/** One persona in a [KozmosPersonaMarkGroup]: its name and its colour. */
@Immutable
data class KozmosPersonaMarkPersona(val name: String, val color: Color)

/**
 * The personas something is visible to, as a row of marks 2 apart: a tree
 * row's "Assigned personas" (GAP-106).
 *
 * One TalkBack node, an image read as [label] and every persona's name:
 * "Assigned personas: Customer, Visitor". With no persona it draws nothing.
 *
 * @param personas The personas, each drawn as its mark, in this order.
 * @param label What the group is, read before the names. English by default;
 *   pass the product's own words.
 */
@Composable
fun KozmosPersonaMarkGroup(
    personas: List<KozmosPersonaMarkPersona>,
    modifier: Modifier = Modifier,
    label: String = "Assigned personas"
) {
    if (personas.isEmpty()) return
    val spoken = kozmosPersonaMarkGroupLabel(personas, label)
    Row(
        modifier = modifier.clearAndSetSemantics {
            contentDescription = spoken
            role = Role.Image
        },
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing25),
        verticalAlignment = Alignment.CenterVertically
    ) {
        personas.forEach { persona -> KozmosPersonaDiamond(color = persona.color) }
    }
}

/** What TalkBack reads for a group: the label, then the names. */
internal fun kozmosPersonaMarkGroupLabel(personas: List<KozmosPersonaMarkPersona>, label: String): String =
    "$label: ${personas.joinToString(", ") { it.name }}"

/** The diamond, 12 by 12: React's `.kozmos-persona-mark-shape`. No token is 12. */
@Composable
private fun KozmosPersonaDiamond(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(12.dp)) {
        drawPath(kozmosDiamondPath(size), color)
    }
}

/** A square turned an eighth: its points on the box's edge midpoints. */
internal fun kozmosDiamondPath(size: Size): Path = Path().apply {
    moveTo(size.width / 2f, 0f)
    lineTo(size.width, size.height / 2f)
    lineTo(size.width / 2f, size.height)
    lineTo(0f, size.height / 2f)
    close()
}
