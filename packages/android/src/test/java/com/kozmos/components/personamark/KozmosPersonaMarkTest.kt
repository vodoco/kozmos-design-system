package com.kozmos.components.personamark

import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.semantics.Role
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.PersonaRow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.sqrt

/**
 * `KozmosPersonaMark` and `KozmosPersonaMarkGroup` (GAP-106): a persona's
 * colour as a diamond, decoration beside its name, an image standing alone,
 * and a row's personas as one image read by their names.
 */
class KozmosPersonaMarkTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val personas = listOf(
        KozmosPersonaMarkPersona("Customer", Color(0xFFFF9800)),
        KozmosPersonaMarkPersona("Visitor", Color(0xFF2196F3)),
        KozmosPersonaMarkPersona("Staff", Color(0xFF4CAF50))
    )

    /** PersonaMark.mdx's snippet: beside its name the mark is hidden, and the name read once. */
    @Test fun besideItsNameTheMarkIsHiddenAndTheNameReadOnce() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { PersonaRow() } }
        assertEquals(listOf("Customer"), tree.merged.mapNotNull { it.words })
        assertTrue("no image", tree.merged.none { it.role == Role.Image })
    }

    @Test fun standingAloneTheMarkIsAnImageNamedByThePersona() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosPersonaMark(color = Color(0xFF2196F3), name = "Visitor") }
        }
        assertEquals(listOf("Visitor"), tree.merged.mapNotNull { it.words })
        assertEquals(Role.Image, tree.named("Visitor").role)
    }

    @Test fun theGroupIsOneImageReadByItsLabelAndEveryName() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { KozmosPersonaMarkGroup(personas) } }
        assertEquals(listOf("Assigned personas: Customer, Visitor, Staff"), tree.merged.mapNotNull { it.words })
        assertEquals(Role.Image, tree.named("Assigned personas: Customer, Visitor, Staff").role)
        val german = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosPersonaMarkGroup(personas, label = "Zugewiesene Personas") }
        }
        assertEquals(listOf("Zugewiesene Personas: Customer, Visitor, Staff"), german.merged.mapNotNull { it.words })
    }

    /** React's 12 by 12; a group's marks 2 apart: 3 × 12 + 2 × 2. */
    @Test fun theMarkIs12dpSquareAndTheGroupsMarks2Apart() {
        val density = paparazzi.context.resources.displayMetrics.density
        val mark = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosPersonaMark(color = Color(0xFFFF9800), name = "Customer") }
        }.named("Customer")
        assertEquals("width in dp", 12f, mark.bounds.width / density, 0.5f)
        assertEquals("height in dp", 12f, mark.bounds.height / density, 0.5f)
        val group = paparazzi.readSemantics { KozmosMaterialTheme { KozmosPersonaMarkGroup(personas) } }
            .named("Assigned personas: Customer, Visitor, Staff")
        assertEquals("width in dp", 40f, group.bounds.width / density, 0.5f)
        assertEquals("height in dp", 12f, group.bounds.height / density, 0.5f)
    }

    @Test fun aGroupWithNoPersonaDrawsNothing() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { KozmosPersonaMarkGroup(emptyList()) } }
        assertEquals(emptyList<String>(), tree.merged.mapNotNull { it.words })
    }

    /** The diamond's points are on the box's edge midpoints. */
    @Test fun theShapeIsADiamond() {
        val bounds = kozmosDiamondPath(Size(12f, 12f)).getBounds()
        assertEquals(0f, bounds.left, 0.01f)
        assertEquals(0f, bounds.top, 0.01f)
        assertEquals(12f, bounds.right, 0.01f)
        assertEquals(12f, bounds.bottom, 0.01f)
        // Four sides from midpoint to midpoint, each √72: not the box's 48.
        val measure = PathMeasure().apply { setPath(kozmosDiamondPath(Size(12f, 12f)), true) }
        assertEquals(4f * sqrt(72f), measure.length, 0.01f)
    }
}
