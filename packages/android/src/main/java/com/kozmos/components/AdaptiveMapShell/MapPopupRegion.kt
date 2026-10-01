package com.kozmos.components.adaptivemapshell

import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.IntRect

internal data class MapPopupRegion(val bounds: IntRect, val available: Boolean)
internal val LocalMapPopupRegion = staticCompositionLocalOf<MapPopupRegion?> { null }
