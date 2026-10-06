package com.kozmos.components.container

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** What a container's side padding responds to, as React's `inset`. */
enum class KozmosContainerInset {
    /** Steps 16, 24 and 32 with the width the container is given (from 640 and from 1024 dp): right for a page. */
    Window,
    /** 16 whatever the width: right for anything inside a fixed-width region, such as a map shell's sheet or side panel. */
    Panel;

    /** The side padding for a container this wide. */
    internal fun padding(width: Dp): Dp = when {
        this == Panel -> KozmosDimensions.primitivesLayoutSpacing200
        width >= 1024.dp -> KozmosDimensions.primitivesLayoutSpacing400
        width >= 640.dp -> KozmosDimensions.primitivesLayoutSpacing300
        else -> KozmosDimensions.primitivesLayoutSpacing200
    }
}

/** Pads all four sides by 16, as before [KozmosContainerInset]. */
@Composable
fun KozmosContainer(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Box(
        modifier = modifier.padding(KozmosDimensions.primitivesLayoutSpacing200)
    ) {
        content()
    }
}

/**
 * Fills the width and pads the sides only, as React's Container does:
 * [KozmosContainerInset.Panel] keeps 16, [KozmosContainerInset.Window] steps
 * with the width the container is given.
 */
@Composable
fun KozmosContainer(
    inset: KozmosContainerInset,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    BoxWithConstraints(modifier = modifier.fillMaxWidth()) {
        Box(Modifier.fillMaxWidth().padding(horizontal = inset.padding(maxWidth))) {
            content()
        }
    }
}
