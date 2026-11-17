package com.kozmos.components.tree

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Decision 211 (owner, 17 Nov), GAP-279: under the independent rule, a parent
 * whose enabled rows below are some but not all checked is mixed, drawn as
 * Checkbox's mixed box and heard as partly checked. Checking a mixed parent
 * checks it and every row below it; unchecking a checked parent unchecks
 * them. The exclusive rule, the default, is never mixed.
 */
class KozmosTreeMixedTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val clients = listOf(
        TreeNode(
            "acme", "Acme",
            listOf(
                TreeNode("acme-hq", "Acme HQ"),
                TreeNode("acme-lab", "Acme Lab"),
                TreeNode("acme-old", "Acme Old", disabled = true)
            )
        ),
        TreeNode(
            "globex", "Globex",
            listOf(
                TreeNode(
                    "globex-places", "Places",
                    listOf(TreeNode("globex-east", "Globex East"), TreeNode("globex-west", "Globex West")),
                    section = true
                )
            )
        ),
        TreeNode("initech", "Initech")
    )

    private val independent = KozmosTreeCheckRule.Independent

    @Test fun checkingAMixedParentChecksItAndEveryRowBelow() {
        assertEquals(
            "a mixed parent's check takes its enabled sites with it",
            setOf("acme-hq", "acme", "acme-lab"),
            toggleTreeCheck("acme", clients, setOf("acme-hq"), independent)
        )
        assertEquals(
            "through a section",
            setOf("globex-east", "globex", "globex-west"),
            toggleTreeCheck("globex", clients, setOf("globex-east"), independent)
        )
    }

    @Test fun uncheckingACheckedParentUnchecksEveryRowBelow() {
        assertEquals(
            setOf("initech"),
            toggleTreeCheck("acme", clients, setOf("acme", "acme-hq", "acme-lab", "initech"), independent)
        )
    }

    @Test fun anUncheckedParentChecksOnlyItself() {
        assertEquals(setOf("acme"), toggleTreeCheck("acme", clients, emptySet(), independent))
        assertEquals(
            "every site checked and the client not: the client alone",
            setOf("acme-hq", "acme-lab", "acme"),
            toggleTreeCheck("acme", clients, setOf("acme-hq", "acme-lab"), independent)
        )
    }

    @Test fun theExclusiveRuleIsUnchanged() {
        assertEquals(
            setOf("acme"),
            toggleTreeCheck("acme", clients, setOf("acme-hq"), KozmosTreeCheckRule.Exclusive)
        )
    }

    @Test fun talkBackHearsAMixedParentAsPartlyChecked() {
        val read = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Box(Modifier.size(300.dp, 500.dp)) {
                    KozmosTree(
                        clients,
                        selectionMode = KozmosTreeSelectionMode.Multiple,
                        selectedIds = setOf("acme-hq", "globex"),
                        onSelectedIdsChange = {},
                        expandedIds = emptySet(),
                        checkable = true,
                        checkRule = independent
                    )
                }
            }
        }
        fun row(name: String) = read.merged.single { name in it.texts && it.click != null }
        val acme = row("Acme")
        assertEquals(Role.Checkbox, acme.role)
        assertEquals(ToggleableState.Indeterminate, acme.toggleableState)
        assertEquals("Partially checked, Collapsed", acme.stateDescription)
        assertEquals("a checked parent with no site checked", ToggleableState.On, row("Globex").toggleableState)
        assertEquals(ToggleableState.Off, row("Initech").toggleableState)
    }
}
