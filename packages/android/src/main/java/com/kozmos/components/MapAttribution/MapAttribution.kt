package com.kozmos.components.mapattribution

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.R
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.utils.kozmosSafeLink

enum class KozmosMapAttributionAppearance { Map, Surface }

/** Ordered presentation data, supplied by the host; IDs must be unique. */
data class KozmosMapAttributionCredit(val id: String, val label: String, val href: String? = null) {
    internal val destination: String?
        get() = kozmosSafeLink(href)
}

/**
 * Provider-neutral credits and optional approved brand content.
 * Hiding the brand never hides credits. No SDK detection, dates or provider copy.
 * An omitted brand uses bundled Pointr artwork. The host owns replacement assets,
 * placement, destinations and deduplication.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun KozmosMapAttribution(
    credits: List<KozmosMapAttributionCredit>,
    modifier: Modifier = Modifier,
    brand: (@Composable () -> Unit)? = null,
    showBrand: Boolean = true,
    label: String = "Map attribution",
    appearance: KozmosMapAttributionAppearance = KozmosMapAttributionAppearance.Map
) {
    if (credits.isEmpty() && !showBrand) return
    val uriHandler = LocalUriHandler.current
    Column(
        modifier = modifier
            .then(if (appearance == KozmosMapAttributionAppearance.Surface)
                Modifier.background(KozmosThemeTokens.primitivesColorsBackground0, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
                else Modifier)
            .padding(
                start = KozmosDimensions.primitivesLayoutSpacing100,
                top = KozmosDimensions.primitivesLayoutSpacing100,
                end = KozmosDimensions.primitivesLayoutSpacing100,
                bottom = if (appearance == KozmosMapAttributionAppearance.Surface) KozmosDimensions.primitivesLayoutSpacing100 else 0.dp
            )
            .semantics { paneTitle = label; isTraversalGroup = true },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
    ) {
        if (showBrand) {
            if (brand != null) brand() else Image(
                painter = painterResource(R.drawable.kozmos_pointr_logo),
                contentDescription = "Pointr",
                modifier = Modifier.size(width = 98.dp, height = 34.dp)
            )
        }
        if (credits.isNotEmpty()) {
          BoxWithConstraints {
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()).widthIn(min = maxWidth)
                    .padding(start = 2.dp, top = 2.dp, end = 2.dp,
                        bottom = if (appearance == KozmosMapAttributionAppearance.Surface) 2.dp else 0.dp),
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50, Alignment.CenterHorizontally)
            ) {
                credits.forEach { credit ->
                    val destination = credit.destination
                    Box(
                        modifier = Modifier
                            .then(if (destination != null) Modifier.clickable(role = Role.Button) { uriHandler.openUri(destination) } else Modifier),
                        contentAlignment = Alignment.Center
                    ) {
                        // Decorative copies share the foreground's measured bounds,
                        // font and wrapping, but expose no duplicate semantics/actions.
                        if (appearance == KozmosMapAttributionAppearance.Map) {
                            val width = KozmosDimensions.semanticsMapAttributionHaloWidth
                            val offsets = listOf(-1 to -1, 0 to -1, 1 to -1, -1 to 0, 1 to 0, -1 to 1, 0 to 1, 1 to 1)
                            for ((x, y) in offsets) {
                                Text(
                                    text = credit.label,
                                    modifier = Modifier.matchParentSize().offset(width * x, width * y).clearAndSetSemantics {},
                                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp, lineHeight = 14.sp),
                                    maxLines = 1, softWrap = false,
                                    color = KozmosThemeTokens.semanticsMapAttributionHalo,
                                    textAlign = TextAlign.Center,
                                    textDecoration = if (destination != null) TextDecoration.Underline else null
                                )
                            }
                        }
                        Text(
                            text = credit.label,
                            style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp, lineHeight = 14.sp),
                            maxLines = 1, softWrap = false,
                            color = if (appearance == KozmosMapAttributionAppearance.Map) KozmosThemeTokens.semanticsMapAttributionText else KozmosThemeTokens.primitivesColorsForeground300,
                            textAlign = TextAlign.Center,
                            textDecoration = if (destination != null) TextDecoration.Underline else null
                        )
                    }
                }
            }
          }
        }
    }
}
