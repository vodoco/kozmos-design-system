package com.kozmos.components.poimediagallery

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyListLayoutInfo
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import coil.compose.AsyncImage
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.surface.kozmosMutedForeground
import com.kozmos.contracts.KozmosPOIMediaPresentation
import com.kozmos.tokens.KozmosDimensions
import kotlin.math.abs

/**
 * A horizontally paged gallery of POI photography.
 *
 * Mirrors the React `POIMediaGallery` and the SwiftUI gallery, including their
 * controlled/uncontrolled index: pass [activeIndex] to control it, otherwise
 * it tracks its own position from [defaultActiveIndex]. The counter, the
 * arrows and the strip agree on one index. Scrolling the strip moves the
 * index; moving the index — an arrow, a new controlled value, fewer or
 * different photos, a narrower strip — moves the strip, at once and without
 * animation. A controlled parent that refuses a change keeps the strip where
 * its index is. [onActiveIndexChange] is called once for each change the
 * visitor asks for, and never for the gallery lining its strip up with an
 * index it was given. Renders nothing when [media] is empty, so venues
 * without licensed imagery simply show no gallery.
 *
 * Each photo fills a 4:3 tile 85% of the gallery's width, so the next one
 * shows, and is cropped to fill it — the tile iOS and the web draw. The tile
 * whose leading edge is nearest the strip's is the photo shown; at the end of
 * the strip, where the last tile cannot reach the leading edge, that is still
 * the last tile, at any width.
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
    val currentIndex = (activeIndex ?: internalIndex).coerceIn(0, media.lastIndex)
    // Laid out at the index from its first frame: the strip used to start at
    // the first photo whatever the index said.
    val listState = rememberLazyListState(initialFirstVisibleItemIndex = currentIndex)
    // The tile nearest the strip's leading edge, as last laid out.
    var shownIndex by remember { mutableStateOf<Int?>(null) }

    // An index past the end of fewer photos, or a starting one out of range,
    // is brought in without a report, as the web gallery does.
    SideEffect {
        if (activeIndex == null && internalIndex != currentIndex) internalIndex = currentIndex
    }

    fun select(index: Int) {
        val next = index.coerceIn(0, media.lastIndex)
        if (next == currentIndex) return
        if (activeIndex == null) internalIndex = next
        onActiveIndexChange?.invoke(next)
    }

    val latestIndex by rememberUpdatedState(currentIndex)
    val latestSelect by rememberUpdatedState(::select)

    // Strip to index. Only a scroll the gallery did not make selects: the
    // visitor's finger, or TalkBack's scroll. A layout — the first one, new
    // photos, a new width — is only watched.
    LaunchedEffect(listState) {
        snapshotFlow { listState.isScrollInProgress to nearestGalleryTile(listState.layoutInfo) }
            .collect { (scrolling, nearest) ->
                if (nearest == null) return@collect
                shownIndex = nearest
                if (scrolling && nearest != latestIndex) latestSelect(nearest)
            }
    }

    // Index to strip, once nothing is scrolling it: an arrow, a controlled
    // index, fewer photos, or a refusal the visitor's scroll ran into. At
    // once, with no forced motion, as on the web and iOS.
    val scrolling = listState.isScrollInProgress
    LaunchedEffect(currentIndex, shownIndex, scrolling) {
        val shown = shownIndex ?: return@LaunchedEffect
        if (!scrolling && shown != currentIndex) listState.scrollToItem(currentIndex)
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
                        onClick = { select(currentIndex - 1) },
                        contentDescription = previousLabel,
                        enabled = currentIndex > 0
                    )
                    KozmosIconButton(
                        icon = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        onClick = { select(currentIndex + 1) },
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
                        .fillParentMaxWidth(GALLERY_TILE_WIDTH_FRACTION)
                        .aspectRatio(GALLERY_TILE_ASPECT_RATIO)
                        .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusPanel))
                )
            }
        }
    }
}

/** Each tile's share of the strip's width, so the next one shows: iOS's and the web's. */
internal const val GALLERY_TILE_WIDTH_FRACTION = 0.85f

/** A tile's width over its height: 4:3, iOS's and the web's. */
internal const val GALLERY_TILE_ASPECT_RATIO = 4f / 3f

/**
 * The tile whose leading edge is nearest the strip's leading edge: the web's
 * and iOS's rule. [tiles] pairs each laid-out tile's index with its offset
 * from the strip's leading edge, which LazyRow measures from the leading edge
 * in either reading direction. The earlier tile wins a tie.
 */
internal fun nearestGalleryTile(tiles: List<Pair<Int, Int>>): Int? =
    tiles.minWithOrNull(compareBy<Pair<Int, Int>>({ abs(it.second) }, { it.first }))?.first

private fun nearestGalleryTile(info: LazyListLayoutInfo): Int? =
    nearestGalleryTile(info.visibleItemsInfo.map { it.index to it.offset - info.viewportStartOffset })
