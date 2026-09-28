package com.kozmos.components.poimediagallery

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.kozmos.components.adaptivemapshell.kozmosMutedForeground
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.contracts.KozmosPOIMediaPresentation
import com.kozmos.tokens.KozmosDimensions
import kotlinx.coroutines.launch

/**
 * A horizontally paged gallery of POI photography.
 *
 * Mirrors the React `POIMediaGallery`, including its controlled/uncontrolled
 * index behaviour: pass [activeIndex] to drive it externally, otherwise the
 * gallery tracks its own position. Renders nothing when [media] is empty, so
 * venues without licensed imagery simply show no gallery.
 */
@Composable
fun KozmosPOIMediaGallery(
    media: List<KozmosPOIMediaPresentation>,
    label: String,
    positionLabel: (Int, Int) -> String,
    modifier: Modifier = Modifier,
    activeIndex: Int? = null,
    defaultActiveIndex: Int = 0,
    previousLabel: String = "Previous image",
    nextLabel: String = "Next image",
    onActiveIndexChange: ((Int) -> Unit)? = null
) {
    if (media.isEmpty()) return

    var internalIndex by remember { mutableIntStateOf(defaultActiveIndex) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    val currentIndex = (activeIndex ?: internalIndex).coerceIn(0, media.lastIndex)

    fun selectIndex(index: Int) {
        val nextIndex = index.coerceIn(0, media.lastIndex)
        if (activeIndex == null) internalIndex = nextIndex
        onActiveIndexChange?.invoke(nextIndex)
        scope.launch { listState.animateScrollToItem(nextIndex) }
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .semantics { contentDescription = label },
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // On the shell's glass panel the position takes the foreground
            // colour, so it reads at 4.5:1 over any map (decision 48); a
            // details card says which surface it sits on.
            Text(
                text = positionLabel(currentIndex + 1, media.size),
                style = MaterialTheme.typography.bodySmall,
                color = kozmosMutedForeground(),
                modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite }
            )

            if (media.size > 1) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(
                        KozmosDimensions.primitivesLayoutSpacing100
                    ),
                    modifier = Modifier.semantics { contentDescription = "$label controls" }
                ) {
                    KozmosIconButton(
                        icon = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                        onClick = { selectIndex(currentIndex - 1) },
                        contentDescription = previousLabel,
                        enabled = currentIndex > 0
                    )
                    KozmosIconButton(
                        icon = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        onClick = { selectIndex(currentIndex + 1) },
                        contentDescription = nextLabel,
                        enabled = currentIndex < media.lastIndex
                    )
                }
            }
        }

        LazyRow(
            state = listState,
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
        ) {
            items(media, key = { it.id }) { item ->
                AsyncImage(
                    model = item.src,
                    contentDescription = item.alt,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .width(260.dp)
                        .height(195.dp)
                        .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusPanel))
                )
            }
        }
    }
}
