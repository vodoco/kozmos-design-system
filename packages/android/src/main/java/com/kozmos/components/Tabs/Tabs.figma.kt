package com.kozmos.components.tabs

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

// Content=Label: the words alone, the tabs as they have always been.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=90-3387")
@FigmaVariant("Content", "Label")
class KozmosTabsConnect {
    @FigmaProperty(FigmaType.Enum, "Active")
    val activeValue: String = Figma.mapping(
        "One" to "one",
        "Two" to "two",
        "Three" to "three",
        "Four" to "four"
    )

    @FigmaProperty(FigmaType.Text, "Tab 1 Text")
    val tab1Text: String = "Overview"

    @FigmaProperty(FigmaType.Text, "Tab 2 Text")
    val tab2Text: String = "Details"

    @FigmaProperty(FigmaType.Text, "Tab 3 Text")
    val tab3Text: String = "Usage"

    @FigmaProperty(FigmaType.Text, "Tab 4 Text")
    val tab4Text: String = "Settings"

    @Composable
    fun ComponentExample() {
        KozmosTabs {
            KozmosTabsList {
                KozmosTabsTrigger(
                    value = "one",
                    title = tab1Text,
                    selectedValue = activeValue,
                    onValueChange = {}
                )
                KozmosTabsTrigger(
                    value = "two",
                    title = tab2Text,
                    selectedValue = activeValue,
                    onValueChange = {}
                )
                KozmosTabsTrigger(
                    value = "three",
                    title = tab3Text,
                    selectedValue = activeValue,
                    onValueChange = {}
                )
                KozmosTabsTrigger(
                    value = "four",
                    title = tab4Text,
                    selectedValue = activeValue,
                    onValueChange = {}
                )
            }
            KozmosTabsContent(
                value = activeValue,
                selectedValue = activeValue
            ) {
                Text("${activeLabel()} content")
            }
        }
    }

    private fun activeLabel(): String = when (activeValue) {
        "two" -> tab2Text
        "three" -> tab3Text
        "four" -> tab4Text
        else -> tab1Text
    }
}

// Content=Icon Over Label (GAP-152): each trigger's icon is the instance
// swapped into its Tab N Icon. The parser writes an instance property's own
// snippet where its name stands, so `{ tab1Icon }` is generated as
// `{ KozmosIcon(…) }`, the slot drawing that icon. A call, `tab1Icon()`,
// would be generated as `KozmosIcon(…)()`.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=90-3387")
@FigmaVariant("Content", "Icon Over Label")
class KozmosTabsIconOverLabelConnect {
    @FigmaProperty(FigmaType.Enum, "Active")
    val activeValue: String = Figma.mapping(
        "One" to "one",
        "Two" to "two",
        "Three" to "three",
        "Four" to "four"
    )

    @FigmaProperty(FigmaType.Text, "Tab 1 Text")
    val tab1Text: String = "Overview"

    @FigmaProperty(FigmaType.Text, "Tab 2 Text")
    val tab2Text: String = "Details"

    @FigmaProperty(FigmaType.Text, "Tab 3 Text")
    val tab3Text: String = "Usage"

    @FigmaProperty(FigmaType.Text, "Tab 4 Text")
    val tab4Text: String = "Settings"

    @FigmaProperty(FigmaType.Instance, "Tab 1 Icon")
    val tab1Icon: @Composable () -> Unit = {}

    @FigmaProperty(FigmaType.Instance, "Tab 2 Icon")
    val tab2Icon: @Composable () -> Unit = {}

    @FigmaProperty(FigmaType.Instance, "Tab 3 Icon")
    val tab3Icon: @Composable () -> Unit = {}

    @FigmaProperty(FigmaType.Instance, "Tab 4 Icon")
    val tab4Icon: @Composable () -> Unit = {}

    @Composable
    fun ComponentExample() {
        KozmosTabs {
            KozmosTabsList {
                KozmosTabsTrigger(
                    value = "one",
                    title = tab1Text,
                    selectedValue = activeValue,
                    onValueChange = {},
                    icon = { tab1Icon }
                )
                KozmosTabsTrigger(
                    value = "two",
                    title = tab2Text,
                    selectedValue = activeValue,
                    onValueChange = {},
                    icon = { tab2Icon }
                )
                KozmosTabsTrigger(
                    value = "three",
                    title = tab3Text,
                    selectedValue = activeValue,
                    onValueChange = {},
                    icon = { tab3Icon }
                )
                KozmosTabsTrigger(
                    value = "four",
                    title = tab4Text,
                    selectedValue = activeValue,
                    onValueChange = {},
                    icon = { tab4Icon }
                )
            }
            KozmosTabsContent(
                value = activeValue,
                selectedValue = activeValue
            ) {
                Text("${activeLabel()} content")
            }
        }
    }

    private fun activeLabel(): String = when (activeValue) {
        "two" -> tab2Text
        "three" -> tab3Text
        "four" -> tab4Text
        else -> tab1Text
    }
}
